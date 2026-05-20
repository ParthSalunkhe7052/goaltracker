"use client"

import { useState, useTransition } from "react"
import { addManagerComment } from "@/app/actions/manager-actions"
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Calendar, Target, ClipboardList } from "lucide-react"

type CheckIn = {
  id: string
  quarter: string
  actualAchievement: string
  progress: number
  status: string
  employeeComment: string | null
  managerComment: string | null
}

type Goal = {
  id: string
  title: string
  thrustArea: string
  uom: string
  target: string
  weightage: number
  checkIns: CheckIn[]
}

type Employee = {
  id: string
  name: string | null
  goals: Goal[]
}

export function ManagerCheckinReview({ employee }: { employee: Employee }) {
  const [comments, setComments] = useState<Record<string, string>>({})
  const [pending, startTransition] = useTransition()

  function handleCommentSubmit(checkInId: string) {
    const comment = comments[checkInId]?.trim()
    if (!comment) return

    startTransition(async () => {
      try {
        await addManagerComment(checkInId, comment)
        toast.success("Comment added successfully")
        setComments(prev => ({ ...prev, [checkInId]: "" }))
      } catch (e: any) {
        toast.error(e.message || "Failed to add comment")
      }
    })
  }

  return (
    <DialogContent className="sm:max-w-[640px] bg-card border-border max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-foreground flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Review Check-ins: <span className="text-primary">{employee.name}</span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-4">
        {employee.goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No goals defined for this employee.
          </div>
        ) : (
          employee.goals.map(goal => (
            <div key={goal.id} className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    {goal.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                    Thrust: {goal.thrustArea} · Target: {goal.target} {goal.uom} · Weight: {goal.weightage}%
                  </p>
                </div>
              </div>

              {/* Check-ins list */}
              <div className="space-y-3 pt-2 border-t border-border/50">
                {["Q1", "Q2", "Q3", "Q4"].map(q => {
                  const checkIn = goal.checkIns.find(c => c.quarter === q)
                  return (
                    <div key={q} className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {q} Check-in
                        </span>
                        {checkIn ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            checkIn.status === "COMPLETED" ? "bg-emerald/10 text-emerald border-emerald/20" :
                            checkIn.status === "ON_TRACK" ? "bg-primary/10 text-primary border-primary/20" :
                            "bg-warning/10 text-warning border-warning/20"
                          }`}>
                            {checkIn.status.replace("_", " ")} ({checkIn.progress}%)
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/60 bg-muted/30 px-2 py-0.5 rounded-full">Not Submitted</span>
                        )}
                      </div>

                      {checkIn ? (
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-muted-foreground/60 block">Achievement:</span>
                            <p className="text-foreground mt-0.5 font-medium">{checkIn.actualAchievement}</p>
                          </div>

                          {checkIn.employeeComment && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground/60 block">Employee Comment:</span>
                              <p className="text-muted-foreground mt-0.5 italic">&quot;{checkIn.employeeComment}&quot;</p>
                            </div>
                          )}

                          {/* Manager Feedback Comment */}
                          <div className="pt-2 border-t border-border/30">
                            {checkIn.managerComment ? (
                              <div>
                                <span className="text-[10px] uppercase font-bold text-primary/80 block">Manager Feedback:</span>
                                <p className="text-foreground mt-0.5 font-medium">&quot;{checkIn.managerComment}&quot;</p>
                              </div>
                            ) : (
                              <div className="space-y-1.5 mt-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground/60 block">Add Feedback Comment:</label>
                                <div className="flex gap-2">
                                  <Textarea
                                    placeholder="Provide feedback or notes..."
                                    value={comments[checkIn.id] || ""}
                                    onChange={e => setComments(prev => ({ ...prev, [checkIn.id]: e.target.value }))}
                                    className="min-h-[40px] text-xs py-1.5 px-2.5 rounded-lg border-border bg-background"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleCommentSubmit(checkIn.id)}
                                    disabled={pending || !comments[checkIn.id]?.trim()}
                                    className="h-auto px-3 self-stretch text-xs"
                                  >
                                    Submit
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground/40 italic">Waiting for employee to submit progress...</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </DialogContent>
  )
}
