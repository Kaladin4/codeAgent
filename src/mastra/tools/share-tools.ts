import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { logError, logTool } from '../../infra/logger-service'
import util from 'util'

const findFileInDirectory = async (
  fileName: string,
  dirPath: string = process.env.PWD || process.cwd(), // Accept a directory path, defaulting to current directory
): Promise<string | null> => {
  try {
    const files = await fs.promises.readdir(dirPath)

    for (const file of files) {
      const fullPath = path.join(dirPath, file)
      const stat = await fs.promises.stat(fullPath)

      if (stat.isDirectory()) {
        // Recursively search in the subdirectory
        const found = await findFileInDirectory(fileName, fullPath)
        if (found) return found
      } else if (file === fileName) {
        // Found the file
        return fullPath
      }
    }

    // File not found in this directory or its subdirectories
    return null
  } catch (err) {
    logError(
      'findFileInDirectory',
      `Failed to search for file "${fileName}" in directory "${dirPath}"`,
      err,
    )
    return null
  }
}

export const findFileInDirectoryTool = createTool({
  id: 'find-file',
  description: 'Use when you need to find a file in the current directory',
  inputSchema: z.object({
    fileName: z.string().describe('The name of the file to find'),
  }),
  outputSchema: z
    .string()
    .nullable()
    .describe('full path of the fle if found, null if not'),
  execute: async ({ context: { fileName } }) => {
    logTool('Using tool to find file', fileName)
    logTool('findFileInDirectoryTool', `Searching for file: ${fileName}`)
    return await findFileInDirectory(fileName)
  },
})

const countFileLines = async (filePath: string): Promise<{ lines: number }> => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const fullPath = path.resolve(terminalCwd, filePath)
    const content = await fs.promises.readFile(fullPath, 'utf-8')
    return { lines: content.split('\n').length }
  } catch (err) {
    logError(
      'countFileLines',
      `Failed to count lines in file: ${filePath}`,
      err,
    )
    return { lines: 0 }
  }
}

export const countFileLinesTool = createTool({
  id: 'count-lines',
  description: 'Use when you need to count the number of lines in a file',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the file to count lines'),
  }),
  outputSchema: z.object({
    lines: z.number().describe('file lines amount'),
  }),
  execute: async ({ context: { filePath } }) => {
    logTool('Using tool to count lines in', filePath)
    return await countFileLines(filePath)
  },
})

const listDirFiles = async (dirPath: string) => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const fullDirPath = path.resolve(terminalCwd, dirPath)

    const files = await fs.promises.readdir(fullDirPath)
    const results = await Promise.all(
      files.map(async (file) => {
        return file
      }),
    )
    return { files: results }
  } catch (err) {
    logError('listDirFiles', `Failed to list files in: ${dirPath}`, err)
    return { files: [] }
  }
}

export const listDirTool = createTool({
  id: 'ls',
  description: 'Use when you want to list the files of a given folder',
  inputSchema: z.object({
    dirPath: z
      .string()
      .describe('The path to the folder of you are accesing to'),
  }),
  outputSchema: z.object({
    files: z.array(z.string()).describe('The array of files'),
  }),
  execute: async ({ context: { dirPath } }) => {
    logTool('listDirTool', `Listing files in: ${dirPath}`)
    return await listDirFiles(dirPath)
  },
})
const execAsync = util.promisify(exec)

export const executeCommand = async (command: string, cwd?: string) => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const execCwd = cwd ? path.resolve(terminalCwd, cwd) : terminalCwd

    const { stdout } = await execAsync(command, { cwd: execCwd })

    return {
      success: true,
      output: stdout || '', // Always ensure string
    }
  } catch (error: any) {
    logError('executeCommand', `Command failed: ${command}`, error)

    // Prefer stderr for feedback, fallback to message or generic error
    const output =
      error?.stderr || error?.stdout || error?.message || 'Unknown error'

    return {
      success: false,
      output,
    }
  }
}

export const execTool = createTool({
  id: 'exec',
  description: 'Use when you need to execute a command',
  inputSchema: z.object({
    command: z.string().describe('The command to execute'),
  }),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe('Boolean value describing the succes of the edit'),
    output: z.string().describe('Output of the command'),
  }),
  execute: async ({ context: { command } }) => {
    logTool('Using tool to execute command:', command)
    return await executeCommand(command)
  },
})

