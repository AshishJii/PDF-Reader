"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { PodcastData } from "@/types/pdf-reader"

interface PodcastPanelProps {
  podcast: PodcastData | null
  isGeneratingPodcast: boolean
}

export function PodcastPanel({ podcast, isGeneratingPodcast }: PodcastPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePodcastPlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  if (isGeneratingPodcast) {
    return (
      <div className="p-3 border rounded-lg bg-pink-50 dark:bg-pink-950/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
          <span className="text-sm font-medium text-pink-700 dark:text-pink-300">Generating Podcast...</span>
        </div>
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="h-8 w-8 mx-auto mb-2 opacity-50">🎙️</div>
        <p className="text-sm">No podcast generated yet</p>
        <p className="text-xs">Select text and click "Analyse Selected Text"</p>
      </div>
    )
  }

  return (
    <div className="p-3 border rounded-lg bg-pink-50 dark:bg-pink-950/20">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-4 text-pink-600">🎙️</div>
        <h4 className="text-sm font-medium text-pink-700 dark:text-pink-300">AI Podcast</h4>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Button
            onClick={togglePodcastPlayback}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            {isPlaying ? "⏸️ Pause" : "▶️ Play"}
          </Button>
        </div>
        <audio ref={audioRef} src={podcast.audioFile} onEnded={handleAudioEnded} preload="metadata" />
        <details className="text-xs">
          <summary className="cursor-pointer text-pink-700 dark:text-pink-300 hover:underline">View Script</summary>
          <div className="mt-2 p-2 bg-background rounded border text-muted-foreground max-h-32 overflow-y-auto">
            {podcast.script}
          </div>
        </details>
      </div>
    </div>
  )
}
