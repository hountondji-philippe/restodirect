import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'LIVREUR' },
    select: { id: true, name: true, email: true, role: true, isApproved: true, isAvailable: true }
  })
  
  console.log('Livreurs trouvés:', users.length)
  users.forEach(u => console.log(u))
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect() })