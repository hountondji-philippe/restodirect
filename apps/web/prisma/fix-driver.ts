import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const driver = await prisma.user.findUnique({
    where: { email: 'hountondjiphilippe58@gmail.com' },
    select: { id: true, name: true },
  })

  if (!driver) {
    console.log('Livreur non trouve')
    return
  }

  const restaurant = await prisma.restaurant.findFirst({
    select: { id: true, name: true },
  })

  if (!restaurant) {
    console.log('Aucun restaurant trouve')
    return
  }

  const existing = await prisma.driverApproval.findUnique({
    where: {
      driverId_restaurantId: {
        driverId: driver.id,
        restaurantId: restaurant.id,
      },
    },
  })

  if (existing) {
    await prisma.driverApproval.update({
      where: { id: existing.id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    })
    console.log('DriverApproval mis a jour : APPROVED')
  } else {
    await prisma.driverApproval.create({
      data: {
        driverId: driver.id,
        restaurantId: restaurant.id,
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    })
    console.log('DriverApproval cree : APPROVED')
  }

  console.log('Livreur:', driver.name, '| Restaurant:', restaurant.name)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())