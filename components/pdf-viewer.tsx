"use client"

import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react"

interface PDFViewerProps {
  fileUrl: string
  fileName: string
  onTextSelection?: (selectedText: string) => void
  clientId?: string
}

export interface PDFViewerRef {
  getSelectedText: () => Promise<{ type: string; data: string } | null>
  goToPage: (pageNumber: number) => Promise<boolean>
}

// ---- Global type for AdobeDC ----
declare global {
  interface Window {
    AdobeDC?: {
      View: new (config: {
        clientId: string
        divId: string
        downloadWithCredentials?: boolean
      }) => {
        previewFile: (
          config: {
            content: {
              location?: { url: string; headers?: { key: string; value: string }[] }
              promise?: Promise<ArrayBuffer>
            }
            metaData: { fileName: string; id?: string; hasReadOnlyAccess?: boolean }
          },
          viewerConfig?: {
            embedMode?: "FULL_WINDOW" | "LIGHT_BOX" | "SIZED_CONTAINER" | "IN_LINE"
            showDownloadPDF?: boolean
            showPrintPDF?: boolean
            showLeftHandPanel?: boolean
            showAnnotationTools?: boolean
            enableFilePreviewEvents?: boolean
            enablePDFAnalytics?: boolean
          },
        ) => Promise<{
          getAnnotationManager: () => Promise<any>
          getAPIs: () => Promise<{
            getSelectedContent: () => Promise<{ type: string; data: string }>
            gotoLocation: (pageNumber: number, xCoordinate?: number, yCoordinate?: number) => Promise<void>
          }>
        }>
      }
    }
  }
}

const PDFViewer = forwardRef<PDFViewerRef, PDFViewerProps>(({ fileUrl, fileName, onTextSelection, clientId }, ref) => {
  const viewerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const previewFilePromiseRef = useRef<Promise<any> | null>(null)

  const ADOBE_CLIENT_ID = clientId || process.env.NEXT_PUBLIC_ADOBE_EMBED_API_KEY || "f84d12eae8444368af3ad9bfa90bf615"

  useImperativeHandle(ref, () => ({
    getSelectedText: async () => {
      try {
        console.log("[v0] getSelectedText called, checking promise...")

        if (!previewFilePromiseRef.current) {
          console.warn("[v0] Viewer promise not available")
          return null
        }

        console.log("[v0] Promise available, calling getSelectedContent...")

        const result = await previewFilePromiseRef.current
          .then((adobeViewer: any) => adobeViewer.getAPIs())
          .then((apis: any) => apis.getSelectedContent())

        console.log("[v0] getSelectedContent result:", result)

        if (!result || !result.data) {
          console.log("[v0] No text selected")
          return { type: "text", data: "" }
        }

        return result
      } catch (e: any) {
        console.error("[v0] getSelectedContent failed:", e?.message || e)
        return null
      }
    },
    goToPage: async (pageNumber: number) => {
      try {
        console.log("[v0] goToPage called with page:", pageNumber)

        if (!previewFilePromiseRef.current) {
          console.warn("[v0] Viewer promise not available for page navigation")
          return false
        }

        console.log("[v0] Navigating to page:", pageNumber)

        await previewFilePromiseRef.current
          .then((adobeViewer: any) => adobeViewer.getAPIs())
          .then((apis: any) => apis.gotoLocation(pageNumber))

        console.log("[v0] Successfully navigated to page:", pageNumber)
        return true
      } catch (e: any) {
        console.error("[v0] goToPage failed:", e?.message || e)
        return false
      }
    },
  }))

  useEffect(() => {
    let cancelled = false

    const initializeViewer = () => {
      if (cancelled) return
      try {
        if (!viewerRef.current) throw new Error("Viewer container not mounted.")

        viewerRef.current.innerHTML = ""
        const viewerId = `adobe-dc-view-${Date.now()}`
        const container = document.createElement("div")
        container.id = viewerId
        container.style.height = "100%"
        container.style.width = "100%"
        viewerRef.current.appendChild(container)

        console.log("[v0] Initializing Adobe DC View with client ID:", ADOBE_CLIENT_ID)

        const adobeDCView = new window.AdobeDC!.View({
          clientId: ADOBE_CLIENT_ID,
          divId: viewerId,
        })

        const previewConfig = {
          content: { location: { url: fileUrl } },
          metaData: { fileName },
        }

        const viewerConfig = {
          embedMode: "SIZED_CONTAINER" as const,
          showDownloadPDF: true,
          showPrintPDF: true,
          showLeftHandPanel: true,
          showAnnotationTools: false,
          enableFilePreviewEvents: true,
          enablePDFAnalytics: true,
        }

        previewFilePromiseRef.current = adobeDCView.previewFile(previewConfig, viewerConfig)

        previewFilePromiseRef.current
          .then((adobeViewer) => {
            if (cancelled) return
            console.log("[v0] PDF loaded successfully")
            setIsLoading(false)
          })
          .catch((error) => {
            if (cancelled) return
            console.error("[v0] Preview file error:", error)
            setErr(`Failed to load PDF: ${error.message}`)
            setIsLoading(false)
          })
      } catch (e: any) {
        if (cancelled) return
        console.error("[v0] Viewer initialization error:", e)
        setErr(e?.message || "Failed to initialize PDF viewer.")
        setIsLoading(false)
      }
    }

    if (window.AdobeDC) {
      console.log("[v0] Adobe SDK already loaded")
      initializeViewer()
    } else {
      console.log("[v0] Waiting for Adobe SDK to load...")
      const handleSDKReady = () => {
        console.log("[v0] Adobe SDK ready event fired")
        document.removeEventListener("adobe_dc_view_sdk.ready", handleSDKReady)
        initializeViewer()
      }
      document.addEventListener("adobe_dc_view_sdk.ready", handleSDKReady)
    }

    return () => {
      cancelled = true
    }
  }, [fileUrl, fileName, ADOBE_CLIENT_ID])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
            zIndex: 10,
          }}
        >
          <span>Loading PDF viewer…</span>
        </div>
      )}
      {err && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "crimson",
            zIndex: 10,
            padding: 16,
            textAlign: "center",
          }}
        >
          {err}
        </div>
      )}
      <div ref={viewerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  )
})

PDFViewer.displayName = "PDFViewer"

export default PDFViewer
