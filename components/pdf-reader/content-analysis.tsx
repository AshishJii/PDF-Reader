"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, FileText, Zap } from "lucide-react"
import { InsightsPanel } from "./insights-panel"
import { RelatedPanel } from "./related-panel"
import { PodcastPanel } from "./podcast-panel"
import type { PDFDocument, InsightsData, QueryResult, PodcastData } from "@/types/pdf-reader"

interface ContentAnalysisProps {
  selectedDocument: PDFDocument | null
  activeTab: "insights" | "related" | "podcast"
  insights: InsightsData | null
  queryResult: QueryResult | null
  podcast: PodcastData | null
  isGettingSelection: boolean
  isProcessingInsights: boolean
  isQueryingDocuments: boolean
  isGeneratingPodcast: boolean
  onActiveTabChange: (tab: "insights" | "related" | "podcast") => void
  onGetSelectedContent: () => void
  onContextClick: (fileName: string, pageNumber?: string) => void
}

export function ContentAnalysis({
  selectedDocument,
  activeTab,
  insights,
  queryResult,
  podcast,
  isGettingSelection,
  isProcessingInsights,
  isQueryingDocuments,
  isGeneratingPodcast,
  onActiveTabChange,
  onGetSelectedContent,
  onContextClick,
}: ContentAnalysisProps) {
  return (
    <Card className="flex flex-col w-1/3 rounded-none border-t-0 border-l-0 border-b-0 border-r-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base mb-3">Content Analysis</CardTitle>
        {selectedDocument && (
          <Button
            onClick={onGetSelectedContent}
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
            onClick={() => onActiveTabChange("insights")}
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
            onClick={() => onActiveTabChange("related")}
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
            onClick={() => onActiveTabChange("podcast")}
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
                <InsightsPanel insights={insights} isProcessingInsights={isProcessingInsights} />
              )}
              {activeTab === "related" && (
                <RelatedPanel
                  queryResult={queryResult}
                  isQueryingDocuments={isQueryingDocuments}
                  onContextClick={onContextClick}
                />
              )}
              {activeTab === "podcast" && <PodcastPanel podcast={podcast} isGeneratingPodcast={isGeneratingPodcast} />}
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
  )
}
