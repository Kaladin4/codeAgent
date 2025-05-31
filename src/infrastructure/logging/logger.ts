import chalk from 'chalk'
import { Agent } from '../../types/code-types'
const logger = {
  'Diagnoser Agent': chalk.blue,
  'Edit Applier Agent': chalk.green,
  'Goal Agent': chalk.yellow,
}
export const logTool = (toolName: string, message: string) => {
  console.log(
    `${chalk.blue(`[${new Date().toISOString()}] TOOL:`)} ${chalk.yellow(
      toolName,
    )} - ${message}`,
  )
}

export const logError = (toolName: string, message: string, error: unknown) => {
  console.error('\n')
  console.error(
    `${chalk.redBright.bold(
      `❌ [${new Date().toISOString()}] ERROR:`,
    )} ${chalk.yellowBright.bold(toolName)} - ${chalk.whiteBright.bold(
      message,
    )}`,
  )
  console.error(
    chalk.redBright.bold(
      error instanceof Error ? error.message : String(error),
    ),
  )
  console.error('\n')
}

export const logAgentResponse = (agentName: Agent, message: string) => {
  console.log(
    `${chalk.blue(`[${new Date().toISOString()}] AGENT`)} ${logger[agentName](
      agentName,
    )}: - ${logger[agentName](message)}`,
  )
}
