import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    console.log("[v0] Querying documents with:", query)

    const scriptPath = path.join(process.cwd(), "scripts", "query.py")

    return new Promise((resolve) => {
      const pythonProcess = spawn("python", [scriptPath, query], {
        cwd: process.cwd(),
        env: { ...process.env },
      })

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on("close", (code) => {
        console.log("[v0] Query script finished with code:", code)
        console.log("[v0] Query output:", output)

        if (errorOutput) {
          console.log("[v0] Query errors:", errorOutput)
        }

        if (code !== 0) {
          resolve(
            NextResponse.json(
              {
                error: "Query script failed",
                details: errorOutput,
              },
              { status: 500 },
            ),
          )
          return
        }

        try {
          const result = JSON.parse(output.trim())
          resolve(NextResponse.json(result))
        } catch (parseError) {
          console.error("[v0] Failed to parse query result:", parseError)
          resolve(
            NextResponse.json(
              {
                error: "Failed to parse query result",
                output: output,
              },
              { status: 500 },
            ),
          )
        }
      })
    })
  } catch (error) {
    console.error("[v0] Query API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
