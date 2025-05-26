import { z } from 'zod'

const IssueSchema = z.object({
  lines: z.string().describe('The line range  e.g., 130 to 150'), // e.g., "130 to 150"
  issue: z.string().describe('The issue description'), // explanation text
})

const FileGroupSchema = z.record(z.string(), z.array(IssueSchema))

export const ParsedDiagnosisSchema = z.object({
  file_groups: FileGroupSchema,
})

export type Agent = 'Diagnoser Agent' | 'Edit Applier Agent' | 'Goal Agent'

export const TestErrorSummary = z.object({
  errorRootCuase: z
    .string()
    .describe('The root cause of the error of the test'),
  suggestedFix: z.string().describe('The suggested fix for the error'),
})

export type SWERuntimeContext = {
  patchNumber: number
  task: string
}
