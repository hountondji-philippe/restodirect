import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Mise à jour des devises des restaurants...')

  // Récupérer tous les restaurants
  const restaurants = await prisma.restaurant.findMany()

  // Restaurants africains en FCFA (XOF)
  const africanNames = ['Tantie', 'Thieboudienne', 'Maquis', 'Bamako', 'Marrakech']
  
  // Restaurants européens en Euro (EUR)
  const europeanNames = ['Trattoria', 'Bistrot', 'Sham', 'Paella', 'Taverne']
  
  // Restaurants asiatiques/américains en USD
  const usdNames = ['Chine', 'Sakura', 'Bangkok', 'Taqueria', 'NYC']

  let updatedCount = 0

  for (const restaurant of restaurants) {
    let currency = 'XOF' // Par défaut FCFA

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

    console.log(`${restaurant.name} -> ${currency}`)
    updatedCount++
  }

  console.log(`\n${updatedCount} restaurants mis a jour`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })