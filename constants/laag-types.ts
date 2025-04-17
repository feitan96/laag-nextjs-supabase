import { LaagType } from "@/types/laag"

export const LAAG_STATUS_TYPES = [
  { value: "Planning", label: "Planning" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
] as const

export const LAAG_TYPES: { value: LaagType; label: string }[] = [
  { value: "Birthday Celebration", label: "Birthday Celebration" },
  { value: "Summer Vacation", label: "Summer Vacation" },
  { value: "Weekend Getaway", label: "Weekend Getaway" },
  { value: "Road Trip", label: "Road Trip" },
  { value: "Beach Outing", label: "Beach Outing" },
  { value: "Hiking Adventure", label: "Hiking Adventure" },
  { value: "Food Trip", label: "Food Trip" },
  { value: "Game Night", label: "Game Night" },
  { value: "Movie Marathon", label: "Movie Marathon" },
  { value: "Study Session", label: "Study Session" },
  { value: "Sports Activity", label: "Sports Activity" },
  { value: "Concert/Festival", label: "Concert/Festival" },
  { value: "Holiday Celebration", label: "Holiday Celebration" },
  { value: "Reunion", label: "Reunion" },
  { value: "Shopping Trip", label: "Shopping Trip" },
  { value: "Staycation", label: "Staycation" },
  { value: "Other", label: "Other" },
]