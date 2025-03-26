// hooks/useAvatar.ts
"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/utils/supabase/client"

const supabase = createClient()

export function useAvatar(url: string | null) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from("avatars").download(path)
        if (error) {
          throw error
        }

        // Clean up previous object URL
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current)
        }

        const url = URL.createObjectURL(data)
        objectUrlRef.current = url
        setAvatarUrl(url)
      } catch (error) {
        console.log("Error downloading image: ", error)
      }
    }

    if (url) {
      downloadImage(url)
    } else {
      setAvatarUrl(null)
    }

    // Cleanup function
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    }
  }, [url])

  return avatarUrl
}