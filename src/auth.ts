import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@demo.com" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        if (user) {
          return { id: user.id, name: user.name, email: user.email, role: user.role }
        }

        return null
      }
    })
  ],
})