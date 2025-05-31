import { Agent } from '@mastra/core/agent'
import { OpenAIVoice } from '@mastra/voice-openai'
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
const voice = new OpenAIVoice()
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
  voice: voice,
})
