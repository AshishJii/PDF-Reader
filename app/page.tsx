"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileText,
  Eye,
  X,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  BookOpen,
  Database,
  RefreshCw,
  Zap,
} from "lucide-react"
import PDFViewer, { type PDFViewerRef } from "@/components/pdf-viewer"

interface PDFDocument {
  id: string
  name: string
  url: string
  uploadDate: Date
  processing: boolean
  size: number
  error?: string
  ingested?: boolean
  ingesting?: boolean
  ingestionError?: string
}

interface InsightsData {
  query: string
  model: string
  temperature: number
  key_takeaways: string[]
  did_you_know: string[]
  contradictions: string[]
  examples: string[]
}

interface QueryResult {
  answer: string
  sources: Array<{
    file: string
    page: string
    content: string
  }>
  query: string
}

interface PodcastData {
  script: string
  audioFile: string
  audioPath: string
}

export default function PDFReaderApp() {
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null)
  const [suggestedDocuments, setSuggestedDocuments] = useState<PDFDocument[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const pdfViewerRef = useRef<PDFViewerRef>(null)
  const [isGettingSelection, setIsGettingSelection] = useState(false)
  const [selectedContent, setSelectedContent] = useState<string | null>(null)
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [isProcessingInsights, setIsProcessingInsights] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [isQueryingDocuments, setIsQueryingDocuments] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [podcast, setPodcast] = useState<PodcastData | null>(null)
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const [activeTab, setActiveTab] = useState<"insights" | "related" | "podcast">("insights")

  useEffect(() => {
    loadExistingDocuments()
  }, [])

  const loadExistingDocuments = async () => {
    try {
      const response = await fetch("/api/load-documents")
      const result = await response.json()

      if (result.documents) {
        const documentsWithDates = result.documents.map((doc: any) => ({
          ...doc,
          uploadDate: new Date(doc.uploadDate),
        }))
        setDocuments(documentsWithDates)
        console.log("[v0] Loaded existing documents:", documentsWithDates.length)
      }
    } catch (error) {
      console.error("[v0] Error loading existing documents:", error)
    }
  }

  const processDocument = async (file: File, docId: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        const formData = new FormData()
        formData.append("file", file)

        const saveResponse = await fetch("/api/save-document", {
          method: "POST",
          body: formData,
        })

        const saveResult = await saveResponse.json()

        if (!saveResult.success) {
          throw new Error(saveResult.error || "Failed to save document")
        }

        let progress = 0
        const interval = setInterval(() => {
          progress += Math.random() * 20
          if (progress >= 100) {
            progress = 100
            clearInterval(interval)
            setUploadProgress((prev) => ({ ...prev, [docId]: 100 }))
            setTimeout(async () => {
              setUploadProgress((prev) => {
                const newProgress = { ...prev }
                delete newProgress[docId]
                return newProgress
              })
              await ingestDocument(file.name, docId)
              resolve()
            }, 500)
          } else {
            setUploadProgress((prev) => ({ ...prev, [docId]: progress }))
          }
        }, 200)
      } catch (error) {
        console.error("[v0] Error processing document:", error)
        reject(error)
      }
    })
  }

  const ingestDocument = async (fileName: string, docId: string) => {
    try {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                ingesting: true,
                ingestionError: undefined,
                uploadDate: doc.uploadDate instanceof Date ? doc.uploadDate : new Date(doc.uploadDate),
              }
            : doc,
        ),
      )

      const response = await fetch("/api/ingest-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentPaths: [`docs/${fileName}`],
        }),
      })

      const result = await response.json()

      if (result.success) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === docId
              ? {
                  ...doc,
                  ingesting: false,
                  ingested: true,
                  uploadDate: doc.uploadDate instanceof Date ? doc.uploadDate : new Date(doc.uploadDate),
                }
              : doc,
          ),
        )
        console.log("[v0] Document ingested successfully:", fileName)
      } else {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === docId
              ? {
                  ...doc,
                  ingesting: false,
                  ingestionError: result.message || "Ingestion failed",
                  uploadDate: doc.uploadDate instanceof Date ? doc.uploadDate : new Date(doc.uploadDate),
                }
              : doc,
          ),
        )
        console.error("[v0] Ingestion failed:", result.message)
      }
    } catch (error) {
      console.error("[v0] Error during ingestion:", error)
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId
            ? {
                ...doc,
                ingesting: false,
                ingestionError: "Ingestion failed",
                uploadDate: doc.uploadDate instanceof Date ? doc.uploadDate : new Date(doc.uploadDate),
              }
            : doc,
        ),
      )
    }
  }

  const retryIngestion = async (docId: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await ingestDocument(fileName, docId)
  }

  const validateFile = (file: File): string | null => {
    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed"
    }
    if (file.size > 50 * 1024 * 1024) {
      return "File size must be less than 50MB"
    }
    return null
  }

  const handleFileUpload = async (files: FileList) => {
    setUploadError(null)
    const validFiles: File[] = []
    const errors: string[] = []

    for (const file of Array.from(files)) {
      const error = validateFile(file)
      if (error) {
        errors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join(", "))
      return
    }

    for (const file of validFiles) {
      const newDoc: PDFDocument = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: `/api/serve-document/${encodeURIComponent(file.name)}`,
        uploadDate: new Date(),
        processing: true,
        size: file.size,
        ingested: false,
        ingesting: false,
      }

      setDocuments((prev) => [...prev, newDoc])

      try {
        await processDocument(file, newDoc.id)
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === newDoc.id
              ? {
                  ...doc,
                  processing: false,
                  uploadDate: doc.uploadDate instanceof Date ? doc.uploadDate : new Date(doc.uploadDate),
                }
              : doc,
          ),
        )
      } catch (error) {
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === newDoc.id
              ? {
                  ...doc,
                  processing: false,
                  error: "Processing failed",
                  uploadDate: doc.uploadDate instanceof Date ? doc.uploadDate : new Date(doc.uploadDate),
                }
              : doc,
          ),
        )
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      handleFileUpload(files)
    }
  }

  const removeDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    const docToRemove = documents.find((doc) => doc.id === docId)
    if (docToRemove) {
      try {
        await fetch(`/api/delete-document`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fileName: docToRemove.name }),
        })
      } catch (error) {
        console.error("[v0] Error deleting document from docs folder:", error)
      }
    }

    setDocuments((prev) => prev.filter((doc) => doc.id !== docId))
    if (selectedDocument?.id === docId) {
      setSelectedDocument(null)
      setSuggestedDocuments([])
      setSelectedContent(null)
      setInsights(null)
      setQueryResult(null)
      setPodcast(null)
      setIsPlaying(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDocumentSelect = (document: PDFDocument) => {
    setSelectedDocument(document)
    setSuggestedDocuments([])
    setSelectedContent(null)
    setInsights(null)
    setQueryResult(null)
    setPodcast(null)
    setIsPlaying(false)
  }

  const processInsights = async (content: string): Promise<InsightsData | null> => {
    try {
      const response = await fetch("/api/run-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: "insights.py",
          args: [content],
        }),
      })

      const result = await response.json()

      if (result.success && result.output) {
        const insightsData = JSON.parse(result.output)
        if (insightsData.ok) {
          return insightsData
        } else {
          console.error("[v0] Insights script error:", insightsData.error)
          return null
        }
      } else {
        console.error("[v0] API call failed:", result.error)
        return null
      }
    } catch (error) {
      console.error("[v0] Error processing insights:", error)
      return null
    }
  }

  const queryDocuments = async (query: string): Promise<QueryResult | null> => {
    try {
      const response = await fetch("/api/query-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      const result = await response.json()

      if (result.error) {
        console.error("[v0] Query error:", result.error)
        return null
      }

      // Limit sources to max 5 for better UI
      if (result.sources && result.sources.length > 5) {
        result.sources = result.sources.slice(0, 5)
      }

      return result
    } catch (error) {
      console.error("[v0] Error querying documents:", error)
      return null
    }
  }

  const generatePodcast = async (content: string): Promise<PodcastData | null> => {
    try {
      const response = await fetch("/api/generate-podcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          gender: "F", // Default to female voice
        }),
      })

      const result = await response.json()

      if (result.success) {
        return {
          script: result.script,
          audioFile: result.audioFile,
          audioPath: result.audioPath,
        }
      } else {
        console.error("[v0] Podcast generation failed:", result.error)
        return null
      }
    } catch (error) {
      console.error("[v0] Error generating podcast:", error)
      return null
    }
  }

  const handleGetSelectedContent = async () => {
    if (!pdfViewerRef.current) {
      console.log("[v0] PDF viewer ref not available")
      return
    }

    setIsGettingSelection(true)
    setSelectedContent(null)
    setInsights(null)
    setQueryResult(null)
    setPodcast(null)
    setIsPlaying(false)

    try {
      console.log("[v0] Calling getSelectedText...")
      const selectedContentResult = await pdfViewerRef.current.getSelectedText()
      console.log("[v0] getSelectedText result:", selectedContentResult)

      if (selectedContentResult && selectedContentResult.data && selectedContentResult.data.trim()) {
        console.log("[v0] Valid selected content found:", selectedContentResult.data)
        setSelectedContent(selectedContentResult.data)

        setIsProcessingInsights(true)
        const insightsResult = await processInsights(selectedContentResult.data)
        if (insightsResult) {
          setInsights(insightsResult)
        }
        setIsProcessingInsights(false)

        setIsQueryingDocuments(true)
        const queryResults = await queryDocuments(selectedContentResult.data)
        if (queryResults) {
          setQueryResult(queryResults)
        }
        setIsQueryingDocuments(false)

        setIsGeneratingPodcast(true)
        const podcastResult = await generatePodcast(selectedContentResult.data)
        if (podcastResult) {
          setPodcast(podcastResult)
        }
        setIsGeneratingPodcast(false)

        setIsGettingSelection(false)
      } else {
        console.log("[v0] No valid text selected")
        alert("No text selected. Please select some text in the PDF first.")
        setIsGettingSelection(false)
      }
    } catch (error) {
      console.error("[v0] Error getting selected content:", error)
      alert("Failed to get selected content. Please try again.")
      setIsGettingSelection(false)
      setIsProcessingInsights(false)
      setIsQueryingDocuments(false)
      setIsGeneratingPodcast(false)
    }
  }

  const handleTextSelection = (selectedText: string) => {
    console.log("[v0] Text selected from PDF:", selectedText)
    // Additional processing can be added here
  }

  const handleContextClick = (fileName: string, pageNumber?: string) => {
    console.log("[v0] Context clicked for file:", fileName, "page:", pageNumber)
    console.log(
      "[v0] Available documents:",
      documents.map((d) => d.name),
    )

    const document = documents.find((doc) => doc.name === fileName)
    if (document) {
      console.log("[v0] Found matching document:", document.name)

      if (selectedDocument?.name === document.name) {
        // Same document - just jump to page without clearing insights/related docs
        if (pageNumber && pdfViewerRef.current) {
          const pageNum = Number.parseInt(pageNumber, 10)
          if (!isNaN(pageNum)) {
            console.log("[v0] Jumping to page in same document:", pageNum)
            pdfViewerRef.current.goToPage(pageNum).then((success) => {
              if (success) {
                console.log("[v0] Successfully jumped to page:", pageNum)
              } else {
                console.log("[v0] Failed to jump to page:", pageNum)
              }
            })
          }
        }
        return // Don't proceed to document selection logic
      }

      // Different document - select it and clear state
      handleDocumentSelect(document)
      if (pageNumber) {
        const pageNum = Number.parseInt(pageNumber, 10)
        if (!isNaN(pageNum)) {
          // Wait a bit for the document to load before jumping
          setTimeout(() => {
            if (pdfViewerRef.current) {
              console.log("[v0] Jumping to page after document load:", pageNum)
              pdfViewerRef.current.goToPage(pageNum)
            }
          }, 2000)
        }
      }
    } else {
      console.log("[v0] No matching document found for:", fileName)
      // Try to find by partial match (in case of path differences)
      const partialMatch = documents.find((doc) => doc.name.includes(fileName) || fileName.includes(doc.name))
      if (partialMatch) {
        console.log("[v0] Found partial match:", partialMatch.name)

        if (selectedDocument?.name === partialMatch.name) {
          // Same document - just jump to page without clearing insights/related docs
          if (pageNumber && pdfViewerRef.current) {
            const pageNum = Number.parseInt(pageNumber, 10)
            if (!isNaN(pageNum)) {
              console.log("[v0] Jumping to page in same document (partial match):", pageNum)
              pdfViewerRef.current.goToPage(pageNum).then((success) => {
                if (success) {
                  console.log("[v0] Successfully jumped to page:", pageNum)
                } else {
                  console.log("[v0] Failed to jump to page:", pageNum)
                }
              })
            }
          }
          return // Don't proceed to document selection logic
        }

        // Different document - select it and clear state
        handleDocumentSelect(partialMatch)
        if (pageNumber) {
          const pageNum = Number.parseInt(pageNumber, 10)
          if (!isNaN(pageNum)) {
            setTimeout(() => {
              if (pdfViewerRef.current) {
                console.log("[v0] Jumping to page after partial match load:", pageNum)
                pdfViewerRef.current.goToPage(pageNum)
              }
            }, 2000)
          }
        }
      } else {
        console.log("[v0] No document found matching:", fileName)
      }
    }
  }

  const togglePodcastPlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen gap-1">
        <Card className="flex flex-col w-1/4 rounded-none border-r border-t-0 border-l-0 border-b-0">
          <CardHeader className="pb-4 flex-shrink-0">
            <CardTitle className="text-lg font-bold mb-2">PDF Reader Application</CardTitle>
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              <span className="text-base">Document Library</span>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col px-4 min-h-0">
            <div className="mb-4 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={handleInputChange}
                className="hidden"
                id="pdf-upload"
              />
              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium mb-1">
                  {isDragOver ? "Drop PDF files here" : "Click to upload or drag and drop"}
                </p>
                <p className="text-xs text-muted-foreground">PDF files only, max 50MB each</p>
              </div>
            </div>

            {uploadError && (
              <Alert className="mb-4" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-2 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                      selectedDocument?.id === doc.id ? "bg-accent border-primary" : "border-border"
                    }`}
                    onClick={() => !doc.processing && !doc.error && handleDocumentSelect(doc)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>
                            {doc.processing
                              ? "Processing..."
                              : doc.error
                                ? "Failed"
                                : doc.uploadDate.toLocaleDateString()}
                          </span>
                        </div>
                        {uploadProgress[doc.id] && <Progress value={uploadProgress[doc.id]} className="mt-2 h-1" />}
                        {!doc.processing && !doc.error && (
                          <div className="flex items-center gap-1 mt-1">
                            {doc.ingesting && (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                <span className="text-xs text-blue-600">Ingesting...</span>
                              </>
                            )}
                            {doc.ingested && !doc.ingesting && (
                              <>
                                <Database className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">Ingested</span>
                              </>
                            )}
                            {doc.ingestionError && (
                              <>
                                <AlertCircle className="h-3 w-3 text-orange-500" />
                                <span className="text-xs text-orange-600">Ingestion failed</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.processing && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        )}
                        {doc.error && <AlertCircle className="h-4 w-4 text-destructive" />}
                        {!doc.processing && !doc.error && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            {doc.ingestionError && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                                onClick={(e) => retryIngestion(doc.id, doc.name, e)}
                                title="Retry ingestion"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={(e) => removeDocument(doc.id, e)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {documents.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No documents uploaded yet</p>
                    <p className="text-xs">Upload PDF files to get started</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col w-5/12 rounded-none border-r border-t-0 border-l-0 border-b-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-5 w-5" />
              PDF Viewer
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            {selectedDocument ? (
              <PDFViewer
                ref={pdfViewerRef}
                fileUrl={selectedDocument.url}
                fileName={selectedDocument.name}
                onTextSelection={handleTextSelection}
              />
            ) : (
              <div className="h-full border-2 border-dashed border-border rounded-lg flex items-center justify-center m-4">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Select a document to view</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col w-1/3 rounded-none border-t-0 border-l-0 border-b-0 border-r-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base mb-3">Content Analysis</CardTitle>
            {selectedDocument && (
              <Button
                onClick={handleGetSelectedContent}
                disabled={isGettingSelection}
                className="mb-3 w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                size="lg"
              >
                {isGettingSelection ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Analyse Selected Text
                  </>
                )}
              </Button>
            )}
            <div className="flex border-b bg-gray-50 rounded-t-lg">
              <button
                onClick={() => setActiveTab("insights")}
                className={`flex-1 px-4 py-3 text-sm font-semibold border-b-3 transition-all duration-200 ${
                  activeTab === "insights"
                    ? "border-blue-500 text-blue-600 bg-white shadow-sm"
                    : "border-transparent text-gray-600 hover:text-blue-500 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Insights
                </div>
              </button>
              <button
                onClick={() => setActiveTab("related")}
                className={`flex-1 px-4 py-3 text-sm font-semibold border-b-3 transition-all duration-200 ${
                  activeTab === "related"
                    ? "border-blue-500 text-blue-600 bg-white shadow-sm"
                    : "border-transparent text-gray-600 hover:text-blue-500 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Related
                </div>
              </button>
              <button
                onClick={() => setActiveTab("podcast")}
                className={`flex-1 px-4 py-3 text-sm font-semibold border-b-3 transition-all duration-200 ${
                  activeTab === "podcast"
                    ? "border-blue-500 text-blue-600 bg-white shadow-sm"
                    : "border-transparent text-gray-600 hover:text-blue-500 hover:bg-white/50"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4">🎙️</div>
                  Podcast
                </div>
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 px-4 min-h-0">
            {selectedDocument ? (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {activeTab === "insights" && (
                    <div className="space-y-3">
                      {isProcessingInsights && (
                        <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Processing Insights...
                            </span>
                          </div>
                        </div>
                      )}

                      {insights && (
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-green-600" />
                              <h4 className="text-sm font-medium text-green-700 dark:text-green-300">Key Takeaways</h4>
                            </div>
                            <ul className="text-xs space-y-1">
                              {insights.key_takeaways.map((item, index) => (
                                <li key={index} className="text-green-700 dark:text-green-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                            <div className="flex items-center gap-2 mb-2">
                              <HelpCircle className="h-4 w-4 text-blue-600" />
                              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">Did You Know</h4>
                            </div>
                            <ul className="text-xs space-y-1">
                              {insights.did_you_know.map((item, index) => (
                                <li key={index} className="text-blue-700 dark:text-blue-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300">
                                Contradictions
                              </h4>
                            </div>
                            <ul className="text-xs space-y-1">
                              {insights.contradictions.map((item, index) => (
                                <li key={index} className="text-orange-700 dark:text-orange-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-950/20">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-purple-600" />
                              <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">Examples</h4>
                            </div>
                            <ul className="text-xs space-y-1">
                              {insights.examples.map((item, index) => (
                                <li key={index} className="text-purple-700 dark:text-purple-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {!insights && !isProcessingInsights && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No insights generated yet</p>
                          <p className="text-xs">Select text and click "Analyse Selected Text"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "related" && (
                    <div className="space-y-3">
                      {isQueryingDocuments && (
                        <div className="p-3 border rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                              Searching Related Documents...
                            </span>
                          </div>
                        </div>
                      )}

                      {queryResult && (
                        <div className="space-y-3">
                          <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-950/20">
                            <div className="flex items-center gap-2 mb-2">
                              <Database className="h-4 w-4 text-slate-600" />
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">AI Analysis</h4>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300 bg-background p-2 rounded border max-h-32 overflow-y-auto">
                              {queryResult.answer}
                            </div>
                          </div>

                          {queryResult.sources.length > 0 && (
                            <div className="p-3 border rounded-lg bg-teal-50 dark:bg-teal-950/20">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-4 w-4 text-teal-600" />
                                <h4 className="text-sm font-medium text-teal-700 dark:text-teal-300">
                                  Related Sources ({Math.min(queryResult.sources.length, 5)} of{" "}
                                  {queryResult.sources.length})
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {queryResult.sources.slice(0, 5).map((source, index) => (
                                  <div
                                    key={index}
                                    className="text-xs border rounded p-2 bg-background cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => handleContextClick(source.file, source.page)}
                                    title="Click to open this document and jump to the page"
                                  >
                                    <div className="font-medium text-teal-700 dark:text-teal-300 mb-1 truncate">
                                      📄 {source.file.split("/").pop() || source.file} (Page {source.page})
                                    </div>
                                    <div className="text-muted-foreground line-clamp-3 break-words">
                                      {source.content}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {!queryResult && !isQueryingDocuments && (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No related documents found</p>
                          <p className="text-xs">Select text and click "Analyse Selected Text"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "podcast" && (
                    <div className="space-y-3">
                      {isGeneratingPodcast && (
                        <div className="p-3 border rounded-lg bg-pink-50 dark:bg-pink-950/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                            <span className="text-sm font-medium text-pink-700 dark:text-pink-300">
                              Generating Podcast...
                            </span>
                          </div>
                        </div>
                      )}

                      {podcast && (
                        <div className="p-3 border rounded-lg bg-pink-50 dark:bg-pink-950/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 w-4 text-pink-600">🎙️</div>
                            <h4 className="text-sm font-medium text-pink-700 dark:text-pink-300">AI Podcast</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={togglePodcastPlayback}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2 bg-transparent"
                              >
                                {isPlaying ? "⏸️ Pause" : "▶️ Play"}
                              </Button>
                            </div>
                            <audio
                              ref={audioRef}
                              src={podcast.audioFile}
                              onEnded={handleAudioEnded}
                              preload="metadata"
                            />
                            <details className="text-xs">
                              <summary className="cursor-pointer text-pink-700 dark:text-pink-300 hover:underline">
                                View Script
                              </summary>
                              <div className="mt-2 p-2 bg-background rounded border text-muted-foreground max-h-32 overflow-y-auto">
                                {podcast.script}
                              </div>
                            </details>
                          </div>
                        </div>
                      )}

                      {!podcast && !isGeneratingPodcast && (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="h-8 w-8 mx-auto mb-2 opacity-50">🎙️</div>
                          <p className="text-sm">No podcast generated yet</p>
                          <p className="text-xs">Select text and click "Analyse Selected Text"</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Related documents will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
