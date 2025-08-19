"use client"

import { FileText, Database } from "lucide-react"
import type { QueryResult } from "@/types/pdf-reader"

interface RelatedPanelProps {
  queryResult: QueryResult | null
  isQueryingDocuments: boolean
  onContextClick: (fileName: string, pageNumber?: string) => void
}

export function RelatedPanel({ queryResult, isQueryingDocuments, onContextClick }: RelatedPanelProps) {
  if (isQueryingDocuments) {
    return (
      <div className="p-3 border rounded-lg bg-indigo-50 dark:bg-indigo-950/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
          <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            Searching Related Documents...
          </span>
        </div>
      </div>
    )
  }

  if (!queryResult) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No related documents found</p>
        <p className="text-xs">Select text and click "Analyse Selected Text"</p>
      </div>
    )
  }

  return (
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
              Related Sources ({Math.min(queryResult.sources.length, 5)} of {queryResult.sources.length})
            </h4>
          </div>
          <div className="space-y-2">
            {queryResult.sources.slice(0, 5).map((source, index) => (
              <div
                key={index}
                className="text-xs border rounded p-2 bg-background cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onContextClick(source.file, source.page)}
                title="Click to open this document and jump to the page"
              >
                <div className="font-medium text-teal-700 dark:text-teal-300 mb-1 truncate">
                  📄 {source.file.split("/").pop() || source.file} (Page {source.page})
                </div>
                <div className="text-muted-foreground line-clamp-3 break-words">{source.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
