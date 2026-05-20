"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginWithEmail(email: string) {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  try {
    await signIn("credentials", {
      email,
      redirectTo: `${baseUrl}/dashboard`,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials."
        default:
          return "Something went wrong."
      }
    }
    throw error
  }
}
