"use client"

import { FileText, Database, ExternalLink } from "lucide-react"
import type { QueryResult } from "@/types/pdf-reader"

interface RelatedPanelProps {
  queryResult: QueryResult | null
  isQueryingDocuments: boolean
  onContextClick: (fileName: string, pageNumber?: string) => void
}

export function RelatedPanel({ queryResult, isQueryingDocuments, onContextClick }: RelatedPanelProps) {
  if (isQueryingDocuments) {
    return (
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          <span className="text-sm font-semibold text-green-700">Searching Related Documents...</span>
        </div>
        <p className="text-xs text-green-600">Finding relevant content across your library...</p>
      </div>
    )
  }

  if (!queryResult) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="bg-green-50 rounded-full p-6 w-fit mx-auto mb-4">
          <FileText className="h-12 w-12 text-green-400" />
        </div>
        <p className="text-base font-medium mb-2">No related documents found</p>
        <p className="text-sm">Select text and click "Analyse Selected Text" to find connections</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-emerald-50 border-emerald-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Database className="h-5 w-5 text-emerald-600" />
          </div>
          <h4 className="text-base font-bold text-emerald-700">AI Analysis</h4>
        </div>
        <div className="text-sm text-foreground bg-background p-4 rounded-lg border shadow-sm max-h-40 overflow-y-auto leading-relaxed">
          {queryResult.answer}
        </div>
      </div>

      {queryResult.sources.length > 0 && (
        <div className="p-4 border rounded-lg bg-green-50 border-green-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="text-base font-bold text-green-700">
              Related Sources ({Math.min(queryResult.sources.length, 5)} of {queryResult.sources.length})
            </h4>
          </div>
          <div className="space-y-3">
            {queryResult.sources.slice(0, 5).map((source, index) => (
              <div
                key={index}
                className="text-sm border-2 rounded-xl p-4 bg-gradient-to-r from-background to-green-50/30 cursor-pointer hover:from-green-50 hover:to-green-100 hover:border-green-400 hover:shadow-lg transition-all duration-300 group transform hover:scale-[1.02] active:scale-[0.98] border-green-200"
                onClick={() => onContextClick(source.file, source.page)}
                title="Click to open this document and jump to the page"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-green-700 truncate flex items-center gap-2 group-hover:text-green-800 transition-colors">
                    <FileText className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    {source.file.split("/").pop() || source.file}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-green-600 transition-colors">
                    <span className="group-hover:underline group-hover:decoration-2 group-hover:decoration-green-500">
                      Page {source.page}
                    </span>
                    <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100 group-hover:text-green-600 group-hover:scale-110 transition-all duration-200" />
                  </div>
                </div>
                <div className="text-muted-foreground line-clamp-3 break-words leading-relaxed group-hover:text-foreground transition-colors border-l-2 border-transparent group-hover:border-green-400 pl-3 group-hover:pl-4 transition-all duration-200">
                  {source.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
