import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

const actionColors: Record<string, string> = {
  SUBMIT_GOALS: "bg-primary/10 text-primary border-primary/20",
  APPROVE_GOAL: "bg-emerald/10 text-emerald border-emerald/20",
  BATCH_APPROVE: "bg-emerald/10 text-emerald border-emerald/20",
  REJECT_GOAL: "bg-destructive/10 text-destructive border-destructive/20",
  LOCK_GOAL: "bg-cyan/10 text-cyan border-cyan/20",
  LOCK_ALL_GOALS: "bg-cyan/10 text-cyan border-cyan/20",
  UNLOCK_GOAL: "bg-warning/10 text-warning border-warning/20",
  CHECKIN_UPDATE: "bg-muted/50 text-muted-foreground border-border",
  MANAGER_COMMENT: "bg-muted/50 text-muted-foreground border-border",
  PUSH_SHARED_GOAL: "bg-primary/10 text-primary border-primary/20",
}

export default async function AuditLogsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return <div className="p-8 text-center text-destructive font-medium">Unauthorized Access</div>
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true, role: true } }
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Complete activity trail across the organization · Last {logs.length} events
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-2">User</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-5">Details</div>
            <div className="col-span-2">Entity</div>
            <div className="col-span-1 text-right">Time</div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {logs.map(log => (
            <div key={log.id} className="p-4 hover:bg-muted/10 transition-colors">
              <div className="grid grid-cols-12 items-center gap-2">
                {/* User */}
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {log.user.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{log.user.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{log.user.role.toLowerCase()}</p>
                  </div>
                </div>

                {/* Action */}
                <div className="col-span-2">
                  <Badge variant="outline" className={`text-[10px] ${actionColors[log.action] || "bg-muted text-muted-foreground"}`}>
                    {log.action.replace(/_/g, " ")}
                  </Badge>
                </div>

                {/* Details */}
                <div className="col-span-5">
                  <p className="text-xs text-muted-foreground truncate">{log.details || "—"}</p>
                </div>

                {/* Entity */}
                <div className="col-span-2">
                  <span className="text-xs text-muted-foreground/70">{log.entity}</span>
                </div>

                {/* Time */}
                <div className="col-span-1 text-right">
                  <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {logs.length === 0 && (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No audit events recorded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
