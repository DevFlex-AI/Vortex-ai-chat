import { NextResponse, type NextRequest } from 'next/server'
import { handleVortexModel } from '@/utils/modelProviders'

export const runtime = 'edge'
export const preferredRegion = ['cle1', 'iad1', 'pdx1', 'sfo1', 'sin1', 'syd1', 'hnd1', 'kix1']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contents: messages, generationConfig } = body

    // Get API keys from environment
    const config = {
      apiKey: process.env.GEMINI_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      xaiKey: process.env.XAI_API_KEY,
      generationConfig,
    }

    // Validate that at least one API key is available
    if (!config.apiKey && !config.openaiKey && !config.anthropicKey && !config.xaiKey) {
      return NextResponse.json(
        { error: 'No API keys configured. Please set at least one API key.' },
        { status: 500 }
      )
    }

    const response = await handleVortexModel(messages, config)
    return response
  } catch (error) {
    console.error('Vortex API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}