'use client'
import dynamic from 'next/dynamic'
import { useRef, useState, useMemo, useEffect, useCallback, useLayoutEffect } from 'react'
import type { FunctionCall, InlineDataPart } from '@xiangfa/generative-ai'
import { AudioRecorder, EdgeSpeech, getRecordMineType } from '@xiangfa/polly'
import {
  MessageCircleHeart,
  AudioLines,
  Mic,
  Settings,
  Square,
  SendHorizontal,
  Github,
  PanelLeftOpen,
  PanelLeftClose,
  LayoutGrid,
  FileText,
  Trash2,
  Plus,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import ThemeToggle from '@/components/ThemeToggle'
import Button from '@/components/Button'
import { useMessageStore } from '@/store/chat'
import { useAttachmentStore } from '@/store/attachment'
import { useSettingStore, useEnvStore } from '@/store/setting'
import { usePluginStore } from '@/store/plugin'
import { pluginHandle } from '@/plugins'
import i18n from '@/utils/i18n'
import chat, { type RequestProps } from '@/utils/chat'
import { summarizePrompt, getVoiceModelPrompt, getSummaryPrompt, getTalkAudioPrompt } from '@/utils/prompt'
import AudioStream from '@/utils/AudioStream'
import PromiseQueue from '@/utils/PromiseQueue'
import { textStream, simpleTextStream } from '@/utils/textStream'
import { encodeToken } from '@/utils/signature'
import type { FileManagerOptions } from '@/utils/FileManager'
import { fileUpload, imageUpload } from '@/utils/upload'
import { findOperationById } from '@/utils/plugin'
import { generateImages, type ImageGenerationRequest } from '@/utils/generateImages'
import { detectLanguage, formatTime, readFileAsDataURL, base64ToBlob, isOfficeFile } from '@/utils/common'
import { cn } from '@/utils'
import { GEMINI_API_BASE_URL } from '@/constant/urls'
import { OldVisionModel, OldTextModel } from '@/constant/model'
import mimeType from '@/constant/attachment'
import { customAlphabet } from 'nanoid'
import { isFunction, findIndex, isUndefined, entries, flatten, isEmpty } from 'lodash-es'

const TEXTAREA_DEFAULT_HEIGHT = 30
const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 12)

// Dynamic imports for better performance
const MessageItem = dynamic(() => import('@/components/MessageItem'))
const ErrorMessageItem = dynamic(() => import('@/components/ErrorMessageItem'))
const AssistantRecommend = dynamic(() => import('@/components/AssistantRecommend'))
const SystemInstruction = dynamic(() => import('@/components/SystemInstruction'))
const Setting = dynamic(() => import('@/components/Setting'))
const FileUploader = dynamic(() => import('@/components/FileUploader'))
const AttachmentArea = dynamic(() => import('@/components/AttachmentArea'))
const PluginList = dynamic(() => import('@/components/PluginList'))
const ModelSelect = dynamic(() => import('@/components/ModelSelect'))
const TalkWithVoice = dynamic(() => import('@/components/TalkWithVoice'))
const MultimodalLive = dynamic(() => import('@/components/MultimodalLive'))
const TabbedInterface = dynamic(() => import('@/components/chat/TabbedInterface'))
const SideBySideView = dynamic(() => import('@/components/chat/SideBySideView'))
const DragDropUpload = dynamic(() => import('@/components/chat/DragDropUpload'))
const RichFileParser = dynamic(() => import('@/components/chat/RichFileParser'))
const MarkdownPreview = dynamic(() => import('@/components/chat/MarkdownPreview'))
const ChainOfThoughtVisualization = dynamic(() => import('@/components/chat/ChainOfThoughtVisualization'))
const BranchingConversations = dynamic(() => import('@/components/chat/BranchingConversations'))
const ArtifactsSupport = dynamic(() => import('@/components/chat/ArtifactsSupport'))
const MultiProviderChat = dynamic(() => import('@/components/providers/MultiProviderChat'))

interface AnswerParams {
  messages: Message[]
  model: string
  onResponse: (
    readableStream: ReadableStream,
    thoughtReadableStream?: ReadableStream,
    inlineDataReadableStream?: ReadableStream,
    groundingSearchReadable?: ReadableStream,
  ) => void
  onFunctionCall?: (functionCalls: FunctionCall[]) => void
  onError?: (error: string, code?: number) => void
}

