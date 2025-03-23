"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface OAuthButtonProps {
  provider: "google" | "github" | "twitter"
  onClick: () => Promise<void>
  className?: string
}

const providerIcons = {
  google: "/google.svg",
  github: "/github.svg",
  twitter: "/twitter.svg",
}

const providerNames = {
  google: "Google",
  github: "GitHub",
  twitter: "Twitter",
}

export function OAuthButton({ provider, onClick, className }: OAuthButtonProps) {
  return (
    <Button
      variant="outline"
      type="button"
      onClick={onClick}
      className={cn("flex items-center justify-center gap-2 w-full", className)}
    >
      {/* Replace with actual SVG icons in your public folder */}
      <div className="relative w-4 h-4">
        <Image
          src={providerIcons[provider] || "/placeholder.svg"}
          alt={`${providerNames[provider]} logo`}
          fill
          className="object-contain"
        />
      </div>
      <span>Continue with {providerNames[provider]}</span>
    </Button>
  )
}

