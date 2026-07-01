import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const driverNames = [
  { name: 'Jean Kouassi', phone: '+229 90 11 22 33' },
  { name: 'Marie Adjovi', phone: '+229 91 22 33 44' },
  { name: 'Paul Mensah', phone: '+229 92 33 44 55' },
  { name: 'Sophie Agbota', phone: '+229 93 44 55 66' },
]

async function main() {
  console.log('🚀 Création sécurisée des livreurs par défaut...')
  
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
  })
  
  console.log(`🏪 Restaurants actifs trouvés: ${restaurants.length}`)
  
  const inviteLinks: string[] = []
  let totalDrivers = 0
  
  for (const restaurant of restaurants) {
    console.log(`\n Restaurant: ${restaurant.name}`)
    
    for (let i = 0; i < 4; i++) {
      const driverInfo = driverNames[i]
      // Email unique (pour la base de données)
      const restaurantSlug = restaurant.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      const email = `driver_${restaurantSlug}_${i + 1}@restodirect.com`
      
      // 1. Créer ou récupérer le compte (SANS mot de passe)
      let driver = await prisma.user.findUnique({ where: { email } })
      
      if (!driver) {
        driver = await prisma.user.create({
          data: {
            email,
            name: driverInfo.name,
            password: null, // Aucun mot de passe en dur !
            role: 'LIVREUR',
            phone: driverInfo.phone,
            isApproved: true,
            isAvailable: true,
          },
        })
        console.log(`  ✅ Compte créé pour ${driverInfo.name}`)
      }
      
      // 2. Approuver le livreur pour ce restaurant
      const existingApproval = await prisma.driverApproval.findUnique({
        where: {
          driverId_restaurantId: {
            driverId: driver.id,
            restaurantId: restaurant.id,
          },
        },
      })
      
      if (!existingApproval) {
        await prisma.driverApproval.create({
          data: {
            driverId: driver.id,
            restaurantId: restaurant.id,
            status: 'APPROVED',
            approvedAt: new Date(),
          },
        })
        console.log(`  ✅ Approuvé pour ${restaurant.name}`)
      }
      
      // 3. Générer le token d'invitation sécurisé
      const token = randomUUID()
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)
      
      await prisma.invitation.create({
        data: {
          email,
          token,
          type: 'LIVREUR',
          restaurantId: restaurant.id,
          createdBy: driver.id,
          expiresAt,
          status: 'PENDING',
        },
      })
      
      // 4. Sauvegarder le lien dans un tableau
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const link = `${baseUrl}/invite/${token}`
      inviteLinks.push(`[${restaurant.name}] ${driverInfo.name} (${email}) -> ${link}`)
      
      totalDrivers++
    }
  }
  
  // 5. Écrire les liens dans un fichier texte
  const filePath = path.join(process.cwd(), '..', 'driver-invites.txt')
  const content = `LIENS D'ACTIVATION DES LIVREURS (Généré le ${new Date().toLocaleString('fr-FR')})\n` +
                  `================================================================\n\n` +
                  `Aucun mot de passe n'est stocké dans le code.\n` +
                  `Clique sur chaque lien pour définir le mot de passe du livreur.\n\n` +
                  inviteLinks.join('\n')
  
  fs.writeFileSync(filePath, content, 'utf-8')
  
  console.log(`\n========================================`)
  console.log(`✅ ${totalDrivers} livreurs créés et approuvés.`)
  console.log(` Aucun mot de passe n'est dans le code.`)
  console.log(`📄 Ouvre le fichier : F:\\restodirect\\driver-invites.txt`)
  console.log(` Clique sur les liens pour définir les mots de passe.`)
  console.log(`========================================`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })