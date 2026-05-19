"use client"

import { useState, useTransition } from "react"
import { createGoal, updateGoal, deleteGoal, submitGoals } from "@/app/actions/goal-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Target, Trash2, PlusCircle, Edit2, Lock, CheckCircle2, AlertCircle, Send, RotateCcw } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type Goal = {
  id: string
  title: string
  description: string | null
  thrustArea: string
  uom: string
  target: string | null
  weightage: number
  status: string
  isLocked: boolean
  isShared: boolean
  checkIns: { quarter: string; progress: number; status: string; managerComment: string | null }[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  DRAFT:     { label: "Draft",     className: "bg-muted/50 text-muted-foreground border-border" },
  SUBMITTED: { label: "Submitted", className: "bg-warning/10 text-warning border-warning/20" },
  APPROVED:  { label: "Approved",  className: "bg-emerald/10 text-emerald border-emerald/20" },
  LOCKED:    { label: "Locked",    className: "bg-primary/10 text-primary border-primary/20" },
}

function GoalForm({
  onSubmit, defaultValues, remainingWeight, pending,
}: {
  onSubmit: (fd: FormData) => void
  defaultValues?: Partial<Goal>
  remainingWeight: number
  pending: boolean
}) {
  const isShared = defaultValues?.isShared || false

  return (
    <form action={onSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Goal Title *</Label>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} placeholder="e.g. Launch Q3 Feature Release" className="bg-background border-border" disabled={isShared} />
        {isShared && <p className="text-[10px] text-cyan font-medium">Shared goal title cannot be modified</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
        <Textarea id="description" name="description" defaultValue={defaultValues?.description ?? ""} placeholder="Describe the goal and success criteria..." className="bg-background border-border min-h-[80px] resize-none" disabled={isShared} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="thrustArea" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Thrust Area</Label>
          <Select name="thrustArea" defaultValue={defaultValues?.thrustArea || "OPERATIONAL"} disabled={isShared}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="FINANCIAL">Financial</SelectItem>
              <SelectItem value="OPERATIONAL">Operational</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="PEOPLE">People</SelectItem>
              <SelectItem value="PEOPLE_AND_CULTURE">People & Culture</SelectItem>
              <SelectItem value="TECHNOLOGY">Technology</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="uom" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">UoM</Label>
          <Select name="uom" defaultValue={defaultValues?.uom || "NUMERIC_MIN"} disabled={isShared}>
            <SelectTrigger className="bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="NUMERIC_MIN">Numeric (Min)</SelectItem>
              <SelectItem value="NUMERIC_MAX">Numeric (Max)</SelectItem>
              <SelectItem value="PERCENT_MIN">Percent (Min)</SelectItem>
              <SelectItem value="PERCENT_MAX">Percent (Max)</SelectItem>
              <SelectItem value="TIMELINE">Timeline (Date)</SelectItem>
              <SelectItem value="ZERO_BASED">Zero-based</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="target" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Value</Label>
          <Input id="target" name="target" required defaultValue={defaultValues?.target ?? ""} placeholder="e.g. 100 or 2026-12-31" className="bg-background border-border" disabled={isShared} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weightage" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weightage (%) *</Label>
          <Input id="weightage" name="weightage" type="number" min="10" max={remainingWeight} required defaultValue={defaultValues?.weightage ?? Math.min(10, remainingWeight)} className="bg-background border-border" />
          <p className="text-[10px] text-muted-foreground">{remainingWeight}% available</p>
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending || remainingWeight < 10} className="bg-primary hover:bg-primary/90 text-white">
          {pending ? "Saving..." : defaultValues?.id ? "Update Goal" : "Create Goal"}
        </Button>
      </div>
    </form>
  )
}
export function GoalList({ goals }: { goals: Goal[] }) {
  const [submitting, startSubmit] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editGoal, setEditGoal] = useState<Goal | null>(null)
  const [creating, startCreate] = useTransition()
  const [editing, startEdit] = useTransition()

  const totalWeight = goals.reduce((s, g) => s + g.weightage, 0)
  const remainingWeight = 100 - totalWeight
  const draftGoals = goals.filter(g => g.status === "DRAFT")
  const canSubmit = totalWeight === 100 && draftGoals.length > 0

  const editRemainingWeight = editGoal
    ? 100 - goals.filter(g => g.id !== editGoal.id).reduce((s, g) => s + g.weightage, 0)
    : 0

  async function handleSubmit() {
    startSubmit(async () => {
      try {
        await submitGoals()
        toast.success("Goals submitted for manager approval!")
      } catch (e: unknown) {
        toast.error((e as Error).message || "Error submitting goals")
      }
    })
  }

  function handleCreate(fd: FormData) {
    startCreate(async () => {
      try {
        await createGoal(fd)
        toast.success("Goal created!")
        setCreateOpen(false)
      } catch (e: unknown) {
        toast.error((e as Error).message || "Failed to create goal")
      }
    })
  }

  function handleEdit(fd: FormData) {
    if (!editGoal) return
    startEdit(async () => {
      try {
        await updateGoal(editGoal.id, fd)
        toast.success("Goal updated!")
        setEditGoal(null)
      } catch (e: unknown) {
        toast.error((e as Error).message || "Failed to update goal")
      }
    })
  }

  function handleDelete(id: string) {
    startDelete(async () => {
      try {
        await deleteGoal(id)
        toast.success("Goal deleted")
      } catch (e: unknown) {
        toast.error((e as Error).message || "Failed to delete")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 rounded-2xl bg-card border border-border">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Weightage Allocation</span>
            <span className={`text-sm font-bold ${totalWeight === 100 ? "text-emerald" : totalWeight > 100 ? "text-destructive" : "text-warning"}`}>{totalWeight}%</span>
          </div>
          <Progress value={Math.min(totalWeight, 100)} className="h-2" />
          {totalWeight !== 100 && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-warning" />
              {totalWeight < 100 ? `${100 - totalWeight}% remaining to allocate` : "Over 100% — please adjust"}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {draftGoals.length > 0 && goals.length < 8 && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" className="gap-2 border-border" />}>
              <PlusCircle className="w-4 h-4" /> Add Goal
            </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Goal</DialogTitle>
                </DialogHeader>
                <GoalForm onSubmit={handleCreate} remainingWeight={remainingWeight} pending={creating} />
              </DialogContent>
            </Dialog>
          )}
          <Button
            size="sm"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
            className={canSubmit ? "bg-primary hover:bg-primary/90 text-white gap-2" : "gap-2"}
            variant={canSubmit ? "default" : "secondary"}
          >
            <Send className="w-4 h-4" />
            {submitting ? "Submitting..." : draftGoals.length === 0 ? "Submitted" : "Submit to Manager"}
          </Button>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editGoal} onOpenChange={(o) => !o && setEditGoal(null)}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Goal</DialogTitle>
          </DialogHeader>
          {editGoal && <GoalForm onSubmit={handleEdit} defaultValues={editGoal} remainingWeight={editRemainingWeight} pending={editing} />}
        </DialogContent>
      </Dialog>

      {/* Goal cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {goals.map(goal => {
            const latestCheckIn = goal.checkIns?.[0]
            const sc = statusConfig[goal.status] || statusConfig.DRAFT
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-card border-border hover:border-border/60 hover:shadow-md transition-all h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {goal.isLocked ? (
                          <Lock className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <Target className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <CardTitle className="text-sm font-semibold text-foreground leading-snug">{goal.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {goal.isShared && <Badge variant="outline" className="text-[10px] bg-cyan/10 text-cyan border-cyan/20">Shared</Badge>}
                        <Badge variant="outline" className={`text-[10px] ${sc.className}`}>{sc.label}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="font-semibold text-foreground">{goal.weightage}%</span>
                      {goal.target && <span>· Target: {goal.target}</span>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    {goal.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{goal.description}</p>
                    )}
                    {latestCheckIn && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{latestCheckIn.quarter} Progress</span>
                          <span className="font-semibold text-foreground">{latestCheckIn.progress}%</span>
                        </div>
                        <Progress value={latestCheckIn.progress} className="h-1.5" />
                        {latestCheckIn.managerComment && (
                          <div className="mt-2 p-2 rounded-lg bg-muted/30 border border-border">
                            <p className="text-[10px] text-muted-foreground font-semibold mb-0.5">Manager feedback</p>
                            <p className="text-xs text-muted-foreground">{latestCheckIn.managerComment}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {goal.status === "DRAFT" && !goal.isShared && (
                      <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-border">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground" onClick={() => setEditGoal(goal)}>
                          <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(goal.id)} disabled={deleting}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                        </Button>
                      </div>
                    )}
                    {(goal.status === "APPROVED" || goal.status === "LOCKED") && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald mt-auto pt-2 border-t border-border">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Manager approved
                      </div>
                    )}
                    {goal.status === "SUBMITTED" && (
                      <div className="flex items-center gap-1.5 text-xs text-warning mt-auto pt-2 border-t border-border">
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} /> Awaiting approval
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {goals.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-base font-semibold text-foreground">No goals yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create your first goal to start this quarter&apos;s tracker</p>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button className="mt-5 gap-2 bg-primary hover:bg-primary/90 text-white" />}>
              <PlusCircle className="w-4 h-4" /> Create First Goal
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-card border-border">
              <DialogHeader><DialogTitle>Create New Goal</DialogTitle></DialogHeader>
              <GoalForm onSubmit={handleCreate} remainingWeight={100} pending={creating} />
            </DialogContent>
          </Dialog>
        </motion.div>
      )}
    </div>
  )
}
