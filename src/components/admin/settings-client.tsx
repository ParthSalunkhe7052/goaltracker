"use client"

import { useState, useTransition } from "react"
import { lockAllApprovedGoals, syncEntraID, runEscalationEngine } from "@/app/actions/admin-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Lock, Unlock, Settings2, Users, AlertTriangle, ShieldCheck, RefreshCw, Zap, FileSpreadsheet } from "lucide-react"

type User = {
  id: string
  name: string | null
  email: string | null
  role: string
  department: string | null
  _count: { goals: number }
}

export function SettingsClient({ users, approvedCount }: { users: User[]; approvedCount: number }) {
  const [locking, startLock] = useTransition()
  const [syncing, startSync] = useTransition()
  const [escalating, startEscalation] = useTransition()
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const response = await fetch("/api/reports/achievement")
      if (!response.ok) throw new Error("Failed to export report")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "achievement-report.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success("Achievement report downloaded successfully!")
    } catch (err: any) {
      toast.error(err.message || "Failed to download report")
    } finally {
      setDownloading(false)
    }
  }


  function handleLockAll() {
    startLock(async () => {
      try {
        await lockAllApprovedGoals()
        toast.success(`Locked goals across the organization`)
      } catch (e: unknown) {
        toast.error((e as Error).message || "Failed to lock goals")
      }
    })
  }

  function handleSync() {
    startSync(async () => {
      try {
        const res = await syncEntraID()
        toast.success(res.message)
      } catch (e: unknown) {
        toast.error("Entra ID Sync failed")
      }
    })
  }

  function handleEscalation() {
    startEscalation(async () => {
      try {
        const res = await runEscalationEngine()
        toast.success(`Escalation complete: ${res.processed} alerts sent to managers`)
      } catch (e: unknown) {
        toast.error("Escalation failed")
      }
    })
  }

  const roleColors: Record<string, string> = {
    EMPLOYEE: "bg-cyan/10 text-cyan border-cyan/20",
    MANAGER: "bg-primary/10 text-primary border-primary/20",
    ADMIN: "bg-warning/10 text-warning border-warning/20",
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        {/* Cycle Management */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Settings2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Cycle Configuration</CardTitle>
                <CardDescription className="text-xs">Active: Q3 2026</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleSync}
              disabled={syncing}
              variant="outline"
              className="w-full gap-2 text-xs h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync with Entra ID"}
            </Button>
            <Button
              onClick={handleEscalation}
              disabled={escalating}
              variant="outline"
              className="w-full gap-2 text-xs h-9"
            >
              <Zap className="w-3.5 h-3.5 text-warning" />
              {escalating ? "Running..." : "Run Escalation Engine"}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloading}
              variant="outline"
              className="w-full gap-2 text-xs h-9"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 text-emerald ${downloading ? "animate-bounce" : ""}`} />
              {downloading ? "Exporting..." : "Export Achievement Report"}
            </Button>

          </CardContent>
        </Card>

        {/* Governance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald/10 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">System Rules</CardTitle>
                <CardDescription className="text-xs">BRD Compliance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
              <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                <span>Rule</span>
                <span>Status</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Weightage = 100%</span>
                <span className="text-emerald font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Max 8 Goals</span>
                <span className="text-emerald font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Quarter Windows</span>
                <span className="text-emerald font-bold">ACTIVE</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lock Goals */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-warning/10 rounded-xl">
                <Lock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Lock Goal Cycle</CardTitle>
                <CardDescription className="text-xs">Freeze all approved goals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning/90">
                Lock <strong>{approvedCount} approved</strong> goals.
              </p>
            </div>
            <Button
              onClick={handleLockAll}
              disabled={locking || approvedCount === 0}
              variant="outline"
              className="w-full gap-2 border-warning/30 text-warning hover:bg-warning/10 hover:border-warning/50 text-xs h-9"
            >
              <Lock className="w-3.5 h-3.5" />
              {locking ? "Locking..." : `Lock Cycle`}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan/10 rounded-xl">
              <Users className="w-4 h-4 text-cyan" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">User Management</CardTitle>
              <CardDescription className="text-xs">{users.length} users in the organization</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border hover:border-border/60 transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {user.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user.department && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full hidden sm:block">{user.department}</span>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${roleColors[user.role] || ""}`}>
                    {user.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{user._count.goals} goals</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
