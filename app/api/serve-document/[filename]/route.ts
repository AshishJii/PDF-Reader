import { type NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export async function GET(request: NextRequest, { params }: { params: { filename: string } }) {
  try {
    const fileName = decodeURIComponent(params.filename)
    const filePath = path.join(process.cwd(), "docs", fileName)

    console.log("[v0] Serving document from:", filePath)

    if (!existsSync(filePath)) {
      console.log("[v0] File not found:", filePath)
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const fileBuffer = await readFile(filePath)
    console.log("[v0] Successfully served document:", fileName)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error serving document:", error)
    return NextResponse.json({ error: "Failed to serve document" }, { status: 500 })
  }
}
