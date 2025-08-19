"use client"

import { forwardRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye } from "lucide-react"
import PDFViewer, { type PDFViewerRef } from "@/components/pdf-viewer"
import type { PDFDocument } from "@/types/pdf-reader"

interface PDFViewerSectionProps {
  selectedDocument: PDFDocument | null
  onTextSelection: (selectedText: string) => void
}

export const PDFViewerSection = forwardRef<PDFViewerRef, PDFViewerSectionProps>(
  ({ selectedDocument, onTextSelection }, ref) => {
    return (
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
              ref={ref}
              fileUrl={selectedDocument.url}
              fileName={selectedDocument.name}
              onTextSelection={onTextSelection}
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
    )
  },
)

PDFViewerSection.displayName = "PDFViewerSection"
