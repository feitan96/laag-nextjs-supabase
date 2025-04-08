"use client"

import { ImageIcon } from "lucide-react"
import Image from "next/image"
import { useLaagImage } from "@/hooks/useLaagImage"
import { LaagImageProps } from "@/types"

export function LaagImage({ imagePath, onClick, priority = false }: LaagImageProps) {
  const imageUrl = useLaagImage(imagePath)

  return (
    <div className="relative aspect-square rounded-md overflow-hidden cursor-pointer">
      {imageUrl ? (
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt="Laag image"
          fill
          priority={priority}
          className="object-cover transition-transform hover:scale-105"
          unoptimized
          onClick={onClick}
        />
      ) : (
        <div className="relative aspect-square rounded-md bg-muted flex items-center justify-center" onClick={onClick}>
          <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
        </div>
      )}
    </div>
  )
} 