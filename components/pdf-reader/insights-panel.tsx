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
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm font-semibold text-blue-700">Processing Insights...</span>
        </div>
        <p className="text-xs text-blue-600">Analyzing your selected content...</p>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="bg-blue-50 rounded-full p-6 w-fit mx-auto mb-4">
          <Lightbulb className="h-12 w-12 text-blue-400" />
        </div>
        <p className="text-base font-medium mb-2">No insights generated yet</p>
        <p className="text-sm">Select text and click "Analyse Selected Text" to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 hover:bg-blue-100 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </div>
          <h4 className="text-base font-bold text-blue-700">Key Takeaways</h4>
        </div>
        <ul className="text-sm space-y-2">
          {insights.key_takeaways.map((item, index) => (
            <li key={index} className="text-foreground flex items-start gap-2">
              <span className="text-blue-600 font-bold mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border rounded-lg bg-cyan-50 border-cyan-200 hover:bg-cyan-100 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <HelpCircle className="h-5 w-5 text-cyan-600" />
          </div>
          <h4 className="text-base font-bold text-cyan-700">Did You Know</h4>
        </div>
        <ul className="text-sm space-y-2">
          {insights.did_you_know.map((item, index) => (
            <li key={index} className="text-foreground flex items-start gap-2">
              <span className="text-cyan-600 font-bold mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200 hover:bg-indigo-100 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-indigo-600" />
          </div>
          <h4 className="text-base font-bold text-indigo-700">Contradictions</h4>
        </div>
        <ul className="text-sm space-y-2">
          {insights.contradictions.map((item, index) => (
            <li key={index} className="text-foreground flex items-start gap-2">
              <span className="text-indigo-600 font-bold mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border rounded-lg bg-teal-50 border-teal-200 hover:bg-teal-100 transition-colors duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <BookOpen className="h-5 w-5 text-teal-600" />
          </div>
          <h4 className="text-base font-bold text-teal-700">Examples</h4>
        </div>
        <ul className="text-sm space-y-2">
          {insights.examples.map((item, index) => (
            <li key={index} className="text-foreground flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
