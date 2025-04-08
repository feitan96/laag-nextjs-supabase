"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { CardHeader } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAvatar } from "@/hooks/useAvatar"
import type { Laag } from "@/types"
import { format } from "date-fns"
import { Clock, MoreHorizontal, Trash2 } from "lucide-react"
import Link from "next/link"
import { EditLaagDialog } from "../edit-laag-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface LaagCardHeaderProps {
  laag: Laag
  isOrganizer: boolean
  onDelete: () => Promise<void>
}

export function LaagCardHeader({ laag, isOrganizer, onDelete }: LaagCardHeaderProps) {
  const organizerAvatarUrl = useAvatar(laag.organizer.avatar_url)

  const getLaagViewLink = () => {
    if (laag.privacy === "public") {
      return `/user/laags/${laag.id}`
    }
    return `/user/groups/${laag.group_id}/laags/${laag.id}?from=group`
  }

  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={organizerAvatarUrl || undefined} />
          <AvatarFallback>{laag.organizer.full_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{laag.organizer.full_name}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(laag.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href={getLaagViewLink()}>
          <Button variant="outline" size="sm">
            View
          </Button>
        </Link>
        {isOrganizer && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <EditLaagDialog laag={laag} members={[]} onLaagUpdated={() => window.location.reload()} />
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Laag</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this laag? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </CardHeader>
  )
}
