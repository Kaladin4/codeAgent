import { z } from 'zod'
import { createTool } from '@mastra/core/tools'
import * as fs from 'fs'
import * as path from 'path'
import { logError, logTool } from '../../infrastructure/logging/logger'
import { EVAL_DIRECTORY } from '../config'
import { executeCommand } from './share-tools'
const editFile = async (filePath: string, oldStr: string, newStr: string) => {
  if (!filePath || oldStr === newStr) {
    return { success: true, error: null }
  }

  let oldContent: string
  const terminalCwd = process.env.PWD || process.cwd()
  const fullPath = path.resolve(terminalCwd, filePath)
  try {
    oldContent = fs.readFileSync(fullPath, 'utf-8')
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      if (oldStr === '') {
        fs.writeFileSync(fullPath, newStr, 'utf-8')
        logTool('editFile', `Adding ${newStr} to file: ${fullPath}`)
        return { success: true, error: null }
      } else {
        logError('editFile', `File not found: ${fullPath}`, err)
        return { success: false, error: err.message }
      }
    } else {
      logError('editFile', `Failed to read file: ${fullPath}`, err)
      return { success: false, error: err.message }
    }
  }

  if (!oldContent.includes(oldStr)) {
    return { success: true, error: 'Old string not found in file' }
  }
  const newContent = oldContent.replace(oldStr, newStr)
  fs.writeFileSync(fullPath, newContent, 'utf-8')
  logTool('editFile', `Replacing ${oldStr} with ${newStr} in file: ${fullPath}`)

  return { success: true, error: null }
}

export const editFileTool = createTool({
  id: 'replace-text',
  description: 'Use when you need to replace text in a file',
  inputSchema: z.object({
    filePath: z.string().describe('Path to the file to modify'),
    oldStr: z.string().describe('The old string to replace'),
    newStr: z.string().describe('The new string to replace with'),
  }),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe('Boolean value describing the succes of the edit'),
    error: z
      .string()
      .nullable()
      .describe(
        'Text of the error message in case of an error, null if the edit effective',
      ),
  }),
  execute: async ({ context: { filePath, oldStr, newStr } }) => {
    logTool(
      'editFileTool',
      `Replacing "${oldStr}" with "${newStr}" in ${filePath}`,
    )
    return await editFile(filePath, oldStr, newStr)
  },
})

const createFileOrFolder = async (
  targetPath: string,
  type: 'file' | 'folder',
  content?: string,
) => {
  try {
    const terminalCwd = process.env.PWD || process.cwd()
    const fullPath = path.resolve(terminalCwd, targetPath)

    if (type === 'folder') {
      await fs.promises.mkdir(fullPath, { recursive: true })
    } else {
      await fs.promises.writeFile(fullPath, content || '', 'utf-8')
    }
    return { success: true }
  } catch (err) {
    logError(
      'createFileOrFolder',
      `Failed to create ${type} at: ${targetPath}`,
      err,
    )
    return { success: false }
  }
}

export const createFsTool = createTool({
  id: 'create',
  description: 'Use when you need to create a new file or folder',
  inputSchema: z.object({
    path: z.string().describe('Path where the file/folder should be created'),
    type: z
      .enum(['file', 'folder'])
      .describe("Type to create - 'file' or 'folder'"),
    content: z
      .string()
      .optional()
      .describe('Optional content for file creation'),
  }),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe('Boolean value describing the succes of the edit'),
  }),
  execute: async ({ context: { path, type, content } }) => {
    logTool('createFsTool', `Creating ${type} at: ${path}`)
    return await createFileOrFolder(path, type, content)
  },
})

const getDiff = async () => {
  try {
    const { success, output } = await executeCommand(
      `cd "${EVAL_DIRECTORY}" && git diff`,
    )
    return { success: true, diff: output }
  } catch (err) {
    logError('getDiff', `Failed to get diff`, err)
    return { success: false, diff: '' }
  }
}

export const getDiffTool = createTool({
  id: 'get-diff',
  description:
    'Use regularly when you need to get the git diff, do at the begging and end of each task',
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z
      .boolean()
      .describe('Boolean value describing the succes of the edit'),
    diff: z.string().describe('The git diff'),
  }),
  execute: async () => {
    logTool('getDiffTool', `Getting git diff`)
    return await getDiff()
  },
})
