import { type NextRequest, NextResponse } from "next/server"
import { unlink } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function DELETE(request: NextRequest) {
  try {
    const { fileName } = await request.json()

    if (!fileName) {
      return NextResponse.json({ error: "No filename provided" }, { status: 400 })
    }

    const filePath = path.join(process.cwd(), "docs", fileName)
    console.log("[v0] Attempting to delete file:", filePath)

    if (existsSync(filePath)) {
      await unlink(filePath)
      console.log("[v0] Successfully deleted file:", fileName)
      return NextResponse.json({ success: true })
    } else {
      console.log("[v0] File not found for deletion:", filePath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("[v0] Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
