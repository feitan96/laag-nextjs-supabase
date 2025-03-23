// hooks/useGroupPicture.ts
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

export function useGroupPicture(url: string | null) {
  const [groupPictureUrl, setGroupPictureUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from("group").download(path)
        if (error) {
          console.error("Error downloading image from Supabase Storage:", error)
          throw error
        }

        const url = URL.createObjectURL(data)
        setGroupPictureUrl(url)
      } catch (error) {
        console.error("Error downloading image:", error)
      }
    }

    if (url) {
      downloadImage(url)
    } else {
      setGroupPictureUrl(null) // Reset group picture URL if no URL is provided
    }
  }, [url, supabase])

  return groupPictureUrl
}