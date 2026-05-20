"use client"

import { useState, useTransition } from "react"
import { upsertCheckIn } from "@/app/actions/goal-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Target, ClipboardList, CheckCircle2, MessageSquare, Lock } from "lucide-react"
import { motion } from "framer-motion"
import { Confetti } from "@/components/ui/confetti"


type CheckIn = {
  id: string
  quarter: string
  progress: number
  status: string
  actualAchievement: string | null
  employeeComment: string | null
  managerComment: string | null
}

type Goal = {
  id: string
  title: string
  uom: string
  target: string | null
  weightage: number
  status: string
  isLocked: boolean
  checkIns: CheckIn[]
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const
type Quarter = typeof QUARTERS[number]

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Not Started",
  ON_TRACK: "On Track",
  COMPLETED: "Completed",
}

const statusColors: Record<string, string> = {
  NOT_STARTED: "bg-muted/50 text-muted-foreground border-border",
  ON_TRACK: "bg-primary/10 text-primary border-primary/20",
  COMPLETED: "bg-emerald/10 text-emerald border-emerald/20",
}

function CheckInForm({ goal, quarter, existing }: { goal: Goal; quarter: Quarter; existing?: CheckIn }) {
  const [pending, startTransition] = useTransition()
  const [showConfetti, setShowConfetti] = useState(false)

  function playBeep() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = "sine"
      
      // Happy tone chime
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08) // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16) // G5
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35)
      
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.4)
    } catch (e) {
      console.warn("Could not play notification sound:", e)
    }
  }

  function handleSubmit(fd: FormData) {
    const status = fd.get("status") as string
    startTransition(async () => {
      try {
        await upsertCheckIn(goal.id, quarter, fd)
        toast.success(`${quarter} check-in saved!`)
        playBeep()
        if (status === "COMPLETED") {
          setShowConfetti(true)
          setTimeout(() => setShowConfetti(false), 3000)
        }
      } catch (e: unknown) {
        toast.error((e as Error).message || "Failed to save check-in")
      }
    })
  }


  const uomLabels: Record<string, string> = {
    NUMERIC_MIN: "Number (Higher is Better)",
    NUMERIC_MAX: "Number (Lower is Better)",
    PERCENT_MIN: "Percent (Higher is Better)",
    PERCENT_MAX: "Percent (Lower is Better)",
    TIMELINE: "Date (Deadline)",
    ZERO_BASED: "Zero-based (0 = Success)",
  }

  return (
    <form action={handleSubmit} className="space-y-4 pt-3 border-t border-border mt-3">
      <div className="p-3 rounded-lg bg-muted/20 border border-border/50 mb-2">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Target Setting</p>
        <p className="text-sm font-medium text-foreground">{goal.target} ({uomLabels[goal.uom] || goal.uom})</p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Actual Achievement
        </Label>
        <Input
          name="actualAchievement"
          defaultValue={existing?.actualAchievement ?? ""}
          placeholder={goal.uom === "TIMELINE" ? "YYYY-MM-DD" : "Enter value..."}
          required
          className="bg-background border-border"
        />
        <p className="text-[10px] text-muted-foreground italic">
          Progress score will be auto-calculated based on your target.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
        <Select name="status" defaultValue={existing?.status || "NOT_STARTED"}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="NOT_STARTED">Not Started</SelectItem>
            <SelectItem value="ON_TRACK">On Track</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Update</Label>
        <Textarea
          name="employeeComment"
          defaultValue={existing?.employeeComment ?? ""}
          placeholder="What progress did you make this quarter? Any blockers?"
          className="bg-background border-border min-h-[80px] resize-none text-sm"
        />
      </div>

      {existing?.managerComment && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Manager Feedback
          </div>
          <p className="text-sm text-foreground">{existing.managerComment}</p>
        </div>
      )}

      <Button type="submit" disabled={pending} size="sm" className="gap-2 bg-primary hover:bg-primary/90 text-white">
        <CheckCircle2 className="w-4 h-4" />
        {pending ? "Saving..." : existing ? "Update Check-in" : "Submit Check-in"}
      </Button>

      <Confetti active={showConfetti} />
    </form>
  )
}


export function CheckInClient({ goals }: { goals: Goal[] }) {
  const [activeQuarter, setActiveQuarter] = useState<Quarter>("Q3")
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null)

  if (goals.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 border border-dashed border-border rounded-2xl">
        <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-base font-semibold text-foreground">No check-ins yet</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Once your manager approves your goals, you&apos;ll be able to submit quarterly updates here.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quarter tabs */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl w-fit">
        {QUARTERS.map(q => (
          <button
            key={q}
            onClick={() => setActiveQuarter(q)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeQuarter === q
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Goals */}
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map(goal => {
          const existingCheckIn = goal.checkIns.find(c => c.quarter === activeQuarter)
          const isExpanded = expandedGoal === `${goal.id}-${activeQuarter}`

          return (
            <motion.div key={goal.id} layout>
              <Card className="bg-card border-border hover:border-border/60 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {goal.isLocked ? <Lock className="w-4 h-4 text-primary shrink-0" /> : <Target className="w-4 h-4 text-primary shrink-0" />}
                      <CardTitle className="text-sm font-semibold text-foreground leading-snug">{goal.title}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-muted/50">{goal.weightage}%</Badge>
                  </div>

                  {existingCheckIn ? (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="outline" className={`text-[10px] ${statusColors[existingCheckIn.status]}`}>
                          {statusLabels[existingCheckIn.status]}
                        </Badge>
                        <span className="font-bold text-foreground">{existingCheckIn.progress}%</span>
                      </div>
                      <Progress value={existingCheckIn.progress} className="h-1.5" />
                    </div>
                  ) : (
                    <div className="mt-2">
                      <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground">No {activeQuarter} update yet</Badge>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <button
                    onClick={() => setExpandedGoal(isExpanded ? null : `${goal.id}-${activeQuarter}`)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {isExpanded ? "Hide form ↑" : (existingCheckIn ? "Edit update ↓" : "Submit update ↓")}
                  </button>

                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <CheckInForm goal={goal} quarter={activeQuarter} existing={existingCheckIn} />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
