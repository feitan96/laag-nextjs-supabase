"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Upload, Loader2, Edit2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LAAG_STATUS_TYPES} from "@/constants/laag-types" 
import { LAAG_TYPES } from "@/constants/laag-types"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { User } from "lucide-react"
import { useAvatar } from "@/hooks/useAvatar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const formSchema = z.object({
  what: z.string().min(1, "What is required").max(50, "Title cannot exceed 50 characters"),
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

interface EditLaagDialogProps {
  laag: {
    id: string
    what: string
    where: string
    why: string
    estimated_cost: number
    actual_cost: number | null
    status: string
    when_start: string
    when_end: string
    fun_meter: number
    organizer: {
      id: string
      full_name: string
      avatar_url: string | null
    }
    laagAttendees: {
      id: string
      attendee_id: string
      is_removed: boolean
    }[]
    laagImages: {
      id: string
      laag_id: string
      image: string
      created_at: string
      is_deleted: boolean
    }[]
    privacy: string
  }
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
  onLaagUpdated: () => void
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

export function EditLaagDialog({ laag, members, onLaagUpdated }: EditLaagDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState((laag.laagImages || []).filter(img => !img.is_deleted))
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [statusCommandOpen, setStatusCommandOpen] = useState(false)
  const [typeCommandOpen, setTypeCommandOpen] = useState(false)
  const [typeSearchQuery, setTypeSearchQuery] = useState("")
  const [privacyCommandOpen, setPrivacyCommandOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const checkOrganizer = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsOrganizer(user?.id === laag.organizer.id)
    }
    checkOrganizer()
  }, [laag.organizer.id, supabase])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      what: laag.what,
      where: laag.where,
      why: laag.why || "",
      type: laag.type,
      estimated_cost: laag.estimated_cost.toString(),
      actual_cost: laag.actual_cost?.toString() || "",
      status: laag.status,
      when_start: new Date(laag.when_start),
      when_end: new Date(laag.when_end),
      fun_meter: laag.fun_meter?.toString() || "",
      images: [],
      attendees: laag.laagAttendees
      .filter(attendee => !attendee.is_removed)
      .map(attendee => attendee.attendee_id),
      privacy: laag.privacy,
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setUploadedImages(prev => [...prev, ...files])
      
      // Create previews
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = async (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      // Mark existing image as deleted
      const imageToDelete = existingImages[index]
      const { error } = await supabase
        .from("laagImages")
        .update({ is_deleted: true })
        .eq("id", imageToDelete.id)

      if (error) {
        toast.error("Failed to remove image")
        return
      }

      setExistingImages(prev => prev.filter((_, i) => i !== index))
    } else {
      setUploadedImages(prev => prev.filter((_, i) => i !== index))
      setImagePreviews(prev => prev.filter((_, i) => i !== index))
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!isOrganizer) {
      toast.error("Only the organizer can edit this laag")
      return
    }

    setLoading(true)

    try {
      // Update the laag
      const { error: laagError } = await supabase
        .from("laags")
        .update({
          what: values.what,
          where: values.where,
          why: values.why,
          estimated_cost: parseFloat(values.estimated_cost),
          actual_cost: values.actual_cost ? parseFloat(values.actual_cost) : null,
          status: values.status,
          type: values.type,
          when_start: values.when_start.toISOString(),
          when_end: values.when_end.toISOString(),
          fun_meter: values.fun_meter ? parseFloat(values.fun_meter) : null,
          updated_at: new Date().toISOString(),
          privacy: values.privacy,
        })
        .eq("id", laag.id)

      if (laagError) throw laagError

      // Get current attendees
      const currentAttendees = laag.laagAttendees.filter(a => !a.is_removed)
      const newAttendees = values.attendees

      // Find attendees to remove
      const attendeesToRemove = currentAttendees.filter(
        attendee => !newAttendees.includes(attendee.attendee_id)
      )

      // Find attendees to add
      const attendeesToAdd = newAttendees.filter(
        attendeeId => !currentAttendees.some(a => a.attendee_id === attendeeId)
      )

      // Update removed attendees
      if (attendeesToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from("laagAttendees")
          .update({ is_removed: true })
          .in(
            "id",
            attendeesToRemove.map(a => a.id)
          )

        if (removeError) throw removeError
      }

      // Add new attendees
      if (attendeesToAdd.length > 0) {
        const { error: addError } = await supabase
          .from("laagAttendees")
          .insert(
            attendeesToAdd.map(attendeeId => ({
              laag_id: laag.id,
              attendee_id: attendeeId,
              is_removed: false
            }))
          )

        if (addError) throw addError
      }

      // Upload new images if any
      if (uploadedImages.length > 0) {
        for (const image of uploadedImages) {
          const fileExt = image.name.split(".").pop()
          const filePath = `${laag.id}/${crypto.randomUUID()}.${fileExt}`

          // Upload to storage bucket
          const { error: uploadError } = await supabase.storage
            .from("laags")
            .upload(filePath, image)

          if (uploadError) throw uploadError

          // Store in laagImages table
          const { error: imageError } = await supabase
            .from("laagImages")
            .insert({
              laag_id: laag.id,
              image: filePath
            })

          if (imageError) throw imageError
        }
      }

      toast.success("Laag updated successfully")
      setOpen(false)
      onLaagUpdated()
    } catch (error) {
      console.error("Error updating laag:", error)
      toast.error("Failed to update laag")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Laag</DialogTitle>
          <DialogDescription>Make changes to your laag here.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
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
                        <Input placeholder="Unsa ni nga laag?" maxLength={50} {...field} />
                        <div className="text-xs text-muted-foreground text-right">
                          {field.value?.length || 0}/50 characters
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
              </div>

              {/* Replace the separate status and type fields with this grid layout */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Popover open={statusCommandOpen} onOpenChange={setStatusCommandOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={statusCommandOpen}
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                              disabled={field.value === "Completed" || field.value === "Cancelled"}
                            >
                              {field.value}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                {LAAG_STATUS_TYPES
                                  .filter(status => {
                                    // If current status is Planning, only show Completed and Cancelled
                                    if (field.value === "Planning") {
                                      return status.value === "Completed" || status.value === "Cancelled"
                                    }
                                    // If current status is Completed or Cancelled, don't show any options
                                    return false
                                  })
                                  .map((status) => (
                                    <CommandItem
                                      key={status.value}
                                      value={status.value}
                                      onSelect={() => {
                                        field.onChange(status.value)
                                        setStatusCommandOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === status.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {status.label}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                      <Popover open={typeCommandOpen} onOpenChange={setTypeCommandOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={typeCommandOpen}
                              className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                            >
                              {field.value || "Select type"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search type..." 
                              value={typeSearchQuery}
                              onValueChange={setTypeSearchQuery}
                            />
                            <CommandList>
                              <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                  {LAAG_TYPES
                                    .filter((type) =>
                                      type.label.toLowerCase().includes(typeSearchQuery.toLowerCase())
                                    )
                                    .map((type) => (
                                      <CommandItem
                                        key={type.value}
                                        value={type.label}
                                        onSelect={() => {
                                          field.onChange(type.value)
                                          setTypeCommandOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            field.value === type.value ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {type.label}
                                      </CommandItem>
                                    ))}
                                </ScrollArea>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
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
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Images</FormLabel>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {existingImages.map((image, index) => (
                    <div key={image.id} className="relative aspect-square">
                      <Image
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/laags/${image.image}`}
                        alt={`Existing image ${index + 1}`}
                        fill
                        className="rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => removeImage(index, true)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  {imagePreviews.map((preview, index) => (
                    <div key={`preview-${index}`} className="relative aspect-square">
                      <Image
                        src={preview}
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
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              {/* attendee field */}
              <FormField
  control={form.control}
  name="attendees"
  render={({ field }) => {
    // Get all active group members (not removed)
    const activeMembers = members.filter(member => !member.is_removed);
    
    return (
      <FormItem>
        <FormLabel>Attendees</FormLabel>
        <FormDescription>Kinsay manguban ani nga laag?</FormDescription>
        <div className="mt-2">
          <Popover open={commandOpen} onOpenChange={setCommandOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={commandOpen}
                className="w-full justify-between"
              >
                <div className="flex gap-2 items-center">
                  <User className="h-4 w-4 shrink-0 opacity-50" />
                  <span>
                    {field.value?.length} member{field.value?.length === 1 ? "" : "s"} selected
                  </span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
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
                      {activeMembers
                        .filter(member =>
                          member.profile.full_name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((member) => (
                          <CommandItem
                            key={member.profile.id}
                            value={member.profile.full_name}
                            onSelect={() => {
                              const currentValue = field.value || [];
                              const newValue = currentValue.includes(member.profile.id)
                                ? currentValue.filter((id) => id !== member.profile.id)
                                : [...currentValue, member.profile.id];
                              field.onChange(newValue);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <MemberAvatar
                                avatarUrl={member.profile.avatar_url || null}
                                fullName={member.profile.full_name}
                              />
                              <span>{member.profile.full_name}</span>
                              <Check
                                className={cn(
                                  "ml-auto h-4 w-4",
                                  field.value?.includes(member.profile.id)
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                            </div>
                          </CommandItem>
                        ))}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <FormMessage />
      </FormItem>
    );
  }}
/>

              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy</FormLabel>
                    <Popover open={privacyCommandOpen} onOpenChange={setPrivacyCommandOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={privacyCommandOpen}
                            className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                          >
                            {field.value === "public" ? "Public" : "Group Only"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandList>
                            <CommandGroup>
                              <CommandItem
                                value="group-only"
                                onSelect={() => {
                                  field.onChange("group-only")
                                  setPrivacyCommandOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === "group-only" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Group Only
                              </CommandItem>
                              <CommandItem
                                value="public"
                                onSelect={() => {
                                  field.onChange("public")
                                  setPrivacyCommandOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === "public" ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                Public
                              </CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Laag
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}