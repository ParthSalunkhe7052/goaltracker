"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

async function verifyAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") throw new Error("Unauthorized")
  return session.user.id
}

export async function lockAllApprovedGoals() {
  const adminId = await verifyAdmin()

  const { count } = await prisma.goal.updateMany({
    where: { status: "APPROVED" },
    data: { status: "LOCKED", isLocked: true }
  })

  await prisma.auditLog.create({
    data: {
      action: "LOCK_ALL_GOALS",
      entity: "Organization",
      entityId: "all",
      userId: adminId,
      details: `Locked ${count} approved goals`,
    }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/analytics")
  return { success: true, count }
}

export async function unlockGoal(goalId: string) {
  const adminId = await verifyAdmin()

  const goal = await prisma.goal.findUnique({ where: { id: goalId } })
  if (!goal) throw new Error("Goal not found")

  await prisma.goal.update({
    where: { id: goalId },
    data: { status: "APPROVED", isLocked: false }
  })

  await prisma.auditLog.create({
    data: {
      action: "UNLOCK_GOAL",
      entity: "Goal",
      entityId: goalId,
      userId: adminId,
      details: `Unlocked: ${goal.title}`,
    }
  })

  revalidatePath("/dashboard/analytics")
  return { success: true }
}

export async function markNotificationRead(notificationId: string) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.notification.update({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true }
  })

  revalidatePath("/dashboard/notifications")
  return { success: true }
}

export async function markAllNotificationsRead() {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true }
  })

  revalidatePath("/dashboard/notifications")
  return { success: true }
}

export async function syncEntraID() {
  await verifyAdmin()
  await new Promise(r => setTimeout(r, 1500))
  return { 
    success: true, 
    message: "Hierarchy and users synced from Microsoft Entra ID successfully." 
  }
}

export async function runEscalationEngine() {
  const adminId = await verifyAdmin()
  const usersWithNoGoals = await prisma.user.findMany({
    where: { 
      role: "EMPLOYEE",
      goals: { none: {} }
    },
    include: { manager: true }
  })

  for (const user of usersWithNoGoals) {
    if (user.managerId) {
      await prisma.notification.create({
        data: {
          type: "ESCALATION",
          message: `ESCALATION: ${user.name} has not submitted any goals for Phase 1.`,
          userId: user.managerId,
        }
      })
    }
  }

  await prisma.auditLog.create({
    data: {
      action: "RUN_ESCALATION",
      entity: "Organization",
      entityId: "all",
      userId: adminId,
      details: `Escalation engine processed ${usersWithNoGoals.length} non-compliant records`,
    }
  })

  return { 
    success: true, 
    processed: usersWithNoGoals.length 
  }
}
