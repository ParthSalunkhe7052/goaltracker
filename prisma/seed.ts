import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Users ──
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: { name: 'Sarah Chen', department: 'HR & Operations', role: 'ADMIN' },
    create: {
      name: 'Sarah Chen',
      email: 'admin@demo.com',
      role: 'ADMIN',
      department: 'HR & Operations',
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: { name: 'Alex Rivera', department: 'Engineering', role: 'MANAGER' },
    create: {
      name: 'Alex Rivera',
      email: 'manager@demo.com',
      role: 'MANAGER',
      department: 'Engineering',
    },
  })

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo.com' },
    update: { name: 'Jordan Kim', department: 'Engineering', managerId: manager.id },
    create: {
      name: 'Jordan Kim',
      email: 'employee@demo.com',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    },
  })

  const emp2 = await prisma.user.upsert({
    where: { email: 'priya@demo.com' },
    update: { name: 'Priya Patel', department: 'Engineering', managerId: manager.id },
    create: {
      name: 'Priya Patel',
      email: 'priya@demo.com',
      role: 'EMPLOYEE',
      department: 'Engineering',
      managerId: manager.id,
    },
  })

  console.log('✅ Users created')

  // ── Clear existing ──
  await prisma.checkIn.deleteMany({})
  await prisma.goal.deleteMany({})
  await prisma.auditLog.deleteMany({})
  await prisma.notification.deleteMany({})

  console.log('🧹 Cleared existing data')

  // ── Goals for Jordan ──
  await prisma.goal.create({
    data: {
      title: 'Launch Redesigned Mobile App',
      description: 'UX overhaul and ship v2.',
      thrustArea: 'TECHNOLOGY',
      uom: 'NUMERIC_MAX',
      target: '100',
      weightage: 30,
      status: 'APPROVED',
      ownerId: employee.id,
      checkIns: {
        create: [
          { quarter: 'Q1', progress: 40, status: 'ON_TRACK', actualAchievement: '40', employeeComment: 'Design phase completed and initial development started.' },
          { quarter: 'Q2', progress: 75, status: 'ON_TRACK', actualAchievement: '75', employeeComment: 'Beta testing underway.' },
        ]
      }
    }
  })

  await prisma.goal.create({
    data: {
      title: 'Reduce Infrastructure Costs',
      description: 'Optimize AWS spending and migrate to serverless where applicable.',
      thrustArea: 'FINANCIAL',
      uom: 'NUMERIC_MIN',
      target: '5000',
      weightage: 40,
      status: 'APPROVED',
      ownerId: employee.id,
      checkIns: {
        create: [
          { quarter: 'Q1', progress: 20, status: 'NOT_STARTED', actualAchievement: '6500', employeeComment: 'Costs are slightly higher than expected due to migration overlaps.', managerComment: 'Let us review the migration strategy next week.' },
        ]
      }
    }
  })

  await prisma.goal.create({
    data: {
      title: 'Safety Incidents',
      description: 'Maintain zero workplace accidents.',
      thrustArea: 'OPERATIONAL',
      uom: 'ZERO_BASED',
      target: '0',
      weightage: 10,
      status: 'APPROVED',
      ownerId: employee.id,
      checkIns: {
        create: [
          { quarter: 'Q1', progress: 100, status: 'ON_TRACK', actualAchievement: '0', employeeComment: 'Zero incidents recorded.' },
        ]
      }
    }
  })

  await prisma.goal.create({
    data: {
      title: 'Team Training Seminars',
      description: 'Conduct security and privacy training for the engineering team.',
      thrustArea: 'PEOPLE_AND_CULTURE',
      uom: 'PERCENT_MAX',
      target: '100',
      weightage: 20,
      status: 'SUBMITTED',
      ownerId: employee.id,
    }
  })

  // ── Goals for Priya ──
  await prisma.goal.create({
    data: {
      title: 'Expand API Rate Limits',
      description: 'Scale the API infrastructure to handle 10k requests/second.',
      thrustArea: 'TECHNOLOGY',
      uom: 'NUMERIC_MAX',
      target: '10000',
      weightage: 50,
      status: 'APPROVED',
      ownerId: emp2.id,
      checkIns: {
        create: [
          { quarter: 'Q1', progress: 50, status: 'ON_TRACK', actualAchievement: '5000', employeeComment: 'Redis caching implemented, current sustained rate is 5k/s.' },
        ]
      }
    }
  })

  await prisma.goal.create({
    data: {
      title: 'Improve Customer Satisfaction',
      description: 'Increase CSAT score from 85% to 95%.',
      thrustArea: 'CUSTOMER',
      uom: 'PERCENT_MAX',
      target: '95',
      weightage: 50,
      status: 'DRAFT',
      ownerId: emp2.id,
    }
  })

  // ── Notifications ──
  await prisma.notification.create({
    data: {
      userId: manager.id,
      message: 'Jordan Kim submitted "Team Training Seminars" for approval.',
      type: 'GOAL_SUBMITTED',
    }
  })

  await prisma.notification.create({
    data: {
      userId: employee.id,
      message: 'Alex Rivera reviewed your Q1 check-in for "Reduce Infrastructure Costs".',
      type: 'CHECKIN_REVIEWED',
    }
  })

  // ── Audit Logs ──
  await prisma.auditLog.createMany({
    data: [
      { action: 'GOAL_CREATED', entity: 'GOAL', entityId: 'goal-1', userId: employee.id, details: '{"title": "Launch Redesigned Mobile App"}' },
      { action: 'GOAL_CREATED', entity: 'GOAL', entityId: 'goal-2', userId: employee.id, details: '{"title": "Reduce Infrastructure Costs"}' },
      { action: 'CHECKIN_SUBMITTED', entity: 'CHECKIN', entityId: 'checkin-1', userId: employee.id, details: '{"quarter": "Q1", "progress": 40}' },
      { action: 'CHECKIN_REVIEWED', entity: 'CHECKIN', entityId: 'checkin-1', userId: manager.id, details: '{"status": "NOT_STARTED"}' },
    ]
  })

  console.log('✅ Demo goals, notifications, and logs created')
  console.log('\n🎉 Seed completed successfully!\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
