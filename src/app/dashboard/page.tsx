import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Target, TrendingUp, CheckCircle2, Users, Clock, AlertCircle, BarChart3, FileText, Zap } from "lucide-react"
import Link from "next/link"
import { getActiveQuarterWindow } from "@/lib/utils"
import { CircularProgress } from "@/components/ui/circular-progress"


function StatCard({ title, value, sub, icon: Icon, accent = "primary" }: {
  title: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: "primary" | "cyan" | "emerald" | "warning"
}) {
  const colors = {
    primary: { bg: "bg-primary/10", text: "text-primary", glow: "glow-primary" },
    cyan: { bg: "bg-cyan/10", text: "text-cyan", glow: "glow-cyan" },
    emerald: { bg: "bg-emerald/10", text: "text-emerald", glow: "glow-emerald" },
    warning: { bg: "bg-warning/10", text: "text-warning", glow: "" },
  }
  const c = colors[accent]
  return (
    <Card className="bg-card border-border hover:border-border/80 transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${c.bg} ${c.glow}`}>
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

const statusColors: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  SUBMITTED: "bg-warning/10 text-warning border-warning/20",
  APPROVED: "bg-emerald/10 text-emerald border-emerald/20",
  LOCKED: "bg-primary/10 text-primary border-primary/20",
}

export default async function DashboardPage() {
  const session = await auth()
  const role = session?.user?.role

  const activeQuarter = getActiveQuarterWindow()
  const activeLabel = activeQuarter === "GOAL_SETTING" ? "Goal Setting Phase" : activeQuarter ? `${activeQuarter} Check-in` : "Q3 2026 (Demo)"


  // ── EMPLOYEE ──
  if (role === "EMPLOYEE") {
    const [goals, unread] = await Promise.all([
      prisma.goal.findMany({
        where: { ownerId: session!.user!.id },
        include: { checkIns: { orderBy: { quarter: "desc" }, take: 1 } },
        orderBy: { createdAt: "desc" }
      }),
      prisma.notification.count({ where: { userId: session!.user!.id, read: false } })
    ])

    const totalWeight = goals.reduce((a, g) => a + g.weightage, 0)
    const approvedGoals = goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED")
    const avgProgress = goals.length
      ? Math.round(goals.reduce((a, g) => a + (g.checkIns[0]?.progress ?? 0), 0) / goals.length)
      : 0

    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
              <span className="gradient-text">{session?.user?.name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">{activeLabel} is active. Here&apos;s your goal overview.</p>

          </div>
          {unread > 0 && (
            <Link href="/dashboard/notifications" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-semibold hover:bg-primary/20 transition-colors">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              {unread} new notification{unread !== 1 ? "s" : ""}
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Goals" value={`${goals.length}/8`} sub="Max 8 per cycle" icon={Target} accent="primary" />
          <StatCard title="Weightage" value={`${totalWeight}%`} sub={totalWeight === 100 ? "Ready to submit ✓" : `${100 - totalWeight}% remaining`} icon={TrendingUp} accent="cyan" />
          <StatCard title="Approved" value={approvedGoals.length} sub={`${goals.filter(g => g.status === "SUBMITTED").length} pending review`} icon={CheckCircle2} accent="emerald" />
          <StatCard title="Avg Progress" value={`${avgProgress}%`} sub="Across all goals" icon={BarChart3} accent="warning" />
        </div>

        {/* Weightage bar */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Goal Weightage Allocation</CardTitle>
              <span className={`text-sm font-bold ${totalWeight === 100 ? "text-emerald" : "text-warning"}`}>{totalWeight}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={Math.min(totalWeight, 100)} className="h-2" />
            {totalWeight !== 100 && (
              <p className="text-xs text-warning mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Total must equal 100% before you can submit to your manager
              </p>
            )}
          </CardContent>
        </Card>

        {/* Goals list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Goals</h2>
            <Link href="/dashboard/goals" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {goals.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No goals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Head to My Goals to create your first goal</p>
              <Link href="/dashboard/goals" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
                <Target className="w-4 h-4" /> Create Goal
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.slice(0, 5).map(goal => {
                const latestCheckIn = goal.checkIns[0]
                return (
                  <div key={goal.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-border/60 transition-all group">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-foreground truncate">{goal.title}</p>
                        <Badge variant="outline" className={`text-[10px] ${statusColors[goal.status]}`}>{goal.status}</Badge>
                        {goal.isLocked && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">🔒 Locked</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">{goal.weightage}% weight</span>
                        {latestCheckIn && (
                          <div className="flex items-center gap-2 shrink-0 ml-auto">
                            <CircularProgress value={latestCheckIn.progress} size={30} strokeWidth={3.2} />
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── MANAGER ──
  if (role === "MANAGER") {
    const [team, pendingGoals] = await Promise.all([
      prisma.user.findMany({
        where: { managerId: session!.user!.id },
        include: { goals: { include: { checkIns: { orderBy: { quarter: "desc" }, take: 1 } } } }
      }),
      prisma.goal.count({ where: { owner: { managerId: session!.user!.id }, status: "SUBMITTED" } })
    ])

    const totalTeamGoals = team.reduce((s, u) => s + u.goals.length, 0)
    const approvedGoals = team.reduce((s, u) => s + u.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED").length, 0)

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Manager Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{activeLabel} · Team of {team.length} reports</p>

        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Direct Reports" value={team.length} sub="Employees under you" icon={Users} accent="primary" />
          <StatCard title="Pending Approvals" value={pendingGoals} sub="Goals awaiting review" icon={Clock} accent="warning" />
          <StatCard title="Team Goals" value={totalTeamGoals} sub="Across all reports" icon={Target} accent="cyan" />
          <StatCard title="Approved Goals" value={approvedGoals} sub="Approved or locked" icon={CheckCircle2} accent="emerald" />
        </div>

        {pendingGoals > 0 && (
          <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-warning">{pendingGoals} goal{pendingGoals !== 1 ? "s" : ""} awaiting your approval</p>
              <p className="text-xs text-muted-foreground mt-0.5">Review and approve your team&apos;s submitted goals</p>
            </div>
            <Link href="/dashboard/approvals" className="px-3 py-1.5 rounded-lg bg-warning text-white text-xs font-semibold hover:bg-warning/90 transition-colors shrink-0">
              Review Now
            </Link>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Team Progress</h2>
            <Link href="/dashboard/team" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {team.map(member => {
              const total = member.goals.length
              const approved = member.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED").length
              const avgProg = total > 0
                ? Math.round(member.goals.reduce((s, g) => s + (g.checkIns[0]?.progress ?? 0), 0) / total)
                : 0
              return (
                <div key={member.id} className="p-4 rounded-xl bg-card border border-border flex items-center gap-4">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {member.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{total} goals · {approved} approved</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-bold text-foreground">{avgProg}%</div>
                      <div className="text-[10px] text-muted-foreground">progress</div>
                    </div>
                    <Progress value={avgProg} className="h-2 w-20" />
                  </div>
                </div>
              )
            })}
            {team.length === 0 && (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No direct reports assigned yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── ADMIN ──
  if (role === "ADMIN") {
    const [totalUsers, totalGoals, totalCheckIns, goalsByStatus, recentLogs] = await Promise.all([
      prisma.user.count(),
      prisma.goal.count(),
      prisma.checkIn.count(),
      prisma.goal.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 5,
        include: { user: { select: { name: true } } }
      })
    ])

    const statusMap = goalsByStatus.reduce((a: Record<string, number>, c) => {
      a[c.status] = c._count.status; return a
    }, {})

    const completionRate = totalGoals > 0
      ? Math.round(((statusMap.APPROVED || 0) + (statusMap.LOCKED || 0)) / totalGoals * 100)
      : 0

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organization-wide analytics · {activeLabel}</p>

        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Users" value={totalUsers} sub="Across all roles" icon={Users} accent="primary" />
          <StatCard title="Active Goals" value={totalGoals} sub={`${statusMap.SUBMITTED || 0} pending review`} icon={Target} accent="cyan" />
          <StatCard title="Check-ins" value={totalCheckIns} sub="Quarterly updates" icon={BarChart3} accent="emerald" />
          <StatCard title="Completion Rate" value={`${completionRate}%`} sub="Approved + Locked" icon={CheckCircle2} accent="warning" />
        </div>

        {/* Status breakdown */}
        <div className="grid gap-4 md:grid-cols-4">
          {["DRAFT", "SUBMITTED", "APPROVED", "LOCKED"].map(status => (
            <div key={status} className="p-4 rounded-xl bg-card border border-border text-center">
              <div className={`text-2xl font-bold ${status === "DRAFT" ? "text-muted-foreground" : status === "SUBMITTED" ? "text-warning" : status === "APPROVED" ? "text-emerald" : "text-primary"}`}>
                {statusMap[status] || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-1 capitalize">{status.toLowerCase()}</div>
            </div>
          ))}
        </div>

        {/* Recent audit logs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" /> Recent Audit Activity
            </h2>
            <Link href="/dashboard/audit-logs" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {log.user.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{log.user.name}</span>
                  <span className="text-muted-foreground"> · {log.action.replace(/_/g, " ")}</span>
                  {log.details && <span className="text-muted-foreground/70 text-xs block truncate">{log.details}</span>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(log.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/dashboard/analytics" className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">View Analytics</div>
              <div className="text-xs text-muted-foreground">Org-wide charts</div>
            </div>
          </Link>
          <Link href="/dashboard/audit-logs" className="p-4 rounded-xl bg-card border border-border hover:border-cyan/30 transition-all group flex items-center gap-3">
            <div className="p-2.5 bg-cyan/10 rounded-xl group-hover:bg-cyan/20 transition-colors">
              <FileText className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">Audit Logs</div>
              <div className="text-xs text-muted-foreground">Full activity trail</div>
            </div>
          </Link>
          <Link href="/dashboard/settings" className="p-4 rounded-xl bg-card border border-border hover:border-emerald/30 transition-all group flex items-center gap-3">
            <div className="p-2.5 bg-emerald/10 rounded-xl group-hover:bg-emerald/20 transition-colors">
              <Zap className="w-5 h-5 text-emerald" />
            </div>
            <div>
              <div className="font-semibold text-sm text-foreground">Cycle Management</div>
              <div className="text-xs text-muted-foreground">Lock / unlock goals</div>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  return null
}
