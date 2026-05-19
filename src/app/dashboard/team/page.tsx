import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, Target, TrendingUp } from "lucide-react"
import Link from "next/link"

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "MANAGER") {
    return <div className="p-8 text-center text-destructive font-medium">Unauthorized Access</div>
  }

  const team = await prisma.user.findMany({
    where: { managerId: session.user.id },
    include: {
      goals: {
        include: {
          checkIns: { orderBy: { quarter: "desc" }, take: 1 }
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">Monitor progress of your {team.length} direct report{team.length !== 1 ? "s" : ""}.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-primary">{team.length} reports</span>
        </div>
      </div>

      <div className="grid gap-4">
        {team.map(member => {
          const totalGoals = member.goals.length
          const approvedGoals = member.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED").length
          const submittedGoals = member.goals.filter(g => g.status === "SUBMITTED").length
          const avgProgress = totalGoals > 0
            ? Math.round(member.goals.reduce((s, g) => s + (g.checkIns[0]?.progress ?? 0), 0) / totalGoals)
            : 0

          const goalDefProgress = totalGoals > 0 ? (approvedGoals / totalGoals) * 100 : 0

          return (
            <Card key={member.id} className="bg-card border-border hover:border-border/60 transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <Avatar className="h-11 w-11 border border-border">
                      <AvatarFallback className="bg-primary/15 text-primary font-bold">
                        {member.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "E"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{member.name}</h3>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                      {member.department && (
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full mt-0.5 inline-block">{member.department}</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 flex-1 w-full">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{totalGoals}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald">{approvedGoals}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{avgProgress}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Progress</div>
                    </div>
                  </div>

                  {/* Progress bars */}
                  <div className="flex-1 w-full space-y-3 min-w-[200px]">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Goal Approval</span>
                        <span className="font-medium text-foreground">{Math.round(goalDefProgress)}%</span>
                      </div>
                      <Progress value={goalDefProgress} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Avg Progress</span>
                        <span className="font-medium text-foreground">{avgProgress}%</span>
                      </div>
                      <Progress value={avgProgress} className="h-1.5" />
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0">
                    {submittedGoals > 0 ? (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        {submittedGoals} pending
                      </Badge>
                    ) : approvedGoals === totalGoals && totalGoals > 0 ? (
                      <Badge variant="outline" className="bg-emerald/10 text-emerald border-emerald/20">
                        On Track
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground">
                        In Progress
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Goals list preview */}
                {member.goals.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-2">
                      {member.goals.map(goal => (
                        <div key={goal.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/30 border border-border text-xs">
                          <Target className="w-3 h-3 text-primary" />
                          <span className="text-foreground font-medium truncate max-w-[120px]">{goal.title}</span>
                          <span className={`ml-1 px-1.5 rounded-full text-[10px] font-semibold ${
                            goal.status === "APPROVED" || goal.status === "LOCKED" ? "bg-emerald/10 text-emerald" :
                            goal.status === "SUBMITTED" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                          }`}>{goal.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {team.length === 0 && (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground">No direct reports</h3>
            <p className="text-sm text-muted-foreground mt-1">Employees assigned to you will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
