import { Agent } from '@mastra/core/agent'
import { openai } from '@ai-sdk/openai'
import { OPENAI_MODEL } from '../config'
export const ErrorInterpreterAgent = new Agent({
  name: 'Error Interpreter Agent',
  instructions:
    'You are a useful error interpreter agent, given the result of running some unit test you will provide a clear and concise description of the error. You will also provide a list of possible causes of the error and the steps to resolve it.',
  model: openai(OPENAI_MODEL),
})
