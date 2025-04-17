"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { v4 as uuidv4 } from "uuid"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { LAAG_TYPES } from "@/constants/laag-types"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, ChevronsUpDown, User } from "lucide-react"
import { useAvatar } from "@/hooks/useAvatar"

const formSchema = z.object({
  what: z.string().min(1, "What is required").max(25, "Title cannot exceed 25 characters"),
  where: z.string().min(1, "Where is required").max(50, "Location cannot exceed 50 characters"),
  why: z.string().max(250, "Description cannot exceed 250 characters").optional(),
  type: z.string().min(1, "Type is required"),
  estimated_cost: z.string().min(1, "Estimated cost is required"),
  actual_cost: z.string().optional(),
  status: z.enum(["Planning", "Completed", "Cancelled"]),
  when_start: z.date(),
  when_end: z.date(),
  fun_meter: z.string().optional(),
  images: z.array(z.any()).optional(),
  attendees: z.array(z.string()).min(1, "At least one attendee is required"),
  privacy: z.string().min(1, "Privacy is required"),
})

type FormValues = z.infer<typeof formSchema>

interface CreateLaagDialogProps {
  groupId: string
  onLaagCreated: () => void
  members: {
    id: string
    group_member: string
    is_removed: boolean
    profile: {
      id: string
      full_name: string
      avatar_url?: string | null
    }
  }[]
  status: "Planning" | "Completed"
  open: boolean
  onOpenChange: (open: boolean) => void
}

