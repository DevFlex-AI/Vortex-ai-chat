'use client'
import { useState, useCallback, memo } from 'react'
import { Brain, ChevronDown, ChevronRight, Clock, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils'

interface ThoughtStep {
  id: string
  type: 'reasoning' | 'analysis' | 'conclusion' | 'question'
  content: string
  timestamp: number
  confidence?: number
  sources?: string[]
}

interface ChainOfThoughtProps {
  steps: ThoughtStep[]
  isThinking?: boolean
  className?: string
}

function getStepIcon(type: ThoughtStep['type']) {
  switch (type) {
    case 'reasoning':
      return <Brain className="h-4 w-4" />
    case 'analysis':
      return <Lightbulb className="h-4 w-4" />
    case 'conclusion':
      return <Clock className="h-4 w-4" />
    case 'question':
      return <ChevronRight className="h-4 w-4" />
    default:
      return <Brain className="h-4 w-4" />
  }
}

function getStepColor(type: ThoughtStep['type']) {
  switch (type) {
    case 'reasoning':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'analysis':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'conclusion':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'question':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

function ChainOfThoughtVisualization({ steps, isThinking = false, className }: ChainOfThoughtProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stepId)) {
        newSet.delete(stepId)
      } else {
        newSet.add(stepId)
      }
      return newSet
    })
  }, [])

  if (steps.length === 0 && !isThinking) {
    return null
  }

  return (
    <Card className={cn('w-full', className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Chain of Thought
                {isThinking && (
                  <div className="flex items-center gap-1">
                    <div className="animate-pulse h-2 w-2 bg-primary rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{steps.length} steps</Badge>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {index < steps.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-px bg-border"></div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2 border-background',
                      getStepColor(step.type)
                    )}>
                      {getStepIcon(step.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {step.type}
                        </Badge>
                        {step.confidence && (
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(step.confidence * 100)}% confidence
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(step.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <Collapsible
                        open={expandedSteps.has(step.id)}
                        onOpenChange={() => toggleStep(step.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-left justify-start"
                          >
                            <p className="text-sm line-clamp-2">
                              {step.content}
                            </p>
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="mt-2">
                          <div className="bg-muted/50 rounded p-3">
                            <p className="text-sm whitespace-pre-wrap">
                              {step.content}
                            </p>
                            {step.sources && step.sources.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium mb-1">Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {step.sources.map((source, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="flex items-center gap-3 opacity-60">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  </div>
                  <p className="text-sm text-muted-foreground">Processing next step...</p>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export default memo(ChainOfThoughtVisualization)