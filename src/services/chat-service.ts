import path from 'path'
import { createWriteStream } from 'fs'
import player from 'play-sound'
import { GeneralAgent } from '../mastra/agents/general-agent'
const saveAudioResponse = async (
  audio: any,
  fileName: string = 'agent.mp3',
) => {
  const terminalCwd = process.env.PWD || process.cwd()
  const fullPath = path.resolve(terminalCwd, `tmp/${fileName}`)
  const writer = createWriteStream(fullPath)
  audio.pipe(writer)
  await new Promise<void>((resolve, reject) => {
    writer.on('finish', () => resolve())
    writer.on('error', reject)
  })
  return fullPath
}

export const talk = async (userMessage: string, speak: boolean) => {
  try {
    const response = await GeneralAgent.generate(
      [{ role: 'user', content: userMessage }],
      {
        resourceId: 'user_chat_2',
        threadId: 'thread_chat_2',
        maxSteps: 20,
      },
    )
    if (speak) {
      const audioStream = await GeneralAgent.voice.speak(response.text)
      const filePath = await saveAudioResponse(audioStream!)
      const play = player({})
      play.play(filePath, (err: any) => {
        if (err) console.error('Error playing sound:', err)
      })
    }
    return response.text || "Sorry, I didn't get a response"
  } catch (error) {
    console.error('Error in talk function:', error)
    return 'An error occurred while processing your message'
  }
}
