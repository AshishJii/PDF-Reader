import type React from "react"
// app/layout.tsx
import type { Metadata } from "next"
import Script from "next/script"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: "PDF Reader Application",
  description: "Advanced PDF reader with Adobe Embed API",
  generator: "v0.app",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>{/* Load Adobe PDF Embed SDK early to avoid race conditions */}</head>
      <body
        suppressHydrationWarning
        className={`${GeistSans.variable} ${GeistMono.variable}`}
        style={{ fontFamily: GeistSans.style.fontFamily }}
      >
        {children}
        <Script src="https://acrobatservices.adobe.com/view-sdk/viewer.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
