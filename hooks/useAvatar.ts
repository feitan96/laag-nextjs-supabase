// hooks/useAvatar.ts
"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"

export function useAvatar(url: string | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from("avatars").download(path)
        if (error) {
          throw error
        }

        const url = URL.createObjectURL(data)
        setAvatarUrl(url)
      } catch (error) {
        console.log("Error downloading image: ", error)
      }
    }

    if (url) {
      downloadImage(url)
    } else {
      setAvatarUrl(null) // Reset avatar URL if no URL is provided
    }
  }, [url, supabase])

  return avatarUrl
}