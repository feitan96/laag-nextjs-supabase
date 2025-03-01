"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Avatar as AvatarUI, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Upload, User } from "lucide-react"
import { Input } from "@/components/ui/input"

interface AvatarProps {
  uid: string | null
  url: string | null
  size: number
  onUpload: (url: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function Avatar({ uid, url, size, onUpload }: AvatarProps) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(url)
  const [uploading, setUploading] = useState(false)

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

    if (url) downloadImage(url)
  }, [url, supabase])

  const uploadAvatar: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.")
      }

      const file = event.target.files[0]
      const fileExt = file.name.split(".").pop()
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      onUpload(filePath)
      toast.success("Avatar uploaded successfully")
    } catch (error) {
      toast.error("Error uploading avatar")
      console.error("Error uploading avatar:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <AvatarUI className="h-24 w-24 border-2 border-muted">
        <AvatarImage src={avatarUrl || undefined} alt="Profile" />
        <AvatarFallback>
          <User className="h-12 w-12 text-muted-foreground" />
        </AvatarFallback>
      </AvatarUI>

      <div className="relative">
        <Label
          htmlFor="avatar-upload"
          className="cursor-pointer inline-flex items-center justify-center gap-2 text-sm font-medium"
        >
          <Button size="sm" variant="outline" className="gap-2" disabled={uploading}>
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload avatar"}
          </Button>
        </Label>
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={uploadAvatar}
          disabled={uploading}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}

