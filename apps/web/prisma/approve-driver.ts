import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const updated = await prisma.user.update({
    where: { email: 'hountondjiphilippe58@gmail.com' },
    data: { isApproved: true },
  })
  console.log('Livreur approuvé :', updated.name, '| isApproved:', updated.isApproved)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())