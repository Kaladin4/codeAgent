import { RuntimeContext } from '@mastra/core/runtime-context'
import { SWERuntimeContext } from '../../types/code-types'
import { de } from 'zod/v4/locales'
const SWEContext = new RuntimeContext<SWERuntimeContext>()
export default SWEContext
