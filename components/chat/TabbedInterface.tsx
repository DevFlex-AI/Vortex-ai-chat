'use client'
import { useState, useCallback, memo, useRef } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd'
import { Plus, X, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConversationStore } from '@/store/conversation'
import { useMessageStore } from '@/store/chat'
import { cn } from '@/utils'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

interface ChatTab {
  id: string
  conversationId: string
  title: string
  isActive: boolean
  order: number
}

interface TabbedInterfaceProps {
  children: React.ReactNode
}

function TabbedInterface({ children }: TabbedInterfaceProps) {
  const { currentId, conversationList, setCurrentId, addOrUpdate } = useConversationStore()
  const { backup, restore } = useMessageStore()
  const [tabs, setTabs] = useState<ChatTab[]>([
    {
      id: 'default-tab',
      conversationId: 'default',
      title: 'New Chat',
      isActive: true,
      order: 0,
    },
  ])

  const createNewTab = useCallback(() => {
    const newConversationId = nanoid()
    const newTabId = nanoid()
    
    // Save current conversation
    const oldConversation = backup()
    addOrUpdate(currentId, oldConversation)

    // Create new conversation
    const newConversation = {
      title: '',
      messages: [],
      summary: { ids: [], content: '' },
      systemInstruction: '',
      chatLayout: 'doc' as const,
    }
    
    addOrUpdate(newConversationId, newConversation)
    setCurrentId(newConversationId)
    restore(newConversation)

    // Add new tab
    const newTab: ChatTab = {
      id: newTabId,
      conversationId: newConversationId,
      title: 'New Chat',
      isActive: true,
      order: tabs.length,
    }

    setTabs(prev => [
      ...prev.map(tab => ({ ...tab, isActive: false })),
      newTab,
    ])
  }, [tabs, currentId, backup, addOrUpdate, setCurrentId, restore])

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return

    // Save current conversation
    const oldConversation = backup()
    addOrUpdate(currentId, oldConversation)

    // Switch to new conversation
    const newConversation = conversationList[tab.conversationId] || {
      title: '',
      messages: [],
      summary: { ids: [], content: '' },
      systemInstruction: '',
      chatLayout: 'doc' as const,
    }

    setCurrentId(tab.conversationId)
    restore(newConversation)

    // Update tab states
    setTabs(prev => prev.map(t => ({
      ...t,
      isActive: t.id === tabId,
    })))
  }, [tabs, currentId, conversationList, backup, addOrUpdate, setCurrentId, restore])

  const closeTab = useCallback((tabId: string) => {
    const tabIndex = tabs.findIndex(t => t.id === tabId)
    if (tabIndex === -1 || tabs.length === 1) return

    const closingTab = tabs[tabIndex]
    const newTabs = tabs.filter(t => t.id !== tabId)

    // If closing active tab, switch to adjacent tab
    if (closingTab.isActive) {
      const nextActiveIndex = Math.min(tabIndex, newTabs.length - 1)
      const nextActiveTab = newTabs[nextActiveIndex]
      switchTab(nextActiveTab.id)
    }

    setTabs(newTabs)
  }, [tabs, switchTab])

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(tabs)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update order
    const updatedTabs = items.map((tab, index) => ({
      ...tab,
      order: index,
    }))

    setTabs(updatedTabs)
  }, [tabs])

  const activeTab = tabs.find(tab => tab.isActive)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b bg-background">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tabs" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex items-center gap-1 p-2"
              >
                {tabs.map((tab, index) => (
                  <Draggable key={tab.id} draggableId={tab.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={cn(
                          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                          tab.isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80',
                          snapshot.isDragging && 'shadow-lg',
                        )}
                      >
                        <span
                          className="cursor-pointer truncate max-w-32"
                          onClick={() => switchTab(tab.id)}
                        >
                          {tab.title || 'New Chat'}
                        </span>
                        {tabs.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-4 w-4 hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation()
                              closeTab(tab.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={createNewTab}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}

export default memo(TabbedInterface)