import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AnalyticsCharts } from "@/components/admin/analytics-charts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, CheckCircle2, BarChart3, TrendingUp } from "lucide-react"

function StatCard({ title, value, sub, icon: Icon, accent = "primary" }: {
  title: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: "primary" | "cyan" | "emerald" | "warning"
}) {
  const colors = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    cyan: { bg: "bg-cyan/10", text: "text-cyan" },
    emerald: { bg: "bg-emerald/10", text: "text-emerald" },
    warning: { bg: "bg-warning/10", text: "text-warning" },
  }
  const c = colors[accent]
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${c.bg}`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8 text-center text-destructive font-medium">Unauthorized Access</div>
  }

  const [totalUsers, totalGoals, totalCheckIns, goalsByStatus, checkIns, teamUsers] = await Promise.all([
    prisma.user.count(),
    prisma.goal.count(),
    prisma.checkIn.count(),
    prisma.goal.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.checkIn.findMany({ select: { quarter: true, progress: true } }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      include: { goals: { select: { status: true } } }
    })
  ])

  const statusCounts = goalsByStatus.reduce((a: Record<string, number>, c) => {
    a[c.status] = c._count.status; return a
  }, {})

  const quarterlyAvg = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } as Record<string, number>
  const quarterlyCounts = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 } as Record<string, number>
  checkIns.forEach(c => {
    quarterlyAvg[c.quarter] = (quarterlyAvg[c.quarter] || 0) + c.progress
    quarterlyCounts[c.quarter] = (quarterlyCounts[c.quarter] || 0) + 1
  })
  Object.keys(quarterlyAvg).forEach(q => {
    if (quarterlyCounts[q] > 0) quarterlyAvg[q] = Math.round(quarterlyAvg[q] / quarterlyCounts[q])
  })

  const teamData = teamUsers.map(u => ({
    name: u.name?.split(" ")[0] || "?",
    approved: u.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED").length,
    submitted: u.goals.filter(g => g.status === "SUBMITTED").length,
    draft: u.goals.filter(g => g.status === "DRAFT").length,
  }))

  const completionRate = totalGoals > 0
    ? Math.round(((statusCounts.APPROVED || 0) + (statusCounts.LOCKED || 0)) / totalGoals * 100)
    : 0

  const stats = { statusCounts, quarterlyAvg, teamData }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Organization Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">Macro view of goal completion and organizational health · Q3 2026</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Employees" value={totalUsers} sub="Across all roles" icon={Users} accent="primary" />
        <StatCard title="Total Goals" value={totalGoals} sub={`${statusCounts.SUBMITTED || 0} pending review`} icon={Target} accent="cyan" />
        <StatCard title="Check-ins" value={totalCheckIns} sub="Quarterly updates submitted" icon={BarChart3} accent="emerald" />
        <StatCard title="Completion Rate" value={`${completionRate}%`} sub="Approved + Locked goals" icon={CheckCircle2} accent="warning" />
      </div>

      <AnalyticsCharts stats={stats} />
    </div>
  )
}