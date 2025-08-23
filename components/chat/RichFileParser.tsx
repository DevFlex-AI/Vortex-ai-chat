'use client'
import { useState, useCallback, memo } from 'react'
import { FileText, Table, Image as ImageIcon, Download, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import * as XLSX from 'xlsx'
import mammoth from 'mammoth'
import { Document, Page, pdfjs } from 'react-pdf'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface ParsedContent {
  text: string
  tables: any[]
  images: string[]
  metadata: {
    title?: string
    author?: string
    pages?: number
    sheets?: string[]
  }
}

interface RichFileParserProps {
  file: File
  onContentParsed: (content: ParsedContent) => void
}

function RichFileParser({ file, onContentParsed }: RichFileParserProps) {
  const [parsedContent, setParsedContent] = useState<ParsedContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('text')

  const parseFile = useCallback(async () => {
    setIsLoading(true)
    try {
      let content: ParsedContent = {
        text: '',
        tables: [],
        images: [],
        metadata: {},
      }

      if (file.type === 'application/pdf') {
        // Parse PDF
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjs.getDocument(arrayBuffer).promise
        
        content.metadata.pages = pdf.numPages
        let fullText = ''
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
          fullText += pageText + '\n\n'
        }
        
        content.text = fullText
      } else if (file.type.includes('spreadsheet') || file.name.endsWith('.xlsx')) {
        // Parse Excel
        const arrayBuffer = await file.arrayBuffer()
        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        
        content.metadata.sheets = workbook.SheetNames
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          content.tables.push({
            name: sheetName,
            data: jsonData,
          })
          
          const textData = XLSX.utils.sheet_to_txt(worksheet)
          content.text += `Sheet: ${sheetName}\n${textData}\n\n`
        })
      } else if (file.type.includes('document') || file.name.endsWith('.docx')) {
        // Parse Word document
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        content.text = result.value
        
        // Extract images if any
        const imageResult = await mammoth.images.imgElement(img => {
          return img.read('base64').then(imageBuffer => {
            const base64 = imageBuffer.toString()
            content.images.push(`data:${img.contentType};base64,${base64}`)
            return { src: `data:${img.contentType};base64,${base64}` }
          })
        })
      } else if (file.type.includes('presentation') || file.name.endsWith('.pptx')) {
        // For PowerPoint, we'll extract text content
        // Note: Full PPTX parsing would require additional libraries
        const text = await file.text()
        content.text = text
      } else if (file.type.startsWith('text/')) {
        // Parse text files
        content.text = await file.text()
      } else if (file.type.startsWith('image/')) {
        // Handle images
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        content.images.push(dataUrl)
      }

      setParsedContent(content)
      onContentParsed(content)
    } catch (error) {
      console.error('Error parsing file:', error)
    } finally {
      setIsLoading(false)
    }
  }, [file, onContentParsed])

  const downloadContent = useCallback((type: 'text' | 'json') => {
    if (!parsedContent) return

    let content = ''
    let filename = ''
    let mimeType = ''

    if (type === 'text') {
      content = parsedContent.text
      filename = `${file.name}_extracted.txt`
      mimeType = 'text/plain'
    } else {
      content = JSON.stringify(parsedContent, null, 2)
      filename = `${file.name}_parsed.json`
      mimeType = 'application/json'
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [parsedContent, file.name])

  if (!parsedContent && !isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Parse File Content
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={parseFile} disabled={isLoading}>
            {isLoading ? 'Parsing...' : 'Parse File'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Parsing file content...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Parsed Content
          </span>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => downloadContent('text')}
              title="Download as text"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => downloadContent('json')}
              title="Download as JSON"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="tables" disabled={parsedContent?.tables.length === 0}>
              Tables ({parsedContent?.tables.length || 0})
            </TabsTrigger>
            <TabsTrigger value="images" disabled={parsedContent?.images.length === 0}>
              Images ({parsedContent?.images.length || 0})
            </TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <ScrollArea className="h-64 w-full rounded border p-4">
              <pre className="whitespace-pre-wrap text-sm">
                {parsedContent?.text || 'No text content found'}
              </pre>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="tables" className="mt-4">
            <ScrollArea className="h-64 w-full">
              {parsedContent?.tables.map((table, index) => (
                <div key={index} className="mb-4">
                  <h4 className="font-medium mb-2">{table.name}</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                      {table.data.slice(0, 10).map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border border-gray-300 px-2 py-1 text-xs"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </table>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="images" className="mt-4">
            <ScrollArea className="h-64 w-full">
              <div className="grid grid-cols-2 gap-4">
                {parsedContent?.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Extracted image ${index + 1}`}
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="metadata" className="mt-4">
            <ScrollArea className="h-64 w-full">
              <div className="space-y-2">
                {Object.entries(parsedContent?.metadata || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium capitalize">{key}:</span>
                    <span className="text-muted-foreground">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default memo(RichFileParser)