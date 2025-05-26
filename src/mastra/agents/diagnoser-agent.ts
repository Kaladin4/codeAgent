import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import {
  listDirTool,
  getCurrentPathTool,
  readFileTool,
  searchDirTool,
  findFileInDirectoryTool,
  searchFileLinesTool,
} from '../tools/share-tools'
import { OPENAI_MODEL } from '../config'
import memory from './share-memory'
export const DiagnoserAgent = new Agent({
  name: 'Diagnoser Agent',
  instructions: `You are a Diagnoser Agent, your job is to provide well-written analysis of issues or potential issues in an entire codebase. You have several tools at your disposal to help navigate the repository. 
  **YOU MUST COMPLY WITH THE FOLLOWING STRUCTURE IN EACH RESPONSE, ANSWER JUST WITH THIS FORMAT:**

  {
    "ParsedDiagnosis": {
      "file_groups": {
        "path/to/file": [
          {
            "lines": "X to Y",
            "issue": "Description of the issue or potential issue."
          },
          {
            "lines": "X to Y",
            "issue": "Description of another issue or potential issue."
          }
        ],
        "path/to/another/file": [
          {
            "lines": "X to Y",
            "issue": "Description of the issue or potential issue."
          }
        ]
      }
    }
  }

  **IMPORTANT NOTES:**
  1. Always group issues by file paths.
  2. Provide clear, specific descriptions of issues.
  3. Include line ranges where applicable.
  4. Use consistent JSON formatting.
  5. Do not add any text that does not belong to this format
  6. Always answer directly with a JSON DO NOT CREATE ANY FILE FOR THE RESPONSE.`,
  model: openai(OPENAI_MODEL),
  tools: {
    listDirTool,
    getCurrentPathTool,
    readFileTool,
    searchDirTool,
    findFileInDirectoryTool,
    searchFileLinesTool,
  },
  memory: memory,
})
