"use client"

import { useState, useTransition } from "react"
import { pushSharedGoal, createTemplateGoal } from "@/app/actions/manager-actions"
import { upsertCheckIn } from "@/app/actions/goal-actions"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Users, Target, ClipboardList, PlusCircle, Send, CheckCircle2, AlertCircle } from "lucide-react"
import { ManagerCheckinReview } from "./manager-checkin-review"

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
  description: string | null
  thrustArea: string
  uom: string
  target: string
  weightage: number
  status: string
  checkIns: CheckIn[]
}

type Employee = {
  id: string
  name: string | null
  email: string | null
  department: string | null
  goals: Goal[]
}

type TemplateGoal = {
  id: string
  title: string
  description: string | null
  thrustArea: string
  uom: string
  target: string
  weightage: number
}

export function TeamTrackerClient({
  initialTeam,
  initialTemplates
}: {
  initialTeam: Employee[]
  initialTemplates: TemplateGoal[]
}) {
  const [team, setTeam] = useState(initialTeam)
  const [templates, setTemplates] = useState(initialTemplates)
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [reviewOpen, setReviewOpen] = useState(false)
  
  const [templateOpen, setTemplateOpen] = useState(false)
  const [pushOpen, setPushOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateGoal | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const [checkInOpen, setCheckInOpen] = useState(false)
  const [selectedCheckInTemplate, setSelectedCheckInTemplate] = useState<TemplateGoal | null>(null)
  const [checkInQuarter, setCheckInQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4">("Q3")
  const [checkInAchievement, setCheckInAchievement] = useState("")
  const [checkInStatus, setCheckInStatus] = useState("NOT_STARTED")
  const [checkInComment, setCheckInComment] = useState("")
  
  const [pending, startTransition] = useTransition()


  // Template Form State
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newThrust, setNewThrust] = useState("FINANCIAL")
  const [newUom, setNewUom] = useState("NUMERIC_MAX")
  const [newTarget, setNewTarget] = useState("")

  function handleTemplateCheckInSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCheckInTemplate) return

    const fd = new FormData()
    fd.append("actualAchievement", checkInAchievement)
    fd.append("status", checkInStatus)
    fd.append("employeeComment", checkInComment)

    startTransition(async () => {
      try {
        await upsertCheckIn(selectedCheckInTemplate.id, checkInQuarter, fd)
        toast.success(`Check-in pushed for template and synced to team!`)
        setCheckInOpen(false)
        setCheckInAchievement("")
        setCheckInStatus("NOT_STARTED")
        setCheckInComment("")
      } catch (err: any) {
        toast.error(err.message || "Failed to submit check-in")
      }
    })
  }

  function handleCreateTemplate(e: React.FormEvent) {

    e.preventDefault()
    if (!newTitle || !newTarget) {
      toast.error("Please fill in required fields")
      return
    }

    const formData = new FormData()
    formData.append("title", newTitle)
    formData.append("description", newDesc)
    formData.append("thrustArea", newThrust)
    formData.append("uom", newUom)
    formData.append("target", newTarget)

    startTransition(async () => {
      try {
        const res = await createTemplateGoal(formData)
        if (res.success) {
          toast.success("Shared goal template created!")
          // Add local state
          const newTpl: TemplateGoal = {
            id: res.id,
            title: newTitle,
            description: newDesc,
            thrustArea: newThrust,
            uom: newUom,
            target: newTarget,
            weightage: 10
          }
          setTemplates(prev => [newTpl, ...prev])
          setTemplateOpen(false)
          // Reset
          setNewTitle("")
          setNewDesc("")
          setNewTarget("")
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to create template")
      }
    })
  }

  function handlePushSharedGoal() {
    if (!selectedTemplate) return
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee")
      return
    }

    startTransition(async () => {
      try {
        const res = await pushSharedGoal(selectedTemplate.id, selectedEmployees)
        if (res.success) {
          toast.success(`Successfully pushed to ${selectedEmployees.length} employee(s)`)
          setPushOpen(false)
          setSelectedEmployees([])
          
          // Re-sync team goals locally for instant feedback
          // This creates a mockup item locally
          setTeam(prev => prev.map(emp => {
            if (selectedEmployees.includes(emp.id)) {
              // Add a mockup shared goal locally
              const exists = emp.goals.some(g => g.title === selectedTemplate.title)
              if (exists) return emp
              const newGoal: Goal = {
                id: Math.random().toString(),
                title: selectedTemplate.title,
                description: selectedTemplate.description,
                thrustArea: selectedTemplate.thrustArea,
                uom: selectedTemplate.uom,
                target: selectedTemplate.target,
                weightage: 10,
                status: "APPROVED",
                checkIns: []
              }
              return { ...emp, goals: [...emp.goals, newGoal] }
            }
            return emp
          }))
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to push goal")
      }
    })
  }

  function toggleEmployeeSelect(empId: string) {
    setSelectedEmployees(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    )
  }

  return (
    <div className="space-y-8">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Team Tracker</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitor quarterly check-ins and distribute shared performance goals.
          </p>
        </div>
        
        <div className="flex gap-2">
          {/* Create Shared Goal Dialog */}
          <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
            <DialogTrigger render={
              <Button variant="outline" className="gap-2 text-xs border-border">
                <PlusCircle className="w-4 h-4 text-primary" /> Create KPI Template
              </Button>
            } />
            <DialogContent className="sm:max-w-[480px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">New Shared Goal Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTemplate} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs">Goal Title *</Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Pass Security Compliance Audit"
                    required
                    className="bg-background border-border text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs">Description</Label>
                  <Textarea
                    id="description"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Enter details about this template..."
                    className="bg-background border-border text-sm min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="thrustArea" className="text-xs">Thrust Area</Label>
                    <Select value={newThrust} onValueChange={(val) => val && setNewThrust(val)}>
                      <SelectTrigger className="bg-background border-border text-xs">
                        <SelectValue placeholder="Thrust Area" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="FINANCIAL">Financial</SelectItem>
                        <SelectItem value="CUSTOMER">Customer Focus</SelectItem>
                        <SelectItem value="OPERATIONAL">Operations</SelectItem>
                        <SelectItem value="PEOPLE">People & Culture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="uom" className="text-xs">Unit of Measure</Label>
                    <Select value={newUom} onValueChange={(val) => val && setNewUom(val)}>
                      <SelectTrigger className="bg-background border-border text-xs">
                        <SelectValue placeholder="UoM" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="NUMERIC_MAX">Numeric Max (Higher is Better)</SelectItem>
                        <SelectItem value="NUMERIC_MIN">Numeric Min (Lower is Better)</SelectItem>
                        <SelectItem value="PERCENT_MAX">Percent Max (%)</SelectItem>
                        <SelectItem value="PERCENT_MIN">Percent Min (%)</SelectItem>
                        <SelectItem value="ZERO_BASED">Zero-Based (0 Target)</SelectItem>
                        <SelectItem value="TIMELINE">Timeline (Date Target)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="target" className="text-xs">Target Value *</Label>
                  <Input
                    id="target"
                    value={newTarget}
                    onChange={e => setNewTarget(e.target.value)}
                    placeholder="e.g. 100 or 2026-12-31"
                    required
                    className="bg-background border-border text-sm"
                  />
                </div>
                <Button type="submit" disabled={pending} className="w-full mt-2">
                  {pending ? "Creating..." : "Save Template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Templates Section if any exist */}
      {templates.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Shared KPI Templates
            </CardTitle>
            <CardDescription className="text-xs">
              Push these standard organizational goals directly to your direct reports.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-3.5 rounded-xl bg-muted/20 border border-border flex flex-col justify-between hover:border-border/60 transition-all">
                  <div>
                    <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider mb-2">
                      {tpl.thrustArea}
                    </Badge>
                    <h4 className="font-semibold text-xs text-foreground truncate">{tpl.title}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {tpl.description || "No description provided."}
                    </p>
                    <p className="text-[10px] text-primary/80 mt-2 font-semibold">
                      Target: {tpl.target} · UoM: {tpl.uom}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1 text-[11px] h-8 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary"
                      onClick={() => {
                        setSelectedTemplate(tpl)
                        setPushOpen(true)
                      }}
                    >
                      <Send className="w-3 h-3" /> Push to Team
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 gap-1 text-[11px] h-8"
                      onClick={() => {
                        setSelectedCheckInTemplate(tpl)
                        setCheckInOpen(true)
                      }}
                    >
                      <ClipboardList className="w-3 h-3 text-muted-foreground" /> Check-in
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team List */}
      <div className="space-y-4">
        {team.map(member => {
          const totalGoals = member.goals.length
          const approvedGoals = member.goals.filter(g => g.status === "APPROVED" || g.status === "LOCKED").length
          const pendingApprovalGoals = member.goals.filter(g => g.status === "SUBMITTED").length
          
          // Calculate average check-in progress
          const latestProgressList = member.goals.map(g => {
            // Find most recent check-in progress
            const sortedCheckins = [...g.checkIns].sort((a, b) => b.quarter.localeCompare(a.quarter))
            return sortedCheckins[0]?.progress ?? 0
          })
          
          const avgProgress = totalGoals > 0
            ? Math.round(latestProgressList.reduce((s, p) => s + p, 0) / totalGoals)
            : 0

          const goalDefProgress = totalGoals > 0 ? (approvedGoals / totalGoals) * 100 : 0

          return (
            <Card key={member.id} className="bg-card border-border hover:border-border/40 transition-all">
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  {/* Left: User Avatar & info */}
                  <div className="flex items-center gap-3.5 min-w-[240px]">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {member.name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "E"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                        {member.name}
                        {pendingApprovalGoals > 0 && (
                          <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                      {member.department && (
                        <span className="text-[9px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full mt-1.5 inline-block font-semibold">
                          {member.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Stats */}
                  <div className="grid grid-cols-3 gap-6 flex-1 w-full max-w-sm">
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">{totalGoals}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Goals</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-emerald">{approvedGoals}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Approved</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-primary">{avgProgress}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Progress</div>
                    </div>
                  </div>

                  {/* Middle Progress Bars */}
                  <div className="flex-1 w-full space-y-3 min-w-[200px] max-w-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Goals Approved</span>
                        <span className="font-semibold text-foreground">{Math.round(goalDefProgress)}%</span>
                      </div>
                      <Progress value={goalDefProgress} className="h-1.5" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Latest Progress</span>
                        <span className="font-semibold text-foreground">{avgProgress}%</span>
                      </div>
                      <Progress value={avgProgress} className="h-1.5" />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 w-full lg:w-auto justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-9 border-border text-foreground hover:bg-muted"
                      onClick={() => {
                        setSelectedEmployee(member)
                        setReviewOpen(true)
                      }}
                    >
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      Review Check-ins
                    </Button>
                  </div>
                </div>

                {/* Micro-preview of Goals */}
                {member.goals.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border/60">
                    <div className="flex flex-wrap gap-2">
                      {member.goals.map(g => (
                        <div key={g.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/20 border border-border text-[11px]">
                          <Target className="w-3.5 h-3.5 text-primary" />
                          <span className="text-foreground font-medium truncate max-w-[130px]">{g.title}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            g.status === "APPROVED" || g.status === "LOCKED" ? "bg-emerald/15 text-emerald border border-emerald/10" :
                            g.status === "SUBMITTED" ? "bg-warning/15 text-warning border border-warning/10" :
                            "bg-muted text-muted-foreground border border-border/50"
                          }`}>
                            {g.status}
                          </span>
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

      {/* Check-ins Review Dialog */}
      {selectedEmployee && (
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <ManagerCheckinReview
            employee={selectedEmployee}
          />
        </Dialog>
      )}

      {/* Push Shared Goal Dialog */}
      {selectedTemplate && (
        <Dialog open={pushOpen} onOpenChange={setPushOpen}>
          <DialogContent className="sm:max-w-[440px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Push KPI to Employees</DialogTitle>
              <CardDescription className="text-xs mt-1">
                Pushes &quot;{selectedTemplate.title}&quot; to selected employees. It will occupy 10% weightage as an Approved Shared Goal.
              </CardDescription>
            </DialogHeader>

            <div className="space-y-4 mt-3">
              <Label className="text-xs">Select Employees</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto border border-border rounded-xl p-2 bg-background">
                {team.map(emp => {
                  const alreadyHas = emp.goals.some(g => g.title === selectedTemplate.title)
                  return (
                    <div
                      key={emp.id}
                      onClick={() => !alreadyHas && toggleEmployeeSelect(emp.id)}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        alreadyHas ? "opacity-40 cursor-not-allowed bg-muted/10" :
                        selectedEmployees.includes(emp.id) ? "bg-primary/10 text-primary border border-primary/20" :
                        "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-muted">
                            {emp.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{emp.name}</span>
                      </div>
                      <div>
                        {alreadyHas ? (
                          <Badge variant="outline" className="text-[9px] bg-emerald/10 text-emerald">Already Has</Badge>
                        ) : selectedEmployees.includes(emp.id) ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-border" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button size="sm" variant="secondary" onClick={() => setPushOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handlePushSharedGoal}
                  disabled={pending || selectedEmployees.length === 0}
                  className="text-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Push Goal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Template Check-In Dialog */}
      {selectedCheckInTemplate && (
        <Dialog open={checkInOpen} onOpenChange={setCheckInOpen}>
          <DialogContent className="sm:max-w-[440px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                Template Goal Check-in
              </DialogTitle>
              <CardDescription className="text-xs">
                Submit quarterly progress for &quot;{selectedCheckInTemplate.title}&quot;. This achievement and progress status will automatically sync to all employees holding this shared goal.
              </CardDescription>
            </DialogHeader>

            <form onSubmit={handleTemplateCheckInSubmit} className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="checkin-quarter" className="text-xs">Quarter</Label>
                <Select value={checkInQuarter} onValueChange={(val) => val && setCheckInQuarter(val as any)}>
                  <SelectTrigger className="bg-background border-border text-xs">
                    <SelectValue placeholder="Select Quarter" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkin-achievement" className="text-xs">Actual Achievement Value</Label>
                <Input
                  id="checkin-achievement"
                  value={checkInAchievement}
                  onChange={e => setCheckInAchievement(e.target.value)}
                  placeholder="e.g. 95 or 2026-12-31"
                  required
                  className="bg-background border-border text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkin-status" className="text-xs">Status</Label>
                <Select value={checkInStatus} onValueChange={(val) => val && setCheckInStatus(val)}>
                  <SelectTrigger className="bg-background border-border text-xs">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                    <SelectItem value="ON_TRACK">On Track</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="checkin-comment" className="text-xs">Manager Notes / Update Comments</Label>
                <Textarea
                  id="checkin-comment"
                  value={checkInComment}
                  onChange={e => setCheckInComment(e.target.value)}
                  placeholder="Describe details of template progress updates..."
                  className="bg-background border-border text-sm min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button size="sm" type="button" variant="secondary" onClick={() => setCheckInOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={pending}
                  className="text-xs gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {pending ? "Saving..." : "Submit Check-in"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

