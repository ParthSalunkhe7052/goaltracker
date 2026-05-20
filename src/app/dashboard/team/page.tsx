import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { TeamTrackerClient } from "@/components/manager/team-tracker-client"

export default async function TeamPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "MANAGER") {
    return <div className="p-8 text-center text-destructive font-medium">Unauthorized Access</div>
  }

  const [team, templates] = await Promise.all([
    prisma.user.findMany({
      where: { managerId: session.user.id },
      include: {
        goals: {
          include: {
            checkIns: { orderBy: { quarter: "asc" } }
          },
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { name: "asc" }
    }),
    prisma.goal.findMany({
      where: { ownerId: session.user.id, parentId: null },
      orderBy: { createdAt: "desc" }
    })
  ])

  // Map to clean structure for components
  const cleanTeam = team.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    department: u.department,
    goals: u.goals.map(g => ({
      id: g.id,
      title: g.title,
      description: g.description,
      thrustArea: g.thrustArea,
      uom: g.uom,
      target: g.target || "",
      weightage: g.weightage,
      status: g.status,
      checkIns: g.checkIns.map(c => ({
        id: c.id,
        quarter: c.quarter,
        actualAchievement: c.actualAchievement || "",
        progress: c.progress,
        status: c.status,
        employeeComment: c.employeeComment,
        managerComment: c.managerComment,
      }))
    }))
  }))

  const cleanTemplates = templates.map(t => ({
    id: t.id,
    title: t.title,
    description: t.description,
    thrustArea: t.thrustArea,
    uom: t.uom,
    target: t.target || "",
    weightage: t.weightage,
  }))


  return (
    <TeamTrackerClient
      initialTeam={cleanTeam}
      initialTemplates={cleanTemplates}
    />
  )
}
