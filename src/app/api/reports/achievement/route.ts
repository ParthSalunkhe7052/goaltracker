import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const data = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    include: {
      goals: {
        include: {
          checkIns: {
            orderBy: { quarter: "desc" },
            take: 1
          }
        }
      }
    }
  })

  let csv = "Employee Name,Goal Title,Thrust Area,UoM,Target,Actual Achievement,Progress %,Status\n"

  data.forEach(user => {
    user.goals.forEach(goal => {
      const latestCheckIn = goal.checkIns[0]
      csv += `"${user.name}","${goal.title}","${goal.thrustArea}","${goal.uom}","${goal.target}","${latestCheckIn?.actualAchievement || ""}","${latestCheckIn?.progress || 0}%","${goal.status}"\n`
    })
  })

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="achievement-report.csv"',
    },
  })
}
