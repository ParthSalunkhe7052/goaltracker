import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NotificationsClient } from "@/components/notifications/notifications-client"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) return null

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Stay up to date on goal approvals, rejections, and deadlines.
        </p>
      </div>
      <NotificationsClient notifications={notifications} />
    </div>
  )
}
