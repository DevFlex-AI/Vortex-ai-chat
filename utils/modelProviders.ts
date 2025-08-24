import { GEMINI_API_BASE_URL } from '@/constant/urls'

export interface ModelProvider {
  id: string
  name: string
  models: string[]
  apiUrl: string
  handler: (model: string, messages: any[], config: any) => Promise<Response>
}

// Combined Vortex model that uses all providers
export async function handleVortexModel(messages: any[], config: any): Promise<Response> {
  const { apiKey, openaiKey, anthropicKey, xaiKey } = config

  try {
    // Prepare requests for all providers
    const requests = []

    // Gemini request
    if (apiKey) {
      requests.push(
        fetch(`${GEMINI_API_BASE_URL}/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: messages,
            generationConfig: config.generationConfig,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)
          const text = await res.text()
          return { provider: 'Gemini 1.5 Pro', response: text }
        }).catch(err => ({ provider: 'Gemini 1.5 Pro', error: err.message }))
      )
    }

    // OpenAI request
    if (openaiKey) {
      const openaiMessages = messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts.map((part: any) => part.text).join(''),
      }))

      requests.push(
        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: openaiMessages,
            stream: false,
            temperature: config.generationConfig?.temperature || 0.7,
            max_tokens: config.generationConfig?.maxOutputTokens || 2048,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`)
          const data = await res.json()
          return { 
            provider: 'GPT-4o (OpenAI)', 
            response: data.choices[0]?.message?.content || 'No response'
          }
        }).catch(err => ({ provider: 'GPT-4o (OpenAI)', error: err.message }))
      )
    }

    // Anthropic request
    if (anthropicKey) {
      const anthropicMessages = messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts.map((part: any) => part.text).join(''),
      }))

      requests.push(
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            messages: anthropicMessages,
            max_tokens: config.generationConfig?.maxOutputTokens || 2048,
            temperature: config.generationConfig?.temperature || 0.7,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`)
          const data = await res.json()
          return { 
            provider: 'Claude 3 Opus (Anthropic)', 
            response: data.content[0]?.text || 'No response'
          }
        }).catch(err => ({ provider: 'Claude 3 Opus (Anthropic)', error: err.message }))
      )
    }

    // xAI Grok request
    if (xaiKey) {
      const grokMessages = messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts.map((part: any) => part.text).join(''),
      }))

      requests.push(
        fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${xaiKey}`,
          },
          body: JSON.stringify({
            model: 'grok-1',
            messages: grokMessages,
            stream: false,
            temperature: config.generationConfig?.temperature || 0.7,
            max_tokens: config.generationConfig?.maxOutputTokens || 2048,
          }),
        }).then(async (res) => {
          if (!res.ok) throw new Error(`xAI API error: ${res.status}`)
          const data = await res.json()
          return { 
            provider: 'Grok-1 (xAI)', 
            response: data.choices[0]?.message?.content || 'No response'
          }
        }).catch(err => ({ provider: 'Grok-1 (xAI)', error: err.message }))
      )
    }

    // Wait for all requests to complete
    const results = await Promise.all(requests)

    // Combine responses
    let combinedResponse = '# 🔮 Vortex AI - Combined Response\n\n'
    
    results.forEach((result, index) => {
      if (result.error) {
        combinedResponse += `## ❌ ${result.provider}\n\n*Error: ${result.error}*\n\n---\n\n`
      } else {
        combinedResponse += `## ✨ ${result.provider}\n\n${result.response}\n\n---\n\n`
      }
    })

    combinedResponse += '*This response was generated by Vortex AI, combining multiple AI models for comprehensive insights.*'

    // Create a readable stream for the combined response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(combinedResponse))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Vortex model error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export const modelProviders: Record<string, ModelProvider> = {
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    models: [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
    apiUrl: GEMINI_API_BASE_URL,
    handler: async (model, messages, config) => {
      return fetch(`${GEMINI_API_BASE_URL}/v1beta/models/${model}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey,
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: config.generationConfig,
        }),
      })
    },
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
    apiUrl: 'https://api.openai.com',
    handler: async (model, messages, config) => {
      const openaiMessages = messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts.map((part: any) => part.text).join(''),
      }))

      return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.openaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: openaiMessages,
          stream: true,
          temperature: config.generationConfig?.temperature || 0.7,
          max_tokens: config.generationConfig?.maxOutputTokens || 2048,
        }),
      })
    },
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    apiUrl: 'https://api.anthropic.com',
    handler: async (model, messages, config) => {
      const anthropicMessages = messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts.map((part: any) => part.text).join(''),
      }))

      return fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages: anthropicMessages,
          max_tokens: config.generationConfig?.maxOutputTokens || 2048,
          temperature: config.generationConfig?.temperature || 0.7,
          stream: true,
        }),
      })
    },
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    models: ['grok-1', 'grok-1.5'],
    apiUrl: 'https://api.x.ai',
    handler: async (model, messages, config) => {
      const grokMessages = messages.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts.map((part: any) => part.text).join(''),
      }))

      return fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.xaiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: grokMessages,
          stream: true,
          temperature: config.generationConfig?.temperature || 0.7,
          max_tokens: config.generationConfig?.maxOutputTokens || 2048,
        }),
      })
    },
  },
}

export function getModelProvider(model: string): ModelProvider | null {
  for (const provider of Object.values(modelProviders)) {
    if (provider.models.includes(model)) {
      return provider
    }
  }
  return null
}