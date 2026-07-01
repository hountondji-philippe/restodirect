import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('Recherche du restaurant avec ID:', id);

    const restaurantCheck = await prisma.restaurant.findUnique({
      where: { id },
      select: { id: true, name: true, isActive: true },
    });

    console.log('Restaurant trouve (check):', restaurantCheck);

    if (!restaurantCheck) {
      return NextResponse.json({ 
        error: 'Restaurant non trouve',
        debug: 'Aucun restaurant avec cet ID dans la base de donnees'
      }, { status: 404 });
    }

    if (!restaurantCheck.isActive) {
      return NextResponse.json({ 
        error: 'Restaurant non actif',
        debug: 'Ce restaurant existe mais n\'est pas encore valide par l\'administrateur',
        restaurant: restaurantCheck
      }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        id,
        isActive: true 
      },
      include: {
        menuItems: {
          where: { isAvailable: true },
          orderBy: [
            { category: 'asc' },
            { name: 'asc' }
          ],
        },
        owner: {
          select: {
            name: true,
            phone: true,
          }
        }
      },
    });

    console.log('Restaurant complet:', restaurant);
    console.log('Nombre de plats:', restaurant?.menuItems?.length || 0);

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error: any) {
    console.error('Erreur GET restaurant detail:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      message: error.message 
    }, { status: 500 });
  }
}