export default function Home() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const scrollAreaBottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioStreamRef = useRef<AudioStream>()
  const promiseQueueRef = useRef<PromiseQueue>()
  
  // State management
  const [message, setMessage] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [settingOpen, setSettingOpen] = useState(false)
  const [talkMode, setTalkMode] = useState(false)
  const [multimodalLiveMode, setMultimodalLiveMode] = useState(false)
  const [textareaHeight, setTextareaHeight] = useState(TEXTAREA_DEFAULT_HEIGHT)
  const [recordTime, setRecordTime] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [talkStatus, setTalkStatus] = useState<'thinking' | 'silence' | 'talking'>('silence')
  const [talkContent, setTalkContent] = useState('')
  const [talkSubtitle, setTalkSubtitle] = useState('')
  const [selectedProvider, setSelectedProvider] = useState('vortex')
  const [selectedModel, setSelectedModel] = useState('pure-vortex')
  const [viewMode, setViewMode] = useState<'single' | 'split' | 'tabbed'>('single')
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [thoughtSteps, setThoughtSteps] = useState<any[]>([])

  // Store hooks
  const {
    messages,
    references,
    systemInstruction,
    systemInstructionEditMode,
    chatLayout,
    add: addMessage,
    update: updateMessage,
    clear: clearMessage,
    revoke: revokeMessage,
    updateReference,
    clearReference,
    summarize,
    changeChatLayout,
  } = useMessageStore()

  const { files: attachments, clear: clearAttachment } = useAttachmentStore()
  const { model, talkMode: settingTalkMode, lang, sttLang, ttsLang, ttsVoice, autoStartRecord, autoStopRecord } = useSettingStore()
  const { isProtected, uploadLimit } = useEnvStore()
  const { tools } = usePluginStore()

  // Memoized values
  const isOldVisionModel = useMemo(() => OldVisionModel.includes(model), [model])
  const isOldTextModel = useMemo(() => OldTextModel.includes(model), [model])
  const hasAttachments = useMemo(() => attachments.length > 0, [attachments])
  const hasSystemInstruction = useMemo(() => systemInstruction !== '', [systemInstruction])

  // Audio recorder setup
  const audioRecorder = useMemo(() => {
    return new AudioRecorder({
      autoStop: autoStopRecord,
      onStart: () => setIsRecording(true),
      onTimeUpdate: setRecordTime,
      onFinish: async (audioData: Blob) => {
        setIsRecording(false)
        setRecordTime(0)
        await handleAudioMessage(audioData)
      },
      onError: (error: Error) => {
        setIsRecording(false)
        setRecordTime(0)
        toast({
          description: error.message,
          duration: 3000,
        })
      },
    })
  }, [autoStopRecord, toast])

  // Initialize audio stream and promise queue
  useLayoutEffect(() => {
    audioStreamRef.current = new AudioStream()
    promiseQueueRef.current = new PromiseQueue()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaBottomRef.current) {
      scrollAreaBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Language detection and setup
  useLayoutEffect(() => {
    if (lang === '') {
      const detectedLang = detectLanguage()
      const { update } = useSettingStore.getState()
      update({ lang: detectedLang, sttLang: detectedLang, ttsLang: detectedLang })
    }
  }, [lang])

  // Auto-start recording in voice mode
  useEffect(() => {
    if (settingTalkMode === 'voice' && autoStartRecord && !isRecording && !isThinking) {
      audioRecorder.start()
    }
  }, [settingTalkMode, autoStartRecord, isRecording, isThinking, audioRecorder])

  // Handle audio message processing
  const handleAudioMessage = useCallback(async (audioData: Blob) => {
    try {
      const { apiKey, apiProxy, password } = useSettingStore.getState()
      const formData = new FormData()
      formData.append('file', audioData, `audio.${getRecordMineType().extension}`)
      formData.append('model', 'whisper-1')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${apiKey || encodeToken(password)}`,
        },
      })

      const result = await response.json()
      if (result.text) {
        setMessage(result.text)
        handleSubmit(result.text)
      }
    } catch (error) {
      console.error('Audio transcription error:', error)
      toast({
        description: 'Failed to transcribe audio',
        duration: 3000,
      })
    }
  }, [toast])

  // Main answer function that handles all model types
  const fetchAnswer = useCallback(async (params: AnswerParams) => {
    const { messages, model, onResponse, onFunctionCall, onError } = params
    const { apiKey, apiProxy, password, topP, topK, temperature, maxOutputTokens, safety } = useSettingStore.getState()

    try {
      setIsThinking(true)
      setErrorMessage('')

      // Determine which API to use based on model
      let apiUrl = '/api/chat'
      let requestBody: any = {
        contents: messages,
        generationConfig: {
          topP,
          topK,
          temperature,
          maxOutputTokens,
        },
        safetySettings: [],
      }

      // Route to appropriate API based on model
      if (model === 'pure-vortex') {
        apiUrl = '/api/vortex'
      } else if (model.startsWith('grok-')) {
        apiUrl = '/api/chat/grok'
      } else if (model.startsWith('gpt-') || model.startsWith('openai-')) {
        apiUrl = '/api/chat/openai'
      } else if (model.startsWith('claude-')) {
        apiUrl = '/api/chat/claude'
      } else {
        // Default to Gemini API
        apiUrl = `/api/google/v1beta/models/${model}:streamGenerateContent`
      }

      // Add system instruction if present
      if (systemInstruction) {
        requestBody.systemInstruction = { parts: [{ text: systemInstruction }] }
      }

      // Add tools if available
      if (tools.length > 0) {
        requestBody.tools = tools.map(tool => ({ functionDeclaration: tool }))
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey || encodeToken(password)}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (response.body) {
        onResponse(response.body)
      } else {
        throw new Error('No response body received')
      }
    } catch (error) {
      console.error('API Error:', error)
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred'
      if (onError) {
        onError(errorMsg)
      }
    } finally {
      setIsThinking(false)
    }
  }, [systemInstruction, tools])

  // Handle message submission
  const handleSubmit = useCallback(async (inputMessage?: string) => {
    const messageText = inputMessage || message.trim()
    if (!messageText && attachments.length === 0) return

    try {
      setIsThinking(true)
      setErrorMessage('')

      // Create user message
      const userMessage: Message = {
        id: nanoid(),
        role: 'user',
        parts: [{ text: messageText }],
        attachments: [...attachments],
      }

      // Add file data to message parts
      for (const attachment of attachments) {
        if (attachment.status === 'ACTIVE') {
          if (attachment.dataUrl) {
            const [mimeType, data] = attachment.dataUrl.split(',')
            userMessage.parts.push({
              inlineData: {
                mimeType: attachment.mimeType,
                data: data,
              },
            })
          } else if (attachment.metadata?.uri) {
            userMessage.parts.push({
              fileData: {
                mimeType: attachment.mimeType,
                fileUri: attachment.metadata.uri,
              },
            })
          }
        }
      }

      addMessage(userMessage)
      setMessage('')
      clearAttachment()

      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: nanoid(),
        role: 'model',
        parts: [{ text: '' }],
      }
      addMessage(assistantMessage)

      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        parts: msg.parts,
      }))

      // Call the API
      await fetchAnswer({
        messages: apiMessages,
        model: selectedModel,
        onResponse: (stream) => {
          handleResponse(stream, assistantMessage.id)
        },
        onError: (error) => {
          setErrorMessage(error)
          updateMessage(assistantMessage.id, {
            ...assistantMessage,
            parts: [{ text: `Error: ${error}` }],
          })
        },
      })
    } catch (error) {
      console.error('Submit error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setIsThinking(false)
    }
  }, [message, attachments, messages, selectedModel, addMessage, clearAttachment, updateMessage, fetchAnswer])

  // Handle streaming response
  const handleResponse = useCallback(async (stream: ReadableStream, messageId: string) => {
    try {
      let fullText = ''
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk

        // Update message with current text
        updateMessage(messageId, {
          id: messageId,
          role: 'model',
          parts: [{ text: fullText }],
        })
      }
    } catch (error) {
      console.error('Response handling error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process response')
    }
  }, [updateMessage])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isThinking) {
        handleSubmit()
      }
    }
  }, [isThinking, handleSubmit])

  // Handle file uploads
  const handleFilesUploaded = useCallback((files: File[]) => {
    // File upload logic will be handled by the FileUploader component
    toast({
      title: 'Files uploaded',
      description: `${files.length} file(s) uploaded successfully`,
    })
  }, [toast])

  // Render main chat interface
  const renderChatInterface = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">Vortex AI Chat</h1>
          <ModelSelect defaultModel={selectedModel} />
        </div>
        <div className="flex items-center space-x-2">
          <PluginList />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === 'single' ? 'split' : 'single')}
            title="Toggle view mode"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingOpen(true)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* System Instruction */}
      {hasSystemInstruction && (
        <div className="border-b p-4">
          <SystemInstruction />
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-4 p-4">
            {messages.length === 0 ? (
              <AssistantRecommend />
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex gap-3">
                  <MessageItem
                    {...msg}
                    onRegenerate={(id) => {
                      const messageIndex = findIndex(messages, { id })
                      if (messageIndex > 0) {
                        const previousMessages = messages.slice(0, messageIndex)
                        const lastUserMessage = previousMessages[previousMessages.length - 1]
                        if (lastUserMessage) {
                          revokeMessage(id)
                          handleSubmit(lastUserMessage.parts[0]?.text || '')
                        }
                      }
                    }}
                  />
                </div>
              ))
            )}
            {errorMessage && (
              <div className="flex gap-3">
                <ErrorMessageItem
                  content={errorMessage}
                  onRegenerate={() => {
                    setErrorMessage('')
                    const lastUserMessage = messages[messages.length - 2]
                    if (lastUserMessage) {
                      handleSubmit(lastUserMessage.parts[0]?.text || '')
                    }
                  }}
                />
              </div>
            )}
            <div ref={scrollAreaBottomRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Attachment Area */}
      {hasAttachments && (
        <div className="border-t p-4">
          <AttachmentArea className="max-h-32" />
        </div>
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('askAQuestion')}
              className="min-h-[60px] max-h-40 resize-none"
              disabled={isThinking}
            />
          </div>
          <div className="flex flex-col gap-2">
            <FileUploader
              beforeUpload={() => setIsThinking(true)}
              afterUpload={() => setIsThinking(false)}
            />
            <Button
              onClick={() => handleSubmit()}
              disabled={isThinking || (!message.trim() && attachments.length === 0)}
              size="icon"
            >
              {isThinking ? (
                <Square className="h-4 w-4" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  // Main render
  return (
    <SidebarInset>
      <DragDropUpload onFilesUploaded={handleFilesUploaded}>
        {viewMode === 'tabbed' ? (
          <TabbedInterface>
            {renderChatInterface()}
          </TabbedInterface>
        ) : viewMode === 'split' ? (
          <SideBySideView
            leftPanel={renderChatInterface()}
            rightPanel={
              <div className="p-4 space-y-4">
                <ChainOfThoughtVisualization steps={thoughtSteps} />
                <BranchingConversations />
                <ArtifactsSupport
                  artifacts={artifacts}
                  onArtifactUpdate={(id, content) => {
                    setArtifacts(prev => prev.map(a => a.id === id ? { ...a, content } : a))
                  }}
                  onArtifactDelete={(id) => {
                    setArtifacts(prev => prev.filter(a => a.id !== id))
                  }}
                />
              </div>
            }
          />
        ) : (
          renderChatInterface()
        )}
      </DragDropUpload>

      {/* Voice Mode */}
      {talkMode && (
        <TalkWithVoice
          status={talkStatus}
          content={talkContent}
          subtitle={talkSubtitle}
          errorMessage={errorMessage}
          recordTime={recordTime}
          isRecording={isRecording}
          onRecorder={() => audioRecorder.start()}
          onStop={() => {
            audioRecorder.stop()
            audioStreamRef.current?.stop()
          }}
          onClose={() => setTalkMode(false)}
          openSetting={() => setSettingOpen(true)}
        />
      )}

      {/* Multimodal Live Mode */}
      {multimodalLiveMode && (
        <MultimodalLive onClose={() => setMultimodalLiveMode(false)} />
      )}

      {/* Settings Dialog */}
      <Setting
        open={settingOpen}
        onClose={() => setSettingOpen(false)}
        hiddenTalkPanel={false}
      />
    </SidebarInset>
  )
}