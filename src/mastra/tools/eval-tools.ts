import { executeCommand } from './share-tools'
import {
  RUN_TEST_COMMAND,
  EVAL_DIRECTORY,
  ACTIVATE_VENV_COMMAND,
} from '../config'

export const evalEdit = async () => {
  console.log(`Starting evaluation in directory: ${EVAL_DIRECTORY}`)

  console.log('Running pytest...')
  let { success, output } = await executeCommand(
    `cd "${EVAL_DIRECTORY}" && . ${ACTIVATE_VENV_COMMAND} && ${RUN_TEST_COMMAND}`,
  )
  console.log(`Pytest execution result: ${success ? 'Success' : 'Failed'}`)
  console.log(`Full pytest output:\n${output}`)
  if (!success) {
    return { success: success, output: output }
  }
  return { success: success, output: output }
}
