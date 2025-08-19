export interface PDFDocument {
  id: string
  name: string
  url: string
  uploadDate: Date
  processing: boolean
  size: number
  error?: string
  ingested?: boolean
  ingesting?: boolean
  ingestionError?: string
}

export interface InsightsData {
  query: string
  model: string
  temperature: number
  key_takeaways: string[]
  did_you_know: string[]
  contradictions: string[]
  examples: string[]
}

export interface QueryResult {
  answer: string
  sources: Array<{
    file: string
    page: string
    content: string
  }>
  query: string
}

export interface PodcastData {
  script: string
  audioFile: string
  audioPath: string
}
