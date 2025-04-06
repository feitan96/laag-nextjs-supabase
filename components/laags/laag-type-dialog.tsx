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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Laag</DialogTitle>
          <DialogDescription>
            Choose whether you want to plan a new laag or post an already completed one.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-24"
            onClick={() => {
              onSelect("planning")
              setOpen(false)
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Plan a New Laag</span>
              <span className="text-sm text-muted-foreground">
                Create a laag that you're planning to do
              </span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-24"
            onClick={() => {
              onSelect("completed")
              setOpen(false)
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Plus className="h-6 w-6" />
              <span>Post Completed Laag</span>
              <span className="text-sm text-muted-foreground">
                Share a laag that you've already completed
              </span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 