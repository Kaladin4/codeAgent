import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { listDirTool, readFileTool } from '../tools/share-tools'

import memory from './share-memory'
export const GoalAgent = new Agent({
  name: 'Goal Agent',
  instructions:
    'Extract a concise goal (maximum 20 words) from the issue description, clearly specifying any mentioned methods, commands, or classes. If the request pertains to a specific command, method, or class, explicitly include it in the goal. EXAMPLE ISSUE Add a silent mode to the data-clean command for use in automated scripts. Currently, the command outputs detailed logs by default, which can clutter the console during automated runs. A silent mode would suppress these logs, making the output cleaner and more suitable for scripting environments. GOAL Implement a silent mode for data-clean to suppress logs during automated script executions. RULE: You do not try to fix or get more defails bout the error, just provide the goal. You only need to read the issue description under no circunstance to read the source code',
  model: openai('gpt-4.1-mini'),
  tools: {
    listDirTool,
    readFileTool,
  },
  memory: memory,
})
