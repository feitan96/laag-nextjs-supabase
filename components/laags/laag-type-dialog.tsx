import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface LaagTypeDialogProps {
  onSelect: (type: "planning" | "completed") => void
}

export function LaagTypeDialog({ onSelect }: LaagTypeDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Laag
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90%] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Create New Laag</DialogTitle>
          <DialogDescription className="text-sm">
            Choose whether you want to plan a new laag or post an already completed one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <Button
            variant="outline"
            className="h-auto py-4 px-3"
            onClick={() => {
              onSelect("planning")
              setOpen(false)
            }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Plan a New Laag</span>
              <span className="text-xs text-muted-foreground text-center">
                Create a laag that you&apos;re planning to do
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 px-3"
            onClick={() => {
              onSelect("completed")
              setOpen(false)
            }}
          >
            <div className="flex flex-col items-center gap-1.5">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Post Completed Laag</span>
              <span className="text-xs text-muted-foreground text-center">
                Share a laag that you&apos;ve already completed
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}