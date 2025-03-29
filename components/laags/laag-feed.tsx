"use client"

import { LaagFeed as LaagFeedComponent } from "./laag-feed/index"

export function LaagFeed({ groupId }: { groupId: string }) {
  return <LaagFeedComponent groupId={groupId} />
}

