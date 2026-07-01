import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Mise a jour des devises des restaurants...')
  const restaurants = await prisma.restaurant.findMany()
  
  const africanNames = ['Tantie', 'Thieboudienne', 'Maquis', 'Bamako', 'Marrakech']
  const europeanNames = ['Trattoria', 'Bistrot', 'Sham', 'Paella', 'Taverne']
  const usdNames = ['Chine', 'Sakura', 'Bangkok', 'Taqueria', 'NYC']
  
  let updatedCount = 0

  for (const restaurant of restaurants) {
    let currency = 'XOF'
    const nameLower = restaurant.name.toLowerCase()
    
    if (europeanNames.some(n => nameLower.includes(n.toLowerCase()))) {
      currency = 'EUR'
    } else if (usdNames.some(n => nameLower.includes(n.toLowerCase()))) {
      currency = 'USD'
    } else if (africanNames.some(n => nameLower.includes(n.toLowerCase()))) {
      currency = 'XOF'
    }

    await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: { currency },
    })
    
    console.log(restaurant.name + ' -> ' + currency)
    updatedCount++
  }
  
  console.log(updatedCount + ' restaurants mis a jour')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })