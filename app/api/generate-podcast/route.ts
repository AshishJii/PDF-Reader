import { type NextRequest, NextResponse } from "next/server"
import { spawn } from "child_process"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    const { content, gender = "F" } = await request.json()

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const requiredEnvVars = ["GOOGLE_API_KEY"]
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

    if (missingVars.length > 0) {
      console.error(`[v0] Missing environment variables: ${missingVars.join(", ")}`)
      return NextResponse.json(
        {
          success: false,
          error: `Missing required environment variables: ${missingVars.join(", ")}. Please add them in Project Settings.`,
        },
        { status: 500 },
      )
    }

    const scriptPath = path.join(process.cwd(), "scripts", "generate-podcast.py")

    console.log(`[v0] Starting podcast generation with script: ${scriptPath}`)
    console.log(`[v0] Content length: ${content.length} characters`)
    console.log(`[v0] Voice gender: ${gender}`)

    return new Promise((resolve) => {
      const pythonProcess = spawn("python", [scriptPath, content, "--gender", gender])

      let output = ""
      let errorOutput = ""

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on("data", (data) => {
        const errorData = data.toString()
        errorOutput += errorData
        console.error(`[v0] Python script stderr: ${errorData.trim()}`)
      })

      pythonProcess.on("close", (code) => {
        console.log(`[v0] Python script exited with code: ${code}`)
        console.log(`[v0] Script stdout: ${output}`)
        if (errorOutput) {
          console.error(`[v0] Script stderr: ${errorOutput}`)
        }

        if (code === 0) {
          try {
            const result = JSON.parse(output)
            if (result.ok) {
              console.log(`[v0] Podcast generated successfully: ${result.audio_file}`)
              resolve(
                NextResponse.json({
                  success: true,
                  script: result.script,
                  audioFile: result.audio_file,
                  audioPath: result.audio_path,
                }),
              )
            } else {
              console.error(`[v0] Script returned error: ${result.error}`)
              resolve(
                NextResponse.json(
                  {
                    success: false,
                    error: result.error || "Unknown error",
                  },
                  { status: 500 },
                ),
              )
            }
          } catch (parseError) {
            console.error(`[v0] Failed to parse script output: ${parseError}`)
            resolve(
              NextResponse.json(
                {
                  success: false,
                  error: "Failed to parse script output",
                  details: output,
                  stderr: errorOutput,
                },
                { status: 500 },
              ),
            )
          }
        } else {
          console.error(`[v0] Script execution failed with code ${code}`)
          resolve(
            NextResponse.json(
              {
                success: false,
                error: `Script execution failed with exit code ${code}`,
                code,
                stderr: errorOutput,
                stdout: output,
              },
              { status: 500 },
            ),
          )
        }
      })

      pythonProcess.on("error", (error) => {
        console.error(`[v0] Failed to spawn Python process: ${error}`)
        resolve(
          NextResponse.json(
            {
              success: false,
              error: `Failed to start Python script: ${error.message}`,
            },
            { status: 500 },
          ),
        )
      })
    })
  } catch (error) {
    console.error("[v0] Error in podcast API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
