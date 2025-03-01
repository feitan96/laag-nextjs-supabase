"use client"

import { useState } from "react"
import { login, signup } from "./action"
import { AuthForm } from "@/components/auth/auth-form"
import { PageHeader } from "@/components/layout/page-header"
import { toast } from "sonner"

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")

  const toggleAuthMode = () => {
    setAuthMode(authMode === "signin" ? "signup" : "signin")
  }

  const handleLogin = async (formData: FormData) => {
    try {
      await login(formData)
      toast.success("Logged in successfully")
    } catch (error) {
      toast.error("Failed to log in")
    }
  }

  const handleSignup = async (formData: FormData) => {
    try {
      await signup(formData)
      toast.success("Signed up successfully")
    } catch (error) {
      toast.error("Failed to sign up")
    }
  }

  return (
    <div className="flex flex-col items-center w-full">
      <PageHeader
        title={authMode === "signin" ? "Sign In" : "Sign Up"}
        description={authMode === "signin" ? "Welcome back" : "Create your account"}
      />
      <div className="w-full max-w-md mt-8">
        <AuthForm
          mode={authMode}
          onToggleMode={toggleAuthMode}
          signinAction={handleLogin}
          signupAction={handleSignup}
        />
      </div>
    </div>
  )
}

