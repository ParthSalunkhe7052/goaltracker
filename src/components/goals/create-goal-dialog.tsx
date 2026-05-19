"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createGoal } from "@/app/actions/goal-actions"
import { useState } from "react"
import { toast } from "sonner"
import { PlusCircle } from "lucide-react"

export function CreateGoalDialog({ remainingWeight }: { remainingWeight: number }) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    setPending(true)
    try {
      await createGoal(formData)
      toast.success("Goal created successfully")
      setOpen(false)
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to create goal")
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <PlusCircle className="w-4 h-4" />
        Create Goal
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-border bg-card">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add a new goal to your quarterly tracker. You have {remainingWeight}% weightage remaining.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Goal Title</Label>
            <Input id="title" name="title" required placeholder="e.g. Launch Q3 Marketing Campaign" className="bg-background border-border" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Brief details about the goal..." className="bg-background border-border min-h-[100px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thrustArea">Thrust Area</Label>
              <Select name="thrustArea" defaultValue="OPERATIONAL">
                <SelectTrigger id="thrustArea" className="bg-background border-border">
                  <SelectValue placeholder="Select Area" />
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
              <Label htmlFor="uom">Unit of Measurement</Label>
              <Select name="uom" defaultValue="NUMERIC_MIN">
                <SelectTrigger id="uom" className="bg-background border-border">
                  <SelectValue placeholder="Select UoM" />
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
              <Label htmlFor="target">Target Value</Label>
              <Input id="target" name="target" placeholder="e.g. 100, 2026-12-31, or 0" required className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage (%)</Label>
              <Input id="weightage" name="weightage" type="number" min="10" max={remainingWeight} required defaultValue={Math.min(10, remainingWeight)} className="bg-background border-border" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={pending || remainingWeight < 10}>
              {pending ? "Creating..." : "Save Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}