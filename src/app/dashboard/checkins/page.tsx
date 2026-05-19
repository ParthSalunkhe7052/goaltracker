import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { CheckInClient } from "@/components/checkins/check-in-client"

export default async function CheckInsPage() {
  const session = await auth()
  if (!session?.user) return null

  const goals = await prisma.goal.findMany({
    where: {
      ownerId: session.user.id,
      status: { in: ["APPROVED", "LOCKED"] }
    },
    include: {
      checkIns: { orderBy: { quarter: "asc" } }
    },
    orderBy: { createdAt: "asc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quarterly Check-ins</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Submit your progress updates for approved goals. Only approved and locked goals require check-ins.
        </p>
      </div>
      <CheckInClient goals={goals} />
    </div>
  )
}
