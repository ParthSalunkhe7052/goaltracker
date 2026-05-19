import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ApprovalList } from "@/components/manager/approval-list"

export default async function ApprovalsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "MANAGER") {
    return <div className="p-8 text-center text-destructive font-medium">Unauthorized Access</div>
  }

  const managerId = session.user.id

  const pendingGoals = await prisma.goal.findMany({
    where: {
      owner: { managerId },
      status: "SUBMITTED"
    },
    include: {
      owner: { select: { id: true, name: true, email: true, department: true } },
      checkIns: { orderBy: { quarter: "desc" } }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review and approve goal sheets submitted by your direct reports.
          {pendingGoals.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-semibold border border-warning/20">
              {pendingGoals.length} pending
            </span>
          )}
        </p>
      </div>
      <ApprovalList goals={pendingGoals} />
    </div>
  )
}