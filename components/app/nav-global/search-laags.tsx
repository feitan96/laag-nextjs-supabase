"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function SearchLaags() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "")
  
  const shouldShow = pathname === "/user/feed" || pathname.match(/^\/user\/groups\/[^/]+$/)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)
    if (searchInput.trim()) {
      params.set("q", searchInput.trim())
    } else {
      params.delete("q")
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const clearSearch = () => {
    setSearchInput("")
    const params = new URLSearchParams(searchParams)
    params.delete("q")
    router.replace(`${pathname}?${params.toString()}`)
  }

  if (!shouldShow) return null

  return (
    <div className="relative max-w-md w-full flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search laags..."
          className="pl-8 pr-8"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {searchInput && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button size="icon" onClick={handleSearch}>
        <Search className="h-4 w-4" />
      </Button>
    </div>
  )
}