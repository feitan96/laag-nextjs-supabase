"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ImageGalleryProps } from "@/types"
import { LaagImage } from "./laag-image"
import { useLaagImage } from "@/hooks/useLaagImage"

function ImageViewer({ imagePath }: { imagePath: string }) {
  const imageUrl = useLaagImage(imagePath)
  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt="Laag image"
      fill
      className="object-contain"
      unoptimized
    />
  )
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const filteredImages = images.filter((img) => !img.is_deleted)
  const selectedImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null

  if (filteredImages.length === 0) return null

  const getImageGridClass = () => {
    switch (filteredImages.length) {
      case 1:
        return "grid-cols-1 aspect-video"
      case 2:
        return "grid-cols-2"
      case 3:
        return "grid-cols-2 grid-rows-2"
      case 4:
        return "grid-cols-2 grid-rows-2"
      default:
        return "grid-cols-3 grid-rows-3"
    }
  }

  return (
    <>
      <div className={`grid gap-1 ${getImageGridClass()}`}>
        {filteredImages.slice(0, 9).map((image, index) => {
          const isSpecialFirstImage = filteredImages.length === 3 && index === 0
          const showMoreOverlay = index === 8 && filteredImages.length > 9

          return (
            <div key={image.id} className={`relative ${isSpecialFirstImage ? "col-span-2 row-span-1" : ""}`}>
              <LaagImage imagePath={image.image} onClick={() => setSelectedImageIndex(index)} priority={index === 0} />

              {showMoreOverlay && (
                <div
                  className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-md cursor-pointer"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <div className="text-white text-center">
                    <p className="text-xl font-bold">+{filteredImages.length - 9}</p>
                    <p className="text-sm">more photos</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-sm">
          <div className="relative aspect-square sm:aspect-video w-full">
            {selectedImage && <ImageViewer imagePath={selectedImage.image} />}
          </div>
          <div className="p-4 flex justify-between items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1))
              }
            >
              <span className="sr-only">Previous</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <span className="text-sm">
              {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} / {filteredImages.length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setSelectedImageIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0))
              }
            >
              <span className="sr-only">Next</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 