function MemberAvatar({ avatarUrl, fullName }: { avatarUrl: string | null, fullName: string }) {
  const memberAvatarUrl = useAvatar(avatarUrl)
  return (
    <Avatar className="h-8 w-8">
      <AvatarImage src={memberAvatarUrl || undefined} />
      <AvatarFallback>{fullName.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}

export function CreateLaagDialog({
  groupId,
  onLaagCreated,
  members,
  status,
  open,
  onOpenChange,
}: CreateLaagDialogProps) {
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      what: "",
      where: "",
      why: "",
      type: "",
      estimated_cost: "",
      actual_cost: "",
      status: status,
      fun_meter: "",
      images: [],
      attendees: members.map((member) => member.profile.id),
      privacy: "group-only",
    },
  })

  const isPlanning = status === "Planning"

  const MAX_IMAGES = 9

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const remainingSlots = MAX_IMAGES - uploadedImages.length

      if (files.length + uploadedImages.length > MAX_IMAGES) {
        toast.error(`You can only upload up to ${MAX_IMAGES} images`)
        return
      }

      setUploadedImages((prev) => [...prev, ...files])

      // Create previews
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // In the onSubmit function, modify the attendees section to include the organizer
  const onSubmit = async (values: FormValues) => {
    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No authenticated user")

      const laagId = uuidv4()

      // Create the laag first
      const { error: laagError } = await supabase.from("laags").insert({
        id: laagId,
        what: values.what,
        where: values.where,
        why: values.why,
        type: values.type,
        estimated_cost: Number.parseFloat(values.estimated_cost),
        actual_cost: values.actual_cost ? Number.parseFloat(values.actual_cost) : null,
        status: values.status,
        when_start: values.when_start.toISOString(),
        when_end: values.when_end.toISOString(),
        fun_meter: values.fun_meter ? Number.parseFloat(values.fun_meter) : null,
        organizer: user.id,
        group_id: groupId,
        privacy: values.privacy,
      })

      if (laagError) throw laagError

      // Include organizer in attendees if not already included
      const allAttendees = new Set([...values.attendees, user.id])

      // Create laag attendees
      const { error: attendeesError } = await supabase.from("laagAttendees").insert(
        Array.from(allAttendees).map((attendeeId) => ({
          laag_id: laagId,
          attendee_id: attendeeId,
          is_removed: false,
        })),
      )

      if (attendeesError) throw attendeesError

      // Then upload and insert images if any
      if (uploadedImages.length > 0) {
        for (const image of uploadedImages) {
          const fileExt = image.name.split(".").pop()
          const filePath = `${laagId}/${uuidv4()}.${fileExt}`

          // Upload to storage bucket
          const { error: uploadError } = await supabase.storage.from("laags").upload(filePath, image)

          if (uploadError) throw uploadError

          // Store in laagImages table
          const { error: imageError } = await supabase.from("laagImages").insert({
            laag_id: laagId,
            image: filePath,
          })

          if (imageError) throw imageError
        }
      }

      // After successful laag creation, create notification
      const { error: notificationError } = await supabase.from("laagNotifications").insert({
        laag_id: laagId,
        laag_status: values.status,
        group_id: groupId,
      })

      if (notificationError) throw notificationError

      // Get the created notification
      const { data: notification } = await supabase
        .from("laagNotifications")
        .select("id")
        .eq("laag_id", laagId)
        .single()

      // Create notification reads for all attendees including organizer
      const notificationReads = Array.from(allAttendees).map((attendeeId) => ({
        notification_id: notification.id,
        user_id: attendeeId,
        is_read: attendeeId === user.id, // Mark as read for organizer
      }))

      const { error: readsError } = await supabase.from("laagNotificationReads").insert(notificationReads)

      if (readsError) throw readsError

      toast.success("Laag created successfully")
      form.reset()
      setUploadedImages([])
      setImagePreviews([])
      onOpenChange(false)
      onLaagCreated()
    } catch (error) {
      console.error("Error creating laag:", error)
      toast.error("Failed to create laag")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Laag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Laag</DialogTitle>
          <DialogDescription>Plan your next adventure with your group.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="what"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <div className="space-y-1">
                        <Input placeholder="Unsa ni nga laag?" maxLength={25} {...field} />
                        <div className="text-xs text-muted-foreground text-right">
                          {field.value?.length || 0}/25 characters
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="where"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="space-y-1">
                        <Input placeholder="Asa naman pud ni?" maxLength={50} {...field} />
                        <div className="text-xs text-muted-foreground text-right">
                          {field.value?.length || 0}/50 characters
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="why"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <div className="space-y-1">
                      <Textarea
                        placeholder="Chika pa daw about ani nga laag!"
                        maxLength={250}
                        className="resize-none whitespace-pre-wrap w-full"
                        rows={4}
                        {...field}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {field.value?.length || 0}/250 characters
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimated_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!isPlanning && (
                <FormField
                  control={form.control}
                  name="actual_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Cost</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Input {...field} value={status} disabled={true} className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select type</option>
                        {LAAG_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="when_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            // Automatically set end date to the same date as start date
                            if (date) {
                              form.setValue("when_end", date)
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="when_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            disabled={!form.getValues("when_start")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const startDate = form.getValues("when_start")
                            return startDate ? date < startDate : true
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isPlanning && (
              <div className="space-y-2">
                <FormLabel>Images</FormLabel>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image
                        src={preview || "/placeholder.svg"}
                        alt={`Preview ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>
            )}

<FormField
              control={form.control}
              name="attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attendees</FormLabel>
                  <FormDescription>Select members to join this laag.</FormDescription>
                  <div className="mt-2">
                    <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={commandOpen}
                          className="w-full justify-between"
                        >
                          {field.value.length > 0
                            ? `${field.value.length} member${field.value.length > 1 ? "s" : ""} selected`
                            : "Select members"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                      
                                <Command>
                                  <CommandInput 
                                    placeholder="Search members..." 
                                    value={searchQuery}
                                    onValueChange={setSearchQuery}
                                  />
                                  <CommandList>
                                    <CommandEmpty>No members found.</CommandEmpty>
                                    <CommandGroup>
                                      <ScrollArea className="h-[200px]">
                                        {members
                                          .filter((member, index, self) => 
                                            index === self.findIndex((m) => m.profile.id === member.profile.id)
                                          )
                                          .filter((member) => 
                                            member.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
                                          )
                                          .map((member) => {
                                            const isSelected = field.value?.includes(member.profile.id)
                                            return (
                                              <CommandItem
                                                key={member.profile.id}
                                                value={member.profile.full_name} // Changed to use full_name for searching
                                                onSelect={() => {
                                                  const currentValue = field.value || []
                                                  const updatedValue = isSelected
                                                    ? currentValue.filter((id) => id !== member.profile.id)
                                                    : [...currentValue, member.profile.id]
                                                  field.onChange(updatedValue)
                                                }}
                                              >
                                        <div className="flex items-center space-x-2">
                                          <Checkbox
                                            checked={isSelected}
                                            className={cn("mr-2", isSelected ? "opacity-100" : "opacity-40")}
                                          />
                                          <MemberAvatar
                                            avatarUrl={member.profile.avatar_url || null}
                                            fullName={member.profile.full_name}
                                          />
                                          <span>{member.profile.full_name}</span>
                                          {isSelected && <Check className="ml-auto h-4 w-4" />}
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                              </ScrollArea>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isPlanning && (
              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="group-only">Group Only</option>
                        <option value="public">Public</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Laag
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
