import { Card } from "@/components/ui/card"
import { ProfileCard } from "@/components/app/profile-card"
import type { ReactNode } from "react"

interface FeedEmptyProps {
  rightSidebar: ReactNode
}

export function FeedEmpty({ rightSidebar }: FeedEmptyProps) {
  return (
    <div className="h-screen overflow-hidden">
      <div className="container px-0 md:px-4 py-6 h-full">
        <div className="grid grid-cols-1 md:grid-cols-[300px_608px_300px] gap-6 h-full max-w-[1400px] mx-auto">
          {/* Left Profile */}
          <div className="h-full hidden md:block">
            <div className="sticky top-6">
              <ProfileCard />
            </div>
          </div>

          {/* Center Empty State */}
          <div className="w-[608px]">
            <Card className="flex h-[200px] items-center justify-center border-dashed bg-muted/20">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">No public laags yet</p>
                <p className="text-xs text-muted-foreground">Be the first to create one!</p>
              </div>
            </Card>
          </div>

          {/* Right Groups */}
          <div className="h-full hidden md:block">
            <div className="sticky top-6">{rightSidebar}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
