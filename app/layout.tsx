import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col items-center justify-center`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <main className="w-full max-w-2xl px-4 py-10">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

