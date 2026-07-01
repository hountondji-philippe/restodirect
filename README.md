# RestoDirect

Plateforme de commande et livraison de repas en ligne.

## Stack technique

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript strict
- Tailwind CSS
- React Query
- React Hook Form
- Zod

### Backend
- Next.js API Routes
- Prisma ORM
- SQLite (dev) / PostgreSQL (prod)
- Redis (cache)
- Socket.IO (temps réel)

### Authentification
- Auth.js v5
- JWT avec rotation
- RBAC (CLIENT, RESTAURATEUR, LIVREUR, SUPER_ADMIN)

### Paiements
- Cash à la livraison
- MTN Mobile Money
- Moov Money
- Stripe (à venir)
- PayPal (à venir)

## Installation

```bash
# Cloner le repository
git clone [URL_DU_REPO]
cd restodirect

# Installer les dépendances
pnpm install

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
pnpm prisma migrate dev
pnpm prisma generate

# Lancer le serveur de développement
pnpm dev