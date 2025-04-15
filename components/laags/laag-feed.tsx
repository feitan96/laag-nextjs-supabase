"use client"

import { LaagFeed as LaagFeedComponent } from "./laag-feed/index"
import type { Laag } from "@/types"

interface LaagFeedProps {
  groupId?: string
  laags?: Laag[]
  members?: any[]
}

export function LaagFeed({ groupId, laags, members }: LaagFeedProps) {
  // If groupId is provided, use the LaagFeedComponent with groupId
  // Otherwise, use the provided laags and members
  if (groupId) {
    return <LaagFeedComponent groupId={groupId} />
  }

  return <LaagFeedComponent laags={laags} members={members} />
}

