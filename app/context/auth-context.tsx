// context/auth-context.tsx
"use client"

import { createClient } from "@/utils/supabase/client"
import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

type Profile = {
  full_name: string | null
  username: string | null
  avatar_url: string | null
  website: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // Fetch user and profile data
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch profile data from the `profiles` table
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("full_name, username, avatar_url, website")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error fetching profile:", error)
        } else {
          setProfile(profileData)
        }
      }

      setIsLoading(false)
    }

    fetchData()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        // Fetch profile data when auth state changes
        supabase
          .from("profiles")
          .select("full_name, username, avatar_url, website")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profileData, error }) => {
            if (error) {
              console.error("Error fetching profile:", error)
            } else {
              setProfile(profileData)
            }
          })
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}