import { Button } from "@/components/ui/button"
import { UsersRound, Plus } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <UsersRound className="h-10 w-10 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No groups found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        You haven&apos;t created any groups yet. Groups help you organize your team members.
      </p>
      <Button className="mt-6">
        <Plus className="mr-2 h-4 w-4" />
        Create your first group
      </Button>
    </div>
  )
}

