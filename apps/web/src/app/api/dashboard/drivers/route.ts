import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // SÉCURITÉ : Trouver le restaurant du restaurateur
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    // SÉCURITÉ : Ne récupérer que les livreurs approuvés pour CE restaurant
    const drivers = await prisma.driverApproval.findMany({
      where: {
        restaurantId: restaurant.id,
        status: 'APPROVED',
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rating: true,
            totalDeliveries: true,
            isAvailable: true,
            createdAt: true,
          },
        },
      },
      orderBy: { approvedAt: 'desc' },
    });

    return NextResponse.json(drivers);
  } catch (error: any) {
    console.error('Erreur recuperation livreurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}