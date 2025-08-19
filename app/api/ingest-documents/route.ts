import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { documentPaths } = await request.json()

    if (!documentPaths || !Array.isArray(documentPaths)) {
      return NextResponse.json({ success: false, message: "Document paths array is required" }, { status: 400 })
    }

    console.log("[v0] Starting document ingestion for:", documentPaths)

    // Convert relative paths to absolute paths
    const absolutePaths = documentPaths.map((docPath) => path.resolve(process.cwd(), docPath))

    // Execute the Python ingest script
    const command = `python scripts/ingest.py ${absolutePaths.map((p) => `"${p}"`).join(" ")}`
    console.log("[v0] Executing command:", command)

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 120000, // 2 minute timeout
    })

    console.log("[v0] Python stdout:", stdout)
    if (stderr) {
      console.log("[v0] Python stderr:", stderr)
    }

    // Parse the result from Python output
    const resultMatch = stdout.match(/RESULT: (.+)/)
    let result = { success: false, message: "No result found" }

    if (resultMatch) {
      try {
        result = JSON.parse(resultMatch[1])
      } catch (e) {
        console.error("[v0] Failed to parse Python result:", e)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Ingestion error:", error)
    return NextResponse.json({ success: false, message: `Ingestion failed: ${error.message}` }, { status: 500 })
  }
}
