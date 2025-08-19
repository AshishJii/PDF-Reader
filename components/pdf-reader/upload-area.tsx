"use client"

import type React from "react"

import { useRef } from "react"
import { Upload } from "lucide-react"

interface UploadAreaProps {
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onFileSelect: (files: FileList) => void
}

export function UploadArea({ isDragOver, onDragOver, onDragLeave, onDrop, onFileSelect }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      onFileSelect(files)
    }
  }

  return (
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
          isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs font-medium mb-1">
          {isDragOver ? "Drop PDF files here" : "Click to upload or drag and drop"}
        </p>
        <p className="text-xs text-muted-foreground">PDF files only, max 50MB each</p>
      </div>
    </div>
  )
}
