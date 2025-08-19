import { NextResponse } from "next/server"
import { readdir, stat } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function GET() {
  try {
    const docsDir = path.join(process.cwd(), "docs")
    console.log("[v0] Loading documents from:", docsDir)

    if (!existsSync(docsDir)) {
      console.log("[v0] Docs directory doesn't exist, returning empty array")
      return NextResponse.json({ documents: [] })
    }

    const files = await readdir(docsDir)
    const pdfFiles = files.filter((file) => file.toLowerCase().endsWith(".pdf"))
    console.log("[v0] Found PDF files:", pdfFiles)

    const documents = await Promise.all(
      pdfFiles.map(async (fileName) => {
        const filePath = path.join(docsDir, fileName)
        const stats = await stat(filePath)

        return {
          id: fileName.replace(/[^a-zA-Z0-9]/g, "_") + "_" + stats.mtime.getTime(),
          name: fileName,
          url: `/api/serve-document/${encodeURIComponent(fileName)}`,
          uploadDate: stats.mtime,
          processing: false,
          size: stats.size,
        }
      }),
    )

    console.log("[v0] Loaded documents:", documents.length)
    return NextResponse.json({ documents })
  } catch (error) {
    console.error("[v0] Error loading documents:", error)
    return NextResponse.json({ error: "Failed to load documents" }, { status: 500 })
  }
}
