'use client'
import { useState, useCallback, memo } from 'react'
import { Eye, EyeOff, Split, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import Magicdown from '@/components/Magicdown'
import { cn } from '@/utils'

interface MarkdownPreviewProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

type ViewMode = 'edit' | 'preview' | 'split'

function MarkdownPreview({ value, onChange, placeholder, className }: MarkdownPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleViewMode = useCallback(() => {
    const modes: ViewMode[] = ['edit', 'split', 'preview']
    const currentIndex = modes.indexOf(viewMode)
    const nextIndex = (currentIndex + 1) % modes.length
    setViewMode(modes[nextIndex])
  }, [viewMode])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  return (
    <div
      className={cn(
        'flex flex-col border rounded-lg overflow-hidden',
        isFullscreen && 'fixed inset-4 z-50 bg-background shadow-2xl',
        className
      )}
    >
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Markdown Editor</span>
          <span className="text-xs text-muted-foreground">
            {viewMode === 'edit' && 'Edit Mode'}
            {viewMode === 'preview' && 'Preview Mode'}
            {viewMode === 'split' && 'Split Mode'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={toggleViewMode}
            title="Toggle view mode"
          >
            {viewMode === 'edit' && <Eye className="h-3 w-3" />}
            {viewMode === 'preview' && <EyeOff className="h-3 w-3" />}
            {viewMode === 'split' && <Split className="h-3 w-3" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={toggleFullscreen}
            title="Toggle fullscreen"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={cn('flex-1 flex flex-col', viewMode === 'split' && 'border-r')}>
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || 'Enter your markdown content...'}
              className="flex-1 resize-none border-0 rounded-none focus-visible:ring-0"
              style={{ minHeight: isFullscreen ? 'calc(100vh - 200px)' : '300px' }}
            />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <Magicdown className="prose prose-sm max-w-none dark:prose-invert">
                {value || '*Preview will appear here...*'}
              </Magicdown>
            </ScrollArea>
          </div>
        )}
      </div>

      {isFullscreen && (
        <div className="border-t bg-muted/50 px-3 py-2 flex justify-end">
          <Button size="sm" onClick={toggleFullscreen}>
            Exit Fullscreen
          </Button>
        </div>
      )}
    </div>
  )
}

export default memo(MarkdownPreview)