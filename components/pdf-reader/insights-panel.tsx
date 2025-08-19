"use client"

import { Lightbulb, HelpCircle, AlertTriangle, BookOpen } from "lucide-react"
import type { InsightsData } from "@/types/pdf-reader"

interface InsightsPanelProps {
  insights: InsightsData | null
  isProcessingInsights: boolean
}

export function InsightsPanel({ insights, isProcessingInsights }: InsightsPanelProps) {
  if (isProcessingInsights) {
    return (
      <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processing Insights...</span>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No insights generated yet</p>
        <p className="text-xs">Select text and click "Analyse Selected Text"</p>
      </div>
    )
  }

  return (
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
          <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300">Contradictions</h4>
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
  )
}
