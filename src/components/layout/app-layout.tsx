import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { prisma } from "@/lib/prisma"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session || !session.user) {
    redirect("/login")
  }

  const unreadCount = session.user.id
    ? await prisma.notification.count({ where: { userId: session.user.id, read: false } })
    : 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={session.user.role || "EMPLOYEE"} unreadCount={unreadCount} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}