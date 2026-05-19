"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getActiveQuarterWindow } from "@/lib/utils"

const goalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thrustArea: z.enum(["FINANCIAL", "OPERATIONAL", "CUSTOMER", "PEOPLE", "PEOPLE_AND_CULTURE", "TECHNOLOGY"]),
  uom: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "PERCENT_MIN", "PERCENT_MAX", "TIMELINE", "ZERO_BASED"]),
  target: z.string().min(1, "Target is required"),
  weightage: z.coerce.number().min(10, "Minimum 10% weightage").max(100),
})

export async function createGoal(formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Check window
  const isDemo = process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development"
  if (getActiveQuarterWindow() !== "GOAL_SETTING" && !isDemo) {
    throw new Error("Goal creation window is currently closed (Opens in May)")
  }

  const data = Object.fromEntries(formData.entries())
  const parsed = goalSchema.parse(data)

  const ownerId = session.user.id

  const currentGoals = await prisma.goal.count({ where: { ownerId } })
  if (currentGoals >= 8) throw new Error("Maximum of 8 goals allowed per employee")

  const allGoals = await prisma.goal.findMany({ where: { ownerId } })
  const currentWeight = allGoals.reduce((sum, g) => sum + g.weightage, 0)
  if (currentWeight + parsed.weightage > 100) {
    throw new Error(`Cannot exceed 100% total weightage. You have ${100 - currentWeight}% remaining.`)
  }

  await prisma.goal.create({
    data: { ...parsed, ownerId }
  })

  revalidatePath("/dashboard/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateGoal(goalId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal || goal.ownerId !== session.user.id) throw new Error("Unauthorized")
  if (goal.status !== "DRAFT" && goal.status !== "SUBMITTED") throw new Error("Goal cannot be edited in current status")

  const data = Object.fromEntries(formData.entries())
  const parsed = goalSchema.parse(data)

  // Check new total doesn't exceed 100 (exclude this goal's old weight)
  const allGoals = await prisma.goal.findMany({ where: { ownerId: session.user.id, id: { not: goalId } } })
  const otherWeight = allGoals.reduce((sum, g) => sum + g.weightage, 0)
  if (otherWeight + parsed.weightage > 100) {
    throw new Error(`Cannot exceed 100% total weightage. Available: ${100 - otherWeight}%`)
  }

  await prisma.goal.update({
    where: { id: goalId },
    data: parsed
  })

  revalidatePath("/dashboard/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteGoal(goalId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal) throw new Error("Goal not found")
  if (goal.ownerId !== session.user.id) throw new Error("Unauthorized")
  if (goal.status !== "DRAFT") throw new Error("Only draft goals can be deleted")

  await prisma.goal.delete({ where: { id: goalId } })
  revalidatePath("/dashboard/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function submitGoals() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const ownerId = session.user.id
  const goals = await prisma.goal.findMany({ where: { ownerId, status: "DRAFT" } })

  if (goals.length === 0) throw new Error("No draft goals to submit")

  const allGoals = await prisma.goal.findMany({ where: { ownerId } })
  const totalWeight = allGoals.reduce((sum, g) => sum + g.weightage, 0)
  if (totalWeight !== 100) {
    throw new Error(`Total weightage must equal exactly 100% to submit. Currently: ${totalWeight}%`)
  }

  await prisma.goal.updateMany({
    where: { ownerId, status: "DRAFT" },
    data: { status: "SUBMITTED" }
  })

  await prisma.auditLog.create({
    data: {
      action: "SUBMIT_GOALS",
      entity: "GoalSheet",
      entityId: ownerId,
      userId: ownerId,
      details: `Submitted ${goals.length} goals (${totalWeight}% weight)`,
    }
  })

  // Notify manager
  const user = await prisma.user.findUnique({ where: { id: ownerId }, select: { name: true, managerId: true } })
  if (user?.managerId) {
    await prisma.notification.create({
      data: {
        type: "PENDING_APPROVAL",
        message: `${user.name} has submitted ${goals.length} goal(s) for your review.`,
        userId: user.managerId,
      }
    })
  }

  revalidatePath("/dashboard/goals")
  revalidatePath("/dashboard")
  return { success: true }
}

const checkInSchema = z.object({
  actualAchievement: z.string().min(1, "Actual achievement is required"),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]),
  employeeComment: z.string().optional(),
})

function calculateProgress(uom: string, target: string, actual: string): number {
  try {
    const t = parseFloat(target)
    const a = parseFloat(actual)

    switch (uom) {
      case "NUMERIC_MIN":
      case "PERCENT_MIN":
        return Math.min(Math.round((a / t) * 100), 100)
      case "NUMERIC_MAX":
      case "PERCENT_MAX":
        return Math.min(Math.round((t / a) * 100), 100)
      case "ZERO_BASED":
        return a === 0 ? 100 : 0
      case "TIMELINE":
        // Assuming target and actual are ISO date strings
        const targetDate = new Date(target).getTime()
        const actualDate = new Date(actual).getTime()
        return actualDate <= targetDate ? 100 : 0
      default:
        return 0
    }
  } catch (e) {
    return 0
  }
}

export async function upsertCheckIn(goalId: string, quarter: "Q1" | "Q2" | "Q3" | "Q4", formData: FormData) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // Check window
  const isDemo = process.env.DEMO_MODE === "true" || process.env.NODE_ENV === "development"
  if (getActiveQuarterWindow() !== quarter && !isDemo) {
    throw new Error(`The window for ${quarter} check-ins is currently closed.`)
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal || goal.ownerId !== session.user.id) throw new Error("Unauthorized")
  if (goal.status === "DRAFT" || goal.status === "SUBMITTED") {
    throw new Error("Goal must be approved before submitting check-ins")
  }

  const data = Object.fromEntries(formData.entries())
  const parsed = checkInSchema.parse(data)

  const progress = calculateProgress(goal.uom, goal.target || "0", parsed.actualAchievement)

  await prisma.checkIn.upsert({
    where: { goalId_quarter: { goalId, quarter } },
    update: { ...parsed, progress },
    create: { ...parsed, progress, goalId, quarter }
  })

  // Sync achievement if this is a parent goal (Shared Goals requirement)
  const childGoals = await prisma.goal.findMany({ where: { parentId: goalId } })
  if (childGoals.length > 0) {
    for (const child of childGoals) {
      await prisma.checkIn.upsert({
        where: { goalId_quarter: { goalId: child.id, quarter } },
        update: { 
          actualAchievement: parsed.actualAchievement, 
          progress, 
          status: parsed.status 
        },
        create: { 
          actualAchievement: parsed.actualAchievement, 
          progress, 
          status: parsed.status, 
          goalId: child.id, 
          quarter 
        }
      })
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "CHECKIN_UPDATE",
      entity: "CheckIn",
      entityId: goalId,
      userId: session.user.id,
      details: `${quarter} check-in: ${progress}% (Actual: ${parsed.actualAchievement})`,
    }
  })

  revalidatePath("/dashboard/checkins")
  revalidatePath("/dashboard")
  return { success: true }
}
