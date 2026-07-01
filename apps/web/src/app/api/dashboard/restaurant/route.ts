import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateRestaurantSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  image: z.string().min(1, 'L\'image est requise'),
  cuisine: z.string().min(2, 'La cuisine doit contenir au moins 2 caractères'),
  address: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  city: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  country: z.string().min(2, 'Le pays doit contenir au moins 2 caractères'),
  phone: z.string().regex(/^0[1-7][0-9]{8}$/, 'Le numéro doit contenir exactement 10 chiffres et commencer par 01-07 (format Bénin)'),
  deliveryTime: z.string().min(2, 'Le temps de livraison est requis'),
  priceRange: z.string().min(1, 'La gamme de prix est requise'),
  currency: z.enum(['XOF', 'EUR', 'USD']).refine((val) => ['XOF', 'EUR', 'USD'].includes(val), { message: 'Devise invalide. Utilisez XOF, EUR ou USD' }),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
      include: {
        menuItems: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Aucun restaurant trouvé' }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error: any) {
    console.error('Erreur GET restaurant:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Aucun restaurant trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateRestaurantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Erreur de validation',
        details: validation.error.issues 
      }, { status: 400 });
    }

    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: validation.data,
    });

    return NextResponse.json(updatedRestaurant);
  } catch (error: any) {
    console.error('Erreur mise à jour restaurant:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}