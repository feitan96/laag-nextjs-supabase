import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { Toaster } from "sonner"
import "./globals.css"
import { AuthProvider } from "./context/auth-context"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <main className="w-full px-4">{children}</main>
          <Toaster />
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