export const getCurrentPathTool = createTool({
  id: 'pwd',
  description: 'Use when you need to get the current working directory path',
  inputSchema: z.object({}),
  outputSchema: z.object({
    path: z.string().describe('Current path'),
  }),
  execute: async () => {
    const terminalCwd = process.env.PWD || process.cwd() // Get terminal's CWD
    return { path: terminalCwd }
  },
})

const readFileContent = async (filePath: string) => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const fullPath = path.resolve(terminalCwd, filePath)
    const content = await fs.promises.readFile(fullPath, 'utf-8')
    return { content }
  } catch (err) {
    logError('readFileContent', `Failed to read file: ${filePath}`, err)
    return { content: '' }
  }
}

export const readFileTool = createTool({
  id: 'cat',
  description: 'Use when you need to read the content of a file',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the file to read'),
  }),
  outputSchema: z.object({
    content: z.string().describe('Content read'),
  }),
  execute: async ({ context: { filePath } }) => {
    logTool('readFileTool', `Reading content from: ${filePath}`)
    return await readFileContent(filePath)
  },
})

const searchDir = async (
  dirPath: string,
  searchTerm: string,
): Promise<{ files: string[] }> => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const fullDirPath = path.resolve(terminalCwd, dirPath)
    const files = await fs.promises.readdir(fullDirPath)
    const matchingFiles: string[] = []

    for (const file of files) {
      const fullPath = path.join(fullDirPath, file)
      if (fullPath.includes('test')) {
        continue
      }

      const stat = await fs.promises.stat(fullPath)
      if (stat.isDirectory()) {
        const subdirResults = await searchDir(fullPath, searchTerm)
        matchingFiles.push(...subdirResults.files)
      } else {
        const content = await fs.promises.readFile(fullPath, 'utf-8')
        if (content.includes(searchTerm)) {
          matchingFiles.push(fullPath)
        }
      }
    }

    return { files: matchingFiles }
  } catch (err) {
    logError(
      'searchDir',
      `Failed to search "${dirPath}" for "${searchTerm}"`,
      err,
    )
    return { files: [] }
  }
}

export const searchDirTool = createTool({
  id: 'search-files-text',
  description: 'Use when you need to find files containing a search term',
  inputSchema: z.object({
    dirPath: z.string().describe('Directory path to search in'),
    searchTerm: z.string().describe('Text to search for in files'),
  }),
  outputSchema: z.object({
    files: z.array(z.string()),
  }),
  execute: async ({ context: { dirPath, searchTerm } }) => {
    logTool('searchDirTool', `Searching for "${searchTerm}" in ${dirPath}`)
    return await searchDir(dirPath, searchTerm)
  },
})

const searchFileLines = async (
  filePath: string,
  searchTerm: string,
): Promise<{ lines: string[] }> => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const fullPath = path.resolve(terminalCwd, filePath)
    const content = await fs.promises.readFile(fullPath, 'utf-8')
    const lines = content
      .split('\n')
      .filter((line) => line.includes(searchTerm))
    return { lines }
  } catch (err) {
    logError(
      'searchFileLines',
      `Failed to search file "${filePath}" for "${searchTerm}"`,
      err,
    )
    return { lines: [] }
  }
}

export const searchFileLinesTool = createTool({
  id: 'search-lines',
  description:
    'Use when you need to find lines in a file containing a search term',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the file to search'),
    searchTerm: z.string().describe('Text to search for in file lines'),
  }),
  outputSchema: z.object({
    lines: z.array(z.string()),
  }),
  execute: async ({ context: { filePath, searchTerm } }) => {
    logTool(
      'searchFileLinesTool',
      `Using tool to search for "${searchTerm}" in ${filePath}`,
    )
    return await searchFileLines(filePath, searchTerm)
  },
})

export const appendToFile = async (filePath: string, text: string) => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const fullPath = path.resolve(terminalCwd, filePath)
    await fs.promises.appendFile(fullPath, text)
    return { success: true }
  } catch (err) {
    logError('appendToFile', `Failed to append to file: ${filePath}`, err)
    return { success: false }
  }
}

export const appendFileTool = createTool({
  id: 'append-text',
  description: 'Use when you need to append text to the end of a file',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the file to modify'),
    text: z.string().describe('Text to append'),
  }),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe('Boolean value describing the succes of the edit'),
  }),
  execute: async ({ context: { filePath, text } }) => {
    logTool('appendFileTool', `Appending text to: ${filePath}`)
    return await appendToFile(filePath, text)
  },
})
