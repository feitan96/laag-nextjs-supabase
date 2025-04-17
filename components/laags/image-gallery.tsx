"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { ImageGalleryProps } from "@/types"
import { LaagImage } from "./laag-image"
import { useLaagImage } from "@/hooks/useLaagImage"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { DialogTitle } from "@/components/ui/dialog"

function ImageViewer({ imagePath }: { imagePath: string }) {
  const imageUrl = useLaagImage(imagePath)
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full h-full">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt="Laag image"
          fill
          className="object-contain"
          unoptimized
          sizes="100vw"
          priority
        />
      </div>
    </div>
  )
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const filteredImages = images.filter((img) => !img.is_deleted)
  const selectedImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null

  if (filteredImages.length === 0) return null

  const getImageGridClass = () => {
    const count = filteredImages.length

    switch (count) {
      case 1:
        return "grid-cols-1 aspect-square"
      case 2:
        return "grid-cols-2"
      case 3:
        return "grid-cols-2 grid-rows-2 aspect-square"
      case 4:
        return "grid-cols-2 grid-rows-2 aspect-square"
      default:
        return "grid-cols-2 grid-rows-2 aspect-square"
    }
  }

  const getImageClass = (index: number) => {
    const count = filteredImages.length

    if (count === 3) {
      if (index === 0) {
        return "col-span-2 h-full"
      }
      return "h-full"
    }
    return "h-full"
  }

  return (
    <>
      <div className={`grid gap-0.5 ${getImageGridClass()}`}>
        {filteredImages.slice(0, 4).map((image, index) => {
          const showMoreOverlay = index === 3 && filteredImages.length > 4
          const containerClass = getImageClass(index)

          return (
            <div key={image.id} className={`relative overflow-hidden ${containerClass}`}>
              <LaagImage
                imagePath={image.image}
                onClick={() => setSelectedImageIndex(index)}
                priority={index === 0}
                className="object-cover"
              />

              {showMoreOverlay && (
                <div
                  className="absolute inset-0 bg-black/70 flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <div className="text-white text-center">
                    <p className="text-xl font-bold">+{filteredImages.length - 4}</p>
                    <p className="text-sm">more photos</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={selectedImageIndex !== null} onOpenChange={(open) => !open && setSelectedImageIndex(null)}>
        <DialogContent className="max-w-none w-[85vw] max-h-[85vh] h-[85vh] p-0 bg-black/95 backdrop-blur-sm border-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-none 2xl:max-w-none">
          <DialogTitle className="sr-only">Image Viewer</DialogTitle>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50 text-white bg-black/40 hover:bg-black/60"
            onClick={() => setSelectedImageIndex(null)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>

          <div className="relative w-full h-full">
            {selectedImage && <ImageViewer imagePath={selectedImage.image} />}

            {/* Left navigation button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/60 h-10 w-10"
              onClick={() =>
                setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredImages.length - 1))
              }
            >
              <ChevronLeft className="h-6 w-6" />
              <span className="sr-only">Previous</span>
            </Button>

            {/* Right navigation button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white bg-black/40 hover:bg-black/60 h-10 w-10"
              onClick={() =>
                setSelectedImageIndex((prev) => (prev !== null && prev < filteredImages.length - 1 ? prev + 1 : 0))
              }
            >
              <ChevronRight className="h-6 w-6" />
              <span className="sr-only">Next</span>
            </Button>
          </div>

          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} / {filteredImages.length}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
