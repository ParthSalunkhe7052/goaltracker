"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function loginWithEmail(email: string) {
  try {
    await signIn("credentials", {
      email,
      redirectTo: "/dashboard",
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
