"use client"

import { AuthForm } from "@/components/auth/auth-form"

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-md mt-8">
        <AuthForm />
      </div>
    </div>
  )
}

