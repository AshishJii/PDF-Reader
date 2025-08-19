import { type NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const docsDir = path.join(process.cwd(), "docs")
    console.log("[v0] Docs directory path:", docsDir)

    if (!existsSync(docsDir)) {
      console.log("[v0] Creating docs directory...")
      await mkdir(docsDir, { recursive: true })
      console.log("[v0] Docs directory created successfully")
    }

    // Save file to docs directory
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filePath = path.join(docsDir, file.name)

    console.log("[v0] Saving file to:", filePath)
    await writeFile(filePath, buffer)
    console.log("[v0] File saved successfully:", file.name)

    return NextResponse.json({
      success: true,
      fileName: file.name,
      size: file.size,
      path: filePath,
    })
  } catch (error) {
    console.error("[v0] Error saving document:", error)
    return NextResponse.json({ error: "Failed to save document" }, { status: 500 })
  }
}
