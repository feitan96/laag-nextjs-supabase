import { createClient } from "@/utils/supabase/client"
import { useEffect, useState } from "react"

export function useLaagImage(imagePath: string | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchImage() {
      if (!imagePath) {
        setImageUrl(null)
        return
      }

      try {
        const { data, error } = await supabase.storage
          .from("laags")
          .download(imagePath)

        if (error) throw error

        const url = URL.createObjectURL(data)
        setImageUrl(url)

        return () => {
          URL.revokeObjectURL(url)
        }
      } catch (error) {
        console.error("Error fetching laag image:", error)
        setImageUrl(null)
      }
    }

    fetchImage()
  }, [imagePath, supabase])

  return imageUrl
} 