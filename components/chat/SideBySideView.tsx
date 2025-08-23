'use client'
import { useState, useCallback, memo } from 'react'
import SplitPane from 'react-split-pane'
import { LayoutGrid, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConversationStore } from '@/store/conversation'
import { useMessageStore } from '@/store/chat'
import { cn } from '@/utils'

interface SideBySideViewProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultSplit?: number
}

function SideBySideView({ leftPanel, rightPanel, defaultSplit = 50 }: SideBySideViewProps) {
  const [splitSize, setSplitSize] = useState(defaultSplit)
  const [isMaximized, setIsMaximized] = useState<'left' | 'right' | null>(null)

  const handleSplitChange = useCallback((size: number) => {
    setSplitSize(size)
  }, [])

  const toggleMaximize = useCallback((panel: 'left' | 'right') => {
    if (isMaximized === panel) {
      setIsMaximized(null)
      setSplitSize(50)
    } else {
      setIsMaximized(panel)
      setSplitSize(panel === 'left' ? 95 : 5)
    }
  }, [isMaximized])

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => toggleMaximize('left')}
          title="Maximize left panel"
        >
          {isMaximized === 'left' ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <Maximize2 className="h-3 w-3" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={() => toggleMaximize('right')}
          title="Maximize right panel"
        >
          {isMaximized === 'right' ? (
            <Minimize2 className="h-3 w-3" />
          ) : (
            <LayoutGrid className="h-3 w-3" />
          )}
        </Button>
      </div>
      
      <SplitPane
        split="vertical"
        minSize={100}
        maxSize={-100}
        defaultSize={`${defaultSplit}%`}
        size={`${splitSize}%`}
        onChange={handleSplitChange}
        style={{ height: '100%' }}
        paneStyle={{ overflow: 'hidden' }}
        resizerStyle={{
          background: 'hsl(var(--border))',
          width: '2px',
          cursor: 'col-resize',
          transition: 'background-color 0.2s',
        }}
      >
        <div className="h-full overflow-hidden border-r">
          {leftPanel}
        </div>
        <div className="h-full overflow-hidden">
          {rightPanel}
        </div>
      </SplitPane>
    </div>
  )
}

export default memo(SideBySideView)