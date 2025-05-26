import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import {
  listDirTool,
  getCurrentPathTool,
  readFileTool,
  searchDirTool,
  findFileInDirectoryTool,
  searchFileLinesTool,
  execTool,
  appendFileTool,
} from '../tools/share-tools'
import { editFileTool, createFsTool } from '../tools/edit-code-tools'
import memory from './share-memory'
import { OPENAI_MODEL } from '../config'
export const GeneralAgent = new Agent({
  name: 'Diagnoser Agent',
  instructions: 'You are a useful coding agent',
  model: openai(OPENAI_MODEL),
  tools: {
    listDirTool,
    getCurrentPathTool,
    readFileTool,
    searchDirTool,
    findFileInDirectoryTool,
    searchFileLinesTool,
    execTool,
    editFileTool,
    appendFileTool,
    createFsTool,
  },
  memory: memory,
})
