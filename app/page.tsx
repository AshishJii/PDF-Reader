"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { DocumentLibrary } from "@/components/pdf-reader/document-library"
import { PDFViewerSection } from "@/components/pdf-reader/pdf-viewer-section"
import { ContentAnalysis } from "@/components/pdf-reader/content-analysis"
import type { PDFViewerRef } from "@/components/pdf-viewer"
import type { PDFDocument, InsightsData, QueryResult, PodcastData } from "@/types/pdf-reader"

export default function PDFReaderApp() {
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [selectedDocument, setSelectedDocument] = useState<PDFDocument | null>(null)
  const [suggestedDocuments, setSuggestedDocuments] = useState<PDFDocument[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [uploadError, setUploadError] = useState<string | null>(null)
  const pdfViewerRef = useRef<PDFViewerRef>(null)
  const [isGettingSelection, setIsGettingSelection] = useState(false)
  const [selectedContent, setSelectedContent] = useState<string | null>(null)
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [isProcessingInsights, setIsProcessingInsights] = useState(false)
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [isQueryingDocuments, setIsQueryingDocuments] = useState(false)
  const [podcast, setPodcast] = useState<PodcastData | null>(null)
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false)
  const [activeTab, setActiveTab] = useState<"insights" | "related" | "podcast">("insights")
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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
        <DocumentLibrary
          documents={documents}
          selectedDocument={selectedDocument}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          onFileUpload={handleFileUpload}
          onDocumentSelect={handleDocumentSelect}
          onRemoveDocument={removeDocument}
          onRetryIngestion={retryIngestion}
        />

        <PDFViewerSection
          ref={pdfViewerRef}
          selectedDocument={selectedDocument}
          onTextSelection={handleTextSelection}
        />

        <ContentAnalysis
          selectedDocument={selectedDocument}
          activeTab={activeTab}
          insights={insights}
          queryResult={queryResult}
          podcast={podcast}
          isGettingSelection={isGettingSelection}
          isProcessingInsights={isProcessingInsights}
          isQueryingDocuments={isQueryingDocuments}
          isGeneratingPodcast={isGeneratingPodcast}
          onActiveTabChange={setActiveTab}
          onGetSelectedContent={handleGetSelectedContent}
          onContextClick={handleContextClick}
        />
      </div>
      {podcast && (
        <audio ref={audioRef} controls onEnded={handleAudioEnded}>
          <source src={podcast.audioPath} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      )}
    </div>
  )
}
