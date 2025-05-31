import { Mastra } from '@mastra/core'
import { LibSQLStore } from '@mastra/libsql'
import { sweWorkflow } from './workflows/swe-workflow.ts'
import * as dotenv from 'dotenv'
import readline from 'readline'
import chalk from 'chalk'
import inquirer from 'inquirer'
import SWEContext from './context/sw-context.ts'
import figlet from 'figlet'
import { ISSUE_FILE_PATH, EVAL_DIRECTORY } from './config.ts'
import { talk } from '../services/chat-service.ts'
// Agents
import { DiagnoserAgent } from './agents/diagnoser-agent.ts'
import { EditApplierAgent } from './agents/edit-applier-agent.ts'
import { ErrorInterpreterAgent } from './agents/error-interpreter.ts'
import { GeneralAgent } from './agents/general-agent.ts'
import { GoalAgent } from './agents/goal-agent.ts'

//Load environment variables from .env file
dotenv.config()

export const mastra = new Mastra({
  agents: {
    DiagnoserAgent,
    GeneralAgent,
    EditApplierAgent,
    GoalAgent,
    ErrorInterpreterAgent,
  },
  workflows: { sweWorkflow },
  storage: new LibSQLStore({ url: 'file:./local.db' }),
})

// Demo function
async function runDemoMode() {
  console.log(chalk.cyanBright('\n🚀 Running demo mode...'))
  // Simulate demo logic
  console.log(chalk.yellow('🧪 Demo logic executing...'))
  SWEContext.set('patchNumber', 1)
  SWEContext.set(
    'task',
    `The ${ISSUE_FILE_PATH} describe a issue about the sqlfluff project, you store a copy of that project at ${EVAL_DIRECTORY}, implement a valid patch that solves this issue`,
  )
  await sweWorkflow.createRun().start({
    inputData: {
      task: SWEContext.get('task'),
    },
  })
  console.log(chalk.greenBright('✅ Demo complete!'))
}

async function startChatMode() {
  const { chatType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'chatType',
      message: chalk.yellow('Select chat type:'),
      choices: [chalk.blue('Text Chat'), chalk.magenta('Voice Chat')],
    },
  ])

  const isVoiceChat = chatType.includes('Voice')

  console.log(
    chalk.cyanBright('\n💬 Entering chat mode. Type ') +
      chalk.bold("'exit'") +
      chalk.cyanBright(' to quit.'),
  )

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.blueBright('You: '),
  })

  rl.prompt()

  rl.on('line', async (line) => {
    const input = line.trim()
    if (input.toLowerCase() === 'exit') {
      rl.close()
      return
    }
    const response = await talk(input, isVoiceChat)
    const aiResponse = chalk.magentaBright('AI: ') + chalk.whiteBright(response)
    console.log(aiResponse)
    rl.prompt()
  })

  rl.on('close', () => {
    console.log(chalk.green('\n👋 Exiting chat mode.\n\n'))
    main()
  })
}

// Handle demo mode completion
async function onDemoComplete() {
  console.log('\n')
  main()
}

function displayBanner() {
  const banner = figlet.textSync('BETTER CODEX', {
    font: 'Big',
    horizontalLayout: 'full',
    verticalLayout: 'default',
    width: 80,
    whitespaceBreak: true,
  })
  console.log(chalk.bold.cyan(banner))
  console.log('\n')
}

// Main menu with mode switching
async function main() {
  setTimeout(async () => {
    displayBanner()
    console.log(chalk.bold.green('\n🤖 Welcome to the CLI Interface'))

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: chalk.yellow('Select a mode:'),
        choices: [
          chalk.blue('Chat Mode'),
          chalk.magenta('Demo Mode'),
          chalk.red('Exit'),
        ],
      },
    ])

    if (answer.mode.includes('Chat')) {
      startChatMode()
    } else if (answer.mode.includes('Demo')) {
      await runDemoMode()
      onDemoComplete()
    } else {
      console.log(chalk.green('\n👋 Goodbye!'))
      process.exit(0)
    }
  }, 200)
}

// Start the application
main()
