import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { GoalList } from "@/components/goals/goal-list"

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user) return null

  const goals = await prisma.goal.findMany({
    where: { ownerId: session.user.id },
    include: {
      checkIns: {
        orderBy: { quarter: "desc" }
      }
    },
    orderBy: { createdAt: "asc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Goals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your quarterly goals, targets, and progress. Max 8 goals · Total weightage must equal 100%.
        </p>
      </div>
      <GoalList goals={goals} />
    </div>
  )
}