"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, Mic, FileText } from "lucide-react"
import type { PodcastData } from "@/types/pdf-reader"

interface PodcastPanelProps {
  podcast: PodcastData | null
  isGeneratingPodcast: boolean
}

export function PodcastPanel({ podcast, isGeneratingPodcast }: PodcastPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime)
      }
    }

    const updateDuration = () => {
      setDuration(audio.duration)
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("durationchange", updateDuration)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("durationchange", updateDuration)
    }
  }, [isDragging])

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration

    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true)
    handleProgressClick(e)
  }

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !audioRef.current || !duration) return
    handleProgressClick(e)
  }

  const handleProgressMouseUp = () => {
    setIsDragging(false)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  if (isGeneratingPodcast) {
    return (
      <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
          <span className="text-sm font-semibold text-purple-700">Generating Podcast...</span>
        </div>
        <p className="text-xs text-purple-600">Creating two-person dialogue from your content...</p>
      </div>
    )
  }

  if (!podcast) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="bg-purple-50 rounded-full p-6 w-fit mx-auto mb-4">
          <Mic className="h-12 w-12 text-purple-400" />
        </div>
        <p className="text-base font-medium mb-2">No podcast generated yet</p>
        <p className="text-sm">Select text and click "Analyse Selected Text" to create an audio discussion</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Mic className="h-5 w-5 text-purple-600" />
          </div>
          <h4 className="text-base font-bold text-purple-700">AI Podcast Discussion</h4>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Button
            onClick={togglePodcastPlayback}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {isPlaying ? (
              <>
                <Pause className="h-5 w-5 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Play Discussion
              </>
            )}
          </Button>
        </div>

        <div className="mb-4 space-y-2">
          <div
            className="relative h-2 bg-purple-200 rounded-full cursor-pointer group"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={handleProgressMouseMove}
            onMouseUp={handleProgressMouseUp}
            onMouseLeave={handleProgressMouseUp}
          >
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-600 to-purple-500 rounded-full transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing"
              style={{ left: `calc(${progressPercentage}% - 8px)` }}
            />
          </div>
          <div className="flex justify-between text-xs text-purple-600 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <audio ref={audioRef} src={podcast.audioFile} onEnded={handleAudioEnded} preload="metadata" />

        <details className="text-sm group">
          <summary className="cursor-pointer text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2 py-2 transition-colors">
            <FileText className="h-4 w-4" />
            View Conversation Script
            <span className="text-xs text-muted-foreground ml-auto group-open:hidden">Click to expand</span>
          </summary>
          <div className="mt-3 p-4 bg-background rounded-lg border shadow-sm text-foreground max-h-48 overflow-y-auto leading-relaxed">
            <div className="whitespace-pre-wrap">{podcast.script}</div>
          </div>
        </details>
      </div>
    </div>
  )
}
