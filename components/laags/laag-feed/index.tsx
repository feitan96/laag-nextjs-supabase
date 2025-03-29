"use client"

import { useEffect } from "react"
import { useLaags } from "@/hooks/useLaags"
import { LaagCard } from "./laag-card"
import { LaagFeedProps } from "@/types"

export function LaagFeed({ groupId }: LaagFeedProps) {
  const { laags, members, loading, error, refetch } = useLaags(groupId)

  useEffect(() => {
    refetch()
  }, [groupId, refetch])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg" />
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Error loading laags. Please try again later.</p>
      </div>
    )
  }

  if (!laags || laags.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No laags found. Be the first to create one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {laags.map((laag) => (
        <LaagCard key={laag.id} laag={laag} members={members} />
      ))}
    </div>
  )
} 