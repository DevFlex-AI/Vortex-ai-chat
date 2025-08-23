'use client'
import { useState, useCallback, memo } from 'react'
import { GitBranch, Plus, Trash2, Merge, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMessageStore } from '@/store/chat'
import { useConversationStore } from '@/store/conversation'
import { cn } from '@/utils'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

interface ConversationBranch {
  id: string
  name: string
  parentId?: string
  messageIndex: number
  isActive: boolean
  createdAt: number
  messageCount: number
}

interface BranchingConversationsProps {
  className?: string
}

function BranchingConversations({ className }: BranchingConversationsProps) {
  const { messages, backup, restore } = useMessageStore()
  const { currentId, addOrUpdate, query } = useConversationStore()
  const [branches, setBranches] = useState<ConversationBranch[]>([
    {
      id: 'main',
      name: 'Main',
      messageIndex: 0,
      isActive: true,
      createdAt: Date.now(),
      messageCount: messages.length,
    },
  ])
  const [newBranchName, setNewBranchName] = useState('')
  const [showNewBranchInput, setShowNewBranchInput] = useState(false)

  const createBranch = useCallback((fromMessageIndex: number, name?: string) => {
    const branchId = nanoid()
    const branchName = name || `Branch ${branches.length}`
    
    // Save current state
    const currentConversation = backup()
    
    // Create new branch with messages up to the specified index
    const branchMessages = messages.slice(0, fromMessageIndex + 1)
    const branchConversation = {
      ...currentConversation,
      messages: branchMessages,
    }
    
    // Save branch as new conversation
    const branchConversationId = nanoid()
    addOrUpdate(branchConversationId, branchConversation)
    
    const newBranch: ConversationBranch = {
      id: branchId,
      name: branchName,
      parentId: branches.find(b => b.isActive)?.id,
      messageIndex: fromMessageIndex,
      isActive: false,
      createdAt: Date.now(),
      messageCount: branchMessages.length,
    }

    setBranches(prev => [
      ...prev.map(b => ({ ...b, isActive: false })),
      { ...newBranch, isActive: true },
    ])

    // Switch to branch
    restore(branchConversation)
    setNewBranchName('')
    setShowNewBranchInput(false)
  }, [branches, messages, backup, addOrUpdate, restore])

  const switchToBranch = useCallback((branchId: string) => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    // Save current state
    const currentConversation = backup()
    addOrUpdate(currentId, currentConversation)

    // Load branch conversation (for now, we'll simulate this)
    // In a real implementation, you'd load the actual branch data
    const branchMessages = messages.slice(0, branch.messageIndex + 1)
    const branchConversation = {
      title: '',
      messages: branchMessages,
      summary: { ids: [], content: '' },
      systemInstruction: '',
      chatLayout: 'doc' as const,
    }

    restore(branchConversation)

    setBranches(prev => prev.map(b => ({
      ...b,
      isActive: b.id === branchId,
    })))
  }, [branches, messages, backup, addOrUpdate, currentId, restore])

  const deleteBranch = useCallback((branchId: string) => {
    if (branchId === 'main') return // Can't delete main branch
    
    const branchToDelete = branches.find(b => b.id === branchId)
    if (!branchToDelete) return

    // If deleting active branch, switch to main
    if (branchToDelete.isActive) {
      switchToBranch('main')
    }

    setBranches(prev => prev.filter(b => b.id !== branchId))
  }, [branches, switchToBranch])

  const mergeBranch = useCallback((sourceBranchId: string, targetBranchId: string) => {
    // Implementation for merging branches
    // This would combine messages from source branch into target branch
    console.log('Merging branch', sourceBranchId, 'into', targetBranchId)
  }, [])

  const handleCreateBranch = useCallback(() => {
    if (newBranchName.trim()) {
      createBranch(messages.length - 1, newBranchName.trim())
    }
  }, [newBranchName, createBranch, messages.length])

  const activeBranch = branches.find(b => b.isActive)

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Conversation Branches
          </div>
          <Button
            size="sm"
            onClick={() => setShowNewBranchInput(!showNewBranchInput)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Branch
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showNewBranchInput && (
          <div className="flex gap-2">
            <Input
              placeholder="Branch name"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
            />
            <Button size="sm" onClick={handleCreateBranch}>
              Create
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer',
                branch.isActive
                  ? 'bg-primary/10 border-primary'
                  : 'hover:bg-muted/50'
              )}
              onClick={() => switchToBranch(branch.id)}
            >
              <div className="flex items-center gap-3">
                <GitBranch className={cn(
                  'h-4 w-4',
                  branch.isActive ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="font-medium">{branch.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{branch.messageCount} messages</span>
                    <span>•</span>
                    <span>{new Date(branch.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {branch.isActive && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
                
                {branch.id !== 'main' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => mergeBranch(branch.id, 'main')}>
                        <Merge className="h-4 w-4 mr-2" />
                        Merge to Main
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => createBranch(branch.messageIndex, `${branch.name} Copy`)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteBranch(branch.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          ))}
        </div>

        {activeBranch && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>Current:</strong> {activeBranch.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeBranch.messageCount} messages • Created {new Date(activeBranch.createdAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default memo(BranchingConversations)