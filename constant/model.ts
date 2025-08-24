export const Model: Record<string, string> = {
  // Pure Vortex Model (Combined AI)
  'pure-vortex': '🔮 Pure Vortex (All AI Models)',
  
  // Gemini Models
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.0-flash': 'Gemini 2.0 Flash',
  'gemini-2.0-flash-lite': 'Gemini 2.0 Flash Lite',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-1.5-pro-latest': 'Gemini 1.5 Pro Latest',
  'gemini-1.5-flash': 'Gemini 1.5 Flash',
  'gemini-1.5-flash-latest': 'Gemini 1.5 Flash Latest',
  'gemini-1.5-flash-8b': 'Gemini 1.5 Flash-8B',
  'gemini-1.5-flash-8b-latest': 'Gemini 1.5 Flash-8B Latest',
  'gemini-pro-vision': 'Gemini Pro Vision',
  'gemini-1.0-pro-vision-latest': 'Gemini 1.0 Pro Vision Latest',
  'gemini-1.0-pro': 'Gemini 1.0 Pro',
  'gemini-1.0-pro-latest': 'Gemini 1.0 Pro Latest',
  'gemini-pro': 'Gemini Pro',
  
  // OpenAI Models
  'gpt-4o': 'GPT-4o (OpenAI)',
  'gpt-4o-mini': 'GPT-4o Mini (OpenAI)',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo (OpenAI)',
  'gpt-4': 'GPT-4 (OpenAI)',
  'gpt-4-turbo': 'GPT-4 Turbo (OpenAI)',
  'gpt-4-vision': 'GPT-4 Vision (OpenAI)',
  
  // Anthropic Claude Models
  'claude-3-opus': 'Claude 3 Opus (Anthropic)',
  'claude-3-sonnet': 'Claude 3 Sonnet (Anthropic)',
  'claude-3-haiku': 'Claude 3 Haiku (Anthropic)',
  'claude-2.1': 'Claude 2.1 (Anthropic)',
  'claude-2.0': 'Claude 2.0 (Anthropic)',
  'claude-instant-1.2': 'Claude Instant 1.2 (Anthropic)',
  
  // xAI Grok Models
  'grok-1': 'Grok-1 (xAI)',
  'grok-1.5': 'Grok-1.5 (xAI)',
  
  // Local Models (Ollama)
  'llama3.2': 'Llama 3.2 (Local)',
  'mistral': 'Mistral (Local)',
  'codellama': 'CodeLlama (Local)',
  'phi3': 'Phi-3 (Local)',
}

export const OldVisionModel = ['gemini-pro-vision', 'gemini-1.0-pro-vision-latest', 'gpt-4-vision']

export const OldTextModel = [
  'gemini-1.0-pro', 
  'gemini-1.0-pro-latest', 
  'gemini-pro',
  'gpt-3.5-turbo',
  'gpt-4',
  'gpt-4-turbo',
  'claude-3-opus',
  'claude-3-sonnet',
  'claude-3-haiku',
  'claude-2.1',
  'claude-2.0',
  'claude-instant-1.2',
  'grok-1',
  'grok-1.5',
  'llama3.2',
  'mistral',
  'codellama',
  'phi3'
]

export const DefaultModel = 'pure-vortex'