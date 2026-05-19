"use client"

import { useState, useTransition } from "react"
import { approveGoal, rejectGoal, approveAllGoals, updateGoalByManager } from "@/app/actions/manager-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Target, CheckCircle, XCircle, CheckCircle2, Users, Building2, Edit2, Save } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Goal = {
  id: string
  title: string
  description: string | null
  target: string | null
  weightage: number
  owner: { id: string; name: string | null; email: string | null; department: string | null }
}

function EditGoalForm({ goal, onCancel }: { goal: Goal; onCancel: () => void }) {
  const [pending, startTransition] = useTransition()

  function handleSubmit(fd: FormData) {
    startTransition(async () => {
      try {
        await updateGoalByManager(goal.id, fd)
        toast.success("Goal updated")
        onCancel()
      } catch (e: unknown) {
        toast.error((e as Error).message || "Error updating goal")
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-3 p-3 bg-muted/30 rounded-lg mt-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase">Goal Title</Label>
          <Input name="title" defaultValue={goal.title} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase">Weightage (%)</Label>
          <Input name="weightage" type="number" defaultValue={goal.weightage} className="h-8 text-xs" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px] uppercase">Target</Label>
        <Input name="target" defaultValue={goal.target || ""} className="h-8 text-xs" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onCancel} type="button">Cancel</Button>
        <Button size="sm" className="h-7 text-xs gap-1" disabled={pending}>
          <Save className="w-3 h-3" /> {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
}

export function ApprovalList({ goals }: { goals: Goal[] }) {
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [batchProcessing, startBatch] = useTransition()

  // Group by employee
  const byEmployee = goals.reduce<Record<string, { owner: Goal["owner"]; goals: Goal[] }>>((acc, g) => {
    if (!acc[g.owner.id]) acc[g.owner.id] = { owner: g.owner, goals: [] }
    acc[g.owner.id].goals.push(g)
    return acc
  }, {})

  async function handleApprove(id: string) {
    setProcessing(id)
    try {
      await approveGoal(id)
      toast.success("Goal approved ✓")
    } catch (e: unknown) {
      toast.error((e as Error).message || "Error approving goal")
    } finally {
      setProcessing(null)
    }
  }

  async function handleReject(id: string) {
    setProcessing(id)
    try {
      await rejectGoal(id)
      toast.success("Goal returned to draft")
    } catch (e: unknown) {
      toast.error((e as Error).message || "Error rejecting goal")
    } finally {
      setProcessing(null)
    }
  }

  function handleBatchApprove(employeeId: string, name: string | null) {
    startBatch(async () => {
      try {
        await approveAllGoals(employeeId)
        toast.success(`All goals approved for ${name}`)
      } catch (e: unknown) {
        toast.error((e as Error).message || "Error batch approving")
      }
    })
  }

  if (goals.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-dashed border-border rounded-2xl">
        <CheckCircle className="w-12 h-12 text-emerald mx-auto mb-4" />
        <h3 className="text-base font-semibold text-foreground">All caught up!</h3>
        <p className="text-sm text-muted-foreground mt-1">No goals are awaiting your approval.</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="popLayout">
        {Object.values(byEmployee).map(({ owner, goals: empGoals }) => {
          const totalWeight = empGoals.reduce((s, g) => s + g.weightage, 0)
          return (
            <motion.div key={owner.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              {/* Employee header */}
              <div className="flex items-center justify-between mb-3 p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {owner.name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{owner.name}</span>
                      {owner.department && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          <Building2 className="w-2.5 h-2.5" />{owner.department}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{empGoals.length} goal{empGoals.length !== 1 ? "s" : ""}</span>
                      <span className={`font-semibold ${totalWeight === 100 ? "text-emerald" : "text-warning"}`}>
                        {totalWeight}% total weight {totalWeight === 100 ? "✓" : "⚠"}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleBatchApprove(owner.id, owner.name)}
                  disabled={batchProcessing || !!processing}
                  className="gap-2 bg-emerald/10 hover:bg-emerald/20 text-emerald border border-emerald/20 hover:border-emerald/40"
                  variant="outline"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve All
                </Button>
              </div>

              {/* Goals */}
              <div className="space-y-3 pl-4">
                <AnimatePresence mode="popLayout">
                  {empGoals.map(goal => (
                    <motion.div
                      key={goal.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="bg-card/50 border-border hover:border-border/60 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="p-1.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                                <Target className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-foreground">{goal.title}</p>
                                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                  <Badge variant="outline" className="text-[10px] bg-muted/50">{goal.weightage}% weight</Badge>
                                  {goal.target && <span>Target: {goal.target}</span>}
                                </div>
                                {goal.description && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{goal.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-muted-foreground border-border hover:bg-muted/50"
                                onClick={() => setEditingId(editingId === goal.id ? null : goal.id)}
                                disabled={processing === goal.id || batchProcessing}
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => handleReject(goal.id)}
                                disabled={processing === goal.id || batchProcessing}
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 px-3 bg-emerald/10 hover:bg-emerald/20 text-emerald border border-emerald/20"
                                variant="outline"
                                onClick={() => handleApprove(goal.id)}
                                disabled={processing === goal.id || batchProcessing}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                              </Button>
                            </div>
                          </div>

                          {editingId === goal.id && (
                            <EditGoalForm goal={goal} onCancel={() => setEditingId(null)} />
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
