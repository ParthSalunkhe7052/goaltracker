"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function verifyManager() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "MANAGER" && session.user.role !== "ADMIN")) throw new Error("Unauthorized")
  return session.user.id
}

async function verifyGoalOwnership(goalId: string, managerId: string) {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: { owner: { select: { managerId: true, name: true } } }
  })
  
  if (!goal) throw new Error("Goal not found")

  if (goal.owner.managerId !== managerId && goal.ownerId !== managerId) {
    const admin = await prisma.user.findUnique({ where: { id: managerId } })
    if (admin?.role !== "ADMIN") {
        throw new Error("Unauthorized: Goal does not belong to your team")
    }
  }
  return goal
}

export async function approveGoal(goalId: string) {
  const managerId = await verifyManager()
  const goal = await verifyGoalOwnership(goalId, managerId)

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "APPROVED" }
  })

  await prisma.auditLog.create({
    data: {
      action: "APPROVE_GOAL",
      entity: "Goal",
      entityId: goalId,
      userId: managerId,
      details: `Approved: ${goal.title}`,
    }
  })

  await prisma.notification.create({
    data: {
      type: "GOAL_APPROVED",
      message: `Your goal "${goal.title}" has been approved.`,
      userId: goal.ownerId,
    }
  })

  revalidatePath("/dashboard/approvals")
  revalidatePath("/dashboard/team")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function rejectGoal(goalId: string) {
  const managerId = await verifyManager()
  const goal = await verifyGoalOwnership(goalId, managerId)

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "DRAFT" }
  })

  await prisma.auditLog.create({
    data: {
      action: "REJECT_GOAL",
      entity: "Goal",
      entityId: goalId,
      userId: managerId,
      details: `Returned to draft: ${goal.title}`,
    }
  })

  await prisma.notification.create({
    data: {
      type: "GOAL_REJECTED",
      message: `Your goal "${goal.title}" was returned to draft for revision.`,
      userId: goal.ownerId,
    }
  })

  revalidatePath("/dashboard/approvals")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function addManagerComment(checkInId: string, comment: string) {
  const managerId = await verifyManager()

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { goal: { include: { owner: { select: { managerId: true } } } } }
  })

  if (!checkIn || (checkIn.goal.owner.managerId !== managerId && checkIn.goal.ownerId !== managerId)) {
    throw new Error("Unauthorized")
  }

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: { managerComment: comment }
  })

  await prisma.auditLog.create({
    data: {
      action: "MANAGER_COMMENT",
      entity: "CheckIn",
      entityId: checkInId,
      userId: managerId,
      details: `Added comment on ${checkIn.quarter} check-in`,
    }
  })

  revalidatePath("/dashboard/team")
  return { success: true }
}

export async function approveAllGoals(employeeId: string) {
  const managerId = await verifyManager()
  const employee = await prisma.user.findUnique({ where: { id: employeeId } })
  if (!employee || (employee.managerId !== managerId && employee.id !== managerId)) throw new Error("Unauthorized")

  const goals = await prisma.goal.findMany({
    where: { ownerId: employeeId, status: "SUBMITTED" }
  })

  await prisma.goal.updateMany({
    where: { ownerId: employeeId, status: "SUBMITTED" },
    data: { status: "APPROVED" }
  })

  await prisma.auditLog.create({
    data: {
      action: "BATCH_APPROVE",
      entity: "GoalSheet",
      entityId: employeeId,
      userId: managerId,
      details: `Batch approved ${goals.length} goals for ${employee.name}`,
    }
  })

  if (goals.length > 0) {
    await prisma.notification.create({
      data: {
        type: "GOAL_APPROVED",
        message: `All ${goals.length} submitted goal(s) have been approved by your manager.`,
        userId: employeeId,
      }
    })
  }

  revalidatePath("/dashboard/approvals")
  revalidatePath("/dashboard/team")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateGoalByManager(goalId: string, formData: FormData) {
  const managerId = await verifyManager()
  const goal = await verifyGoalOwnership(goalId, managerId)

  const title = formData.get("title") as string
  const weightage = Number(formData.get("weightage"))
  const target = formData.get("target") as string

  await prisma.goal.update({
    where: { id: goalId },
    data: { title, weightage, target }
  })

  await prisma.auditLog.create({
    data: {
      action: "MANAGER_EDIT_GOAL",
      entity: "Goal",
      entityId: goalId,
      userId: managerId,
      details: `Manager edited goal: ${title} (${weightage}%)`,
    }
  })

  revalidatePath("/dashboard/approvals")
  return { success: true }
}

export async function pushSharedGoal(templateGoalId: string, employeeIds: string[]) {
  const managerId = await verifyManager()
  
  const templateGoal = await prisma.goal.findUnique({
    where: { id: templateGoalId }
  })
  
  if (!templateGoal) throw new Error("Template goal not found")

  const creations = employeeIds.map(empId => 
    prisma.goal.create({
      data: {
        title: templateGoal.title,
        description: templateGoal.description,
        thrustArea: templateGoal.thrustArea,
        uom: templateGoal.uom,
        target: templateGoal.target,
        weightage: 10,
        status: "APPROVED",
        ownerId: empId,
        isShared: true,
        parentId: templateGoalId,
      }
    })
  )

  await Promise.all(creations)

  await prisma.auditLog.create({
    data: {
      action: "PUSH_SHARED_GOAL",
      entity: "Goal",
      entityId: templateGoalId,
      userId: managerId,
      details: `Pushed shared goal "${templateGoal.title}" to ${employeeIds.length} employees`,
    }
  })

  revalidatePath("/dashboard/team")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function lockGoal(goalId: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "LOCKED", isLocked: true }
  })

  await prisma.auditLog.create({
    data: {
      action: "LOCK_GOAL",
      entity: "Goal",
      entityId: goalId,
      userId: session.user.id,
      details: "Goal locked by Admin",
    }
  })

  revalidatePath("/dashboard")
  return { success: true }
}
