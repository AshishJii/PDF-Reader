"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lightbulb, FileText, Zap, Mic } from "lucide-react"
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
    <Card className="flex flex-col w-1/3 rounded-none border-t-0 border-l-0 border-b-0 border-r-0 bg-card">
      <CardHeader className="pb-4 px-6">
        <CardTitle className="text-lg font-bold text-foreground mb-4">Content Analysis</CardTitle>
        {selectedDocument && (
          <Button
            onClick={onGetSelectedContent}
            disabled={isGettingSelection}
            className="mb-6 w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
          >
            {isGettingSelection ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-3"></div>
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-3" />
                Analyse Selected Text
              </>
            )}
          </Button>
        )}
        <div className="flex bg-muted/30 rounded-md p-0.5 border border-border/30">
          <button
            onClick={() => onActiveTabChange("insights")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-sm transition-all duration-200 ${
              activeTab === "insights"
                ? "bg-background/80 text-foreground/90 shadow-sm border border-border/50"
                : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-background/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5" />
              Insights
            </div>
          </button>
          <button
            onClick={() => onActiveTabChange("related")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-sm transition-all duration-200 ${
              activeTab === "related"
                ? "bg-background/80 text-foreground/90 shadow-sm border border-border/50"
                : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-background/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Related
            </div>
          </button>
          <button
            onClick={() => onActiveTabChange("podcast")}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-sm transition-all duration-200 ${
              activeTab === "podcast"
                ? "bg-background/80 text-foreground/90 shadow-sm border border-border/50"
                : "text-muted-foreground/70 hover:text-muted-foreground hover:bg-background/30"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              Podcast
            </div>
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-6 pb-6 min-h-0">
        {selectedDocument ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
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
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-base font-medium mb-2">Ready for Analysis</p>
              <p className="text-sm">Upload and select a document to begin</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
