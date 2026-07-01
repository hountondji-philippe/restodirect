import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const restaurants = await prisma.restaurant.findMany({
      include: {
        owner: {
          select: { name: true, email: true },
        },
        _count: {
          select: { orders: true, menuItems: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(restaurants);
  } catch (error: any) {
    console.error('Erreur GET restaurants:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { restaurantId, isActive } = body;

    const restaurant = await prisma.restaurant.update({
      where: { id: restaurantId },
      data: { isActive },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    return NextResponse.json(restaurant);
  } catch (error: any) {
    console.error('Erreur PATCH restaurant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}