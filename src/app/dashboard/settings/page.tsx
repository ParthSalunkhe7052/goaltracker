import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { SettingsClient } from "@/components/admin/settings-client"

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8 text-center text-destructive font-medium">Unauthorized Access</div>
  }

  const [users, approvedCount] = await Promise.all([
    prisma.user.findMany({
      orderBy: { role: "asc" },
      include: { _count: { select: { goals: true } } }
    }),
    prisma.goal.count({ where: { status: "APPROVED" } })
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage organization-wide configurations for the goal-setting cycle.</p>
      </div>
      <SettingsClient
        users={users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, department: u.department, _count: u._count }))}
        approvedCount={approvedCount}
      />
    </div>
  )
}
