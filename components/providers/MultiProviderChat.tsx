'use client'
import { useState, useCallback, memo } from 'react'
import { Bot, Zap, Brain, Cpu } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/utils'

interface AIProvider {
  id: string
  name: string
  icon: React.ReactNode
  models: string[]
  capabilities: string[]
  status: 'online' | 'offline' | 'limited'
  pricing: 'free' | 'paid' | 'freemium'
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: <Brain className="h-4 w-4" />,
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    capabilities: ['text', 'vision', 'code', 'multimodal'],
    status: 'online',
    pricing: 'freemium',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: <Bot className="h-4 w-4" />,
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    capabilities: ['text', 'vision', 'code', 'function-calling'],
    status: 'online',
    pricing: 'paid',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    icon: <Zap className="h-4 w-4" />,
    models: ['claude-3.5-sonnet', 'claude-3-haiku', 'claude-3-opus'],
    capabilities: ['text', 'vision', 'code', 'analysis'],
    status: 'online',
    pricing: 'paid',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    icon: <Cpu className="h-4 w-4" />,
    models: ['llama3.2', 'mistral', 'codellama', 'phi3'],
    capabilities: ['text', 'code', 'local'],
    status: 'offline',
    pricing: 'free',
  },
]

interface MultiProviderChatProps {
  selectedProvider: string
  selectedModel: string
  onProviderChange: (provider: string) => void
  onModelChange: (model: string) => void
  className?: string
}

function getStatusColor(status: AIProvider['status']) {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'offline':
      return 'bg-red-500'
    case 'limited':
      return 'bg-yellow-500'
    default:
      return 'bg-gray-500'
  }
}

function getPricingColor(pricing: AIProvider['pricing']) {
  switch (pricing) {
    case 'free':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900'
    case 'paid':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900'
    case 'freemium':
      return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900'
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900'
  }
}

function MultiProviderChat({
  selectedProvider,
  selectedModel,
  onProviderChange,
  onModelChange,
  className,
}: MultiProviderChatProps) {
  const [showProviderDetails, setShowProviderDetails] = useState(false)

  const currentProvider = AI_PROVIDERS.find(p => p.id === selectedProvider)
  const availableModels = currentProvider?.models || []

  const handleProviderChange = useCallback((providerId: string) => {
    const provider = AI_PROVIDERS.find(p => p.id === providerId)
    if (provider && provider.models.length > 0) {
      onProviderChange(providerId)
      onModelChange(provider.models[0]) // Select first available model
    }
  }, [onProviderChange, onModelChange])

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Provider Selection
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowProviderDetails(!showProviderDetails)}
            >
              {showProviderDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select value={selectedProvider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select AI provider" />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center gap-2">
                        {provider.icon}
                        <span>{provider.name}</span>
                        <div className={cn('w-2 h-2 rounded-full', getStatusColor(provider.status))} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <Select value={selectedModel} onValueChange={onModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {currentProvider && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getPricingColor(currentProvider.pricing)}>
                {currentProvider.pricing}
              </Badge>
              <div className={cn('w-2 h-2 rounded-full', getStatusColor(currentProvider.status))} />
              <span className="text-sm text-muted-foreground">
                {currentProvider.status}
              </span>
            </div>
          )}

          {showProviderDetails && currentProvider && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Capabilities</h4>
                    <div className="flex gap-1 flex-wrap">
                      {currentProvider.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-1">Available Models</h4>
                    <div className="flex gap-1 flex-wrap">
                      {currentProvider.models.map((model) => (
                        <Badge
                          key={model}
                          variant={model === selectedModel ? 'default' : 'secondary'}
                          className="text-xs cursor-pointer"
                          onClick={() => onModelChange(model)}
                        >
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default memo(MultiProviderChat)