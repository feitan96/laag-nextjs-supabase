"use client"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description?: string
  showBackButton?: boolean
  backUrl?: string
}

export function PageHeader({ title, description, showBackButton = false, backUrl = "/" }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-center w-full pb-4 mb-4 border-b">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={backUrl}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}

