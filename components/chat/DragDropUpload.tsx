'use client'
import { useCallback, useState, memo } from 'react'
import { Upload, FileText, Image, FileAudio, FileVideo, File } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/utils'

interface DragDropUploadProps {
  onFilesUploaded: (files: File[]) => void
  acceptedTypes?: string[]
  maxFileSize?: number
  maxFiles?: number
  className?: string
  children?: React.ReactNode
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-8 w-8" />
  if (mimeType.startsWith('audio/')) return <FileAudio className="h-8 w-8" />
  if (mimeType.startsWith('video/')) return <FileVideo className="h-8 w-8" />
  if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-8 w-8" />
  return <File className="h-8 w-8" />
}

function DragDropUpload({
  onFilesUploaded,
  acceptedTypes = ACCEPTED_TYPES,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  maxFiles = 10,
  className,
  children,
}: DragDropUploadProps) {
  const { toast } = useToast()
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const validateFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    if (fileArray.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`)
      return { validFiles: [], errors }
    }

    for (const file of fileArray) {
      if (!acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: File type not supported`)
        continue
      }

      if (file.size > maxFileSize) {
        errors.push(`${file.name}: File too large (max ${Math.round(maxFileSize / 1024 / 1024)}MB)`)
        continue
      }

      validFiles.push(file)
    }

    return { validFiles, errors }
  }, [acceptedTypes, maxFileSize, maxFiles])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const { validFiles, errors } = validateFiles(files)

    if (errors.length > 0) {
      toast({
        title: 'Upload Error',
        description: errors.join('\n'),
        variant: 'destructive',
      })
    }

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles])
      onFilesUploaded(validFiles)
      toast({
        title: 'Files Uploaded',
        description: `${validFiles.length} file(s) uploaded successfully`,
      })
    }
  }, [validateFiles, onFilesUploaded, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFiles(files)
    }
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(files)
    }
  }, [handleFiles])

  return (
    <div
      className={cn(
        'relative h-full w-full transition-colors',
        isDragOver && 'bg-primary/5 border-primary border-2 border-dashed',
        className
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {children}
      
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <Upload className="h-16 w-16 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Drop files here</h3>
              <p className="text-sm text-muted-foreground">
                Supports PDF, Office docs, images, audio, and video files
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="absolute bottom-4 right-4 max-w-sm">
          <div className="rounded-lg border bg-background p-3 shadow-lg">
            <h4 className="text-sm font-medium mb-2">Uploaded Files</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {getFileIcon(file.type)}
                  <span className="truncate">{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
        id="file-upload"
      />
    </div>
  )
}

export default memo(DragDropUpload)