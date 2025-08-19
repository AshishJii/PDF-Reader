"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, X, AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react"
import type { PDFDocument } from "@/types/pdf-reader"

interface DocumentItemProps {
  document: PDFDocument
  isSelected: boolean
  uploadProgress?: number
  onSelect: (document: PDFDocument) => void
  onRemove: (docId: string, e: React.MouseEvent) => void
  onRetryIngestion: (docId: string, fileName: string, e: React.MouseEvent) => void
}

export function DocumentItem({
  document,
  isSelected,
  uploadProgress,
  onSelect,
  onRemove,
  onRetryIngestion,
}: DocumentItemProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div
      className={`p-2 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? "bg-primary/10 border-primary shadow-sm" : "border-border hover:border-primary/30"
      }`}
      onClick={() => !document.processing && !document.error && onSelect(document)}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p
            className={`text-xs font-medium truncate ${isSelected ? "text-primary font-semibold" : "text-foreground"}`}
          >
            {document.name}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatFileSize(document.size)}</span>
            <span>•</span>
            <span>
              {document.processing
                ? "Processing..."
                : document.error
                  ? "Failed"
                  : document.uploadDate.toLocaleDateString()}
            </span>
          </div>
          {uploadProgress && <Progress value={uploadProgress} className="mt-2 h-1" />}
          {!document.processing && !document.error && (
            <div className="flex items-center gap-1 mt-1">
              {document.ingesting && (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                  <span className="text-xs text-blue-600">Ingesting...</span>
                </>
              )}
              {document.ingested && !document.ingesting && (
                <>
                  <Database className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">Ingested</span>
                </>
              )}
              {document.ingestionError && (
                <>
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-600">Ingestion failed</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {document.processing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>}
          {document.error && <AlertCircle className="h-4 w-4 text-destructive" />}
          {!document.processing && !document.error && (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              {document.ingestionError && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-600"
                  onClick={(e) => onRetryIngestion(document.id, document.name, e)}
                  title="Retry ingestion"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => onRemove(document.id, e)}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
