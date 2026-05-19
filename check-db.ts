import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  const users = await prisma.user.findMany()
  console.log('Total users:', users.length)
  console.log(users.map(u => u.email))
}
check().finally(() => prisma.$disconnect())
