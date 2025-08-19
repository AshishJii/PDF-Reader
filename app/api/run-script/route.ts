import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { script, args = [] } = await request.json()

    if (!script) {
      return NextResponse.json({ success: false, error: "Script name is required" })
    }

    const scriptPath = path.join(process.cwd(), "scripts", script)
    const command = `python "${scriptPath}" ${args.map((arg: string) => `"${arg}"`).join(" ")}`

    console.log("[v0] Executing command:", command)

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    })

    if (stderr) {
      console.error("[v0] Script stderr:", stderr)
    }

    return NextResponse.json({
      success: true,
      output: stdout.trim(),
      error: stderr || null,
    })
  } catch (error: any) {
    console.error("[v0] Script execution error:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "Script execution failed",
    })
  }
}
