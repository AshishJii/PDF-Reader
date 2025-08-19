import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const filename = params.filename

    // Validate filename to prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new NextResponse("Invalid filename", { status: 400 })
    }

    // Only allow .wav files
    if (!filename.endsWith(".wav")) {
      return new NextResponse("Only WAV files are allowed", { status: 400 })
    }

    const audioPath = path.join(process.cwd(), "temp", "audio", filename)

    // Check if file exists
    if (!existsSync(audioPath)) {
      return new NextResponse("Audio file not found", { status: 404 })
    }

    // Read the audio file
    const audioBuffer = await readFile(audioPath)

    // Return the audio file with proper headers
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("[v0] Error serving audio file:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
