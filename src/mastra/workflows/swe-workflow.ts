import { createStep, createWorkflow } from '@mastra/core/workflows'
import { evalEdit } from '../tools/eval-tools'
import { DiagnoserAgent } from '../agents/diagnoser-agent'
import { EditApplierAgent } from '../agents/edit-applier-agent'
import { ErrorInterpreterAgent } from '../agents/error-interpreter'
import { GoalAgent } from '../agents/goal-agent'
import { z } from 'zod'
import { logAgentResponse } from '../../infrastructure/logging/logger'
import { v4 as uuidv4 } from 'uuid'
import { TestErrorSummary } from '../../types/code-types'
import { appendToFile } from '../tools/share-tools'
import SWEContext from '../context/sw-context'
import { ISSUE_FILE_PATH } from '../config'

const goalStep = createStep({
  id: 'goalStep',
  inputSchema: z.object({ task: z.string() }),
  outputSchema: z.object({ goal: z.string() }),
  execute: async ({ inputData }) => {
    const goal = await GoalAgent.generate(
      [
        {
          role: 'user',
          content: inputData.task,
        },
      ],
      {
        resourceId: 'user',
        threadId: uuidv4(),
        maxSteps: 100,
      },
    )
    logAgentResponse('Goal Agent', goal.text)
    return { goal: goal.text } // Added: Return the goal as output
  },
})

const diagnosisStep = createStep({
  id: 'diagnosisStep',
  inputSchema: z.object({ task: z.string() }),
  outputSchema: z.object({ diagnosis: z.string() }),
  execute: async ({ inputData }) => {
    if (!inputData?.task) {
      throw new Error('Task not found in trigger data')
    }
    const result = await DiagnoserAgent.generate(
      [
        {
          role: 'user',
          content: 'I need to fix this issue: ' + inputData.task,
        },
      ],
      {
        resourceId: 'user',
        threadId: uuidv4(),
        maxSteps: 100,
      },
    )
    logAgentResponse('Diagnoser Agent', result.text)
    return { diagnosis: result.text }
  },
})

const applierStep = createStep({
  id: 'applierStep',
  inputSchema: z.object({
    diagnosisStep: z.object({ diagnosis: z.string() }),
    goalStep: z.object({ goal: z.string() }),
  }),
  outputSchema: z.object({}),
  execute: async ({ inputData }) => {
    if (!inputData?.diagnosisStep.diagnosis || !inputData?.goalStep.goal) {
      throw new Error('Diagnosis not found in trigger data')
    }
    const result = await EditApplierAgent.generate(
      [
        {
          role: 'user',
          content: `${inputData?.diagnosisStep.diagnosis} EXAMPLE ${inputData?.goalStep.goal}`,
        },
      ],
      {
        resourceId: 'user',
        threadId: uuidv4(),
        maxSteps: 100,
      },
    )
    logAgentResponse('Edit Applier Agent', result.text)
    return {}
  },
})

const evaluatorStep = createStep({
  id: 'evaluatorStep',
  inputSchema: z.object({}),
  outputSchema: z.object({ success: z.boolean(), task: z.string().nullable() }),
  execute: async ({}) => {
    const { success, output } = await evalEdit()
    if (!success) {
      const response = await ErrorInterpreterAgent.generate(
        [
          {
            role: 'user',
            content: output,
          },
        ],
        {
          resourceId: 'user',
          threadId: uuidv4(),
          maxSteps: 1,
          output: TestErrorSummary,
        },
      )

      appendToFile(
        'issue.txt',
        `\nERROR ON PATH NUMBER ${SWEContext.get('patchNumber')} \n`,
      )
      appendToFile(
        ISSUE_FILE_PATH,
        `ERROR DESCRIPTION: ${response.object.errorRootCuase} \n`,
      )
      appendToFile(
        ISSUE_FILE_PATH,
        `SUGGESTED FIX: ${response.object.suggestedFix} \n`,
      )
      SWEContext.set(
        'task',
        `${SWEContext.get('task')}output. The path number ${SWEContext.get(
          'patchNumber',
        )} failed, referer to the issue.txt to see the error of the patch \n`,
      )
      SWEContext.set(
        'patchNumber',
        (SWEContext.get('patchNumber') as number) + 1,
      )
      return { success: false, task: String(SWEContext.get('task')) }
    }
    return { success: success, task: null }
  },
})

const finishStep = createStep({
  id: 'finishStep',
  inputSchema: z.object({ success: z.boolean(), output: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({}) => {
    return { success: true }
  },
})

export const sweWorkflow = createWorkflow({
  id: 'increment-workflow',
  inputSchema: z.object({
    task: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
})
  .dountil(
    // Nested workflow that performs the increment and logging
    createWorkflow({
      id: 'increment-workflow',
      inputSchema: z.object({
        task: z.string(),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        output: z.string(),
      }),
      steps: [diagnosisStep, applierStep, evaluatorStep],
    })
      .parallel([diagnosisStep, goalStep])
      .then(applierStep)
      .then(evaluatorStep)
      .commit(),
    // Condition to check if we should stop the loop
    async ({ inputData }) => inputData.success === true,
  )
  .then(finishStep)
  .commit()
