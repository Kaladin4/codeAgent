import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import {
  listDirTool,
  getCurrentPathTool,
  readFileTool,
  searchDirTool,
  findFileInDirectoryTool,
  searchFileLinesTool,
  appendFileTool,
  execTool,
} from '../tools/share-tools'
import { OPENAI_MODEL } from '../config'
import { editFileTool, createFsTool } from '../tools/edit-code-tools'
import memory from './share-memory'
export const EditApplierAgent = new Agent({
  name: 'Edit Applier Agent',
  instructions: `You are the Edit Applier Agent. Your job is to fufill the user Goal,by reading the diagnosis report and analyze and apply fixes(edit some code) based on a bug diagnosis report. Every Edit you do has no only one line long, you cannot under any circunstance concatenate a line of code with "\\n".:

  **IMPORTANT NOTES:**
  1. Carefully review the diagnosis report.
  2. Apply fixes only to the specified files path.
  3. Maintain the code's functionality and adhere to best practices.
  4. HAS A EDIT APPLIER AGENT ALL OF YOUR RESPONSE MUST END WITH SOME CODE EDITATION, DO NOT FINISH THE RESPONSE IF THERE IS NO CODE EDIT.
  5. MAKE A FEW LINE EDITS AT A TIME, DO NOT TY TO EDIT MORE THAT 1 LINES AT A TIME USING THE TOOL replace-text like  editFile(
    file,
    'if keyword in task["title"]:',
    'if keyword.lower() in task["title"].lower():'
  );
  6.Always have in mind the goal that must be accomplish, that is your main task
  7.  Make only the neccesary changes do need to complete the goal, even the diagnosys include other problems that are not related to the goal.JUST FINISH THE GOAL.`,
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
