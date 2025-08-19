"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileText, AlertCircle, BookOpen } from "lucide-react"
import { UploadArea } from "./upload-area"
import { DocumentItem } from "./document-item"
import type { PDFDocument } from "@/types/pdf-reader"

interface DocumentLibraryProps {
  documents: PDFDocument[]
  selectedDocument: PDFDocument | null
  uploadProgress: { [key: string]: number }
  uploadError: string | null
  onFileUpload: (files: FileList) => void
  onDocumentSelect: (document: PDFDocument) => void
  onRemoveDocument: (docId: string, e: React.MouseEvent) => void
  onRetryIngestion: (docId: string, fileName: string, e: React.MouseEvent) => void
}

export function DocumentLibrary({
  documents,
  selectedDocument,
  uploadProgress,
  uploadError,
  onFileUpload,
  onDocumentSelect,
  onRemoveDocument,
  onRetryIngestion,
}: DocumentLibraryProps) {
  const [isDragOver, setIsDragOver] = useState(false)

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
      onFileUpload(files)
    }
  }

  return (
    <Card className="flex flex-col w-1/4 rounded-none border-r border-t-0 border-l-0 border-b-0">
      <CardHeader className="pb-4 flex-shrink-0 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg shadow-sm">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent leading-tight">
              PDF Reader
            </CardTitle>
            <p className="text-xs text-amber-600/80 font-medium tracking-wide">INTELLIGENT ANALYSIS</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-amber-700">
          <Upload className="h-4 w-4" />
          <span className="text-sm font-medium">Document Library</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col px-4 min-h-0">
        <UploadArea
          isDragOver={isDragOver}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={onFileUpload}
        />

        {uploadError && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                document={doc}
                isSelected={selectedDocument?.id === doc.id}
                uploadProgress={uploadProgress[doc.id]}
                onSelect={onDocumentSelect}
                onRemove={onRemoveDocument}
                onRetryIngestion={onRetryIngestion}
              />
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
  )
}
