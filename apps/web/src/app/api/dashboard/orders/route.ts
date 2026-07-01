import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
      select: { id: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouvé' }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        delivery: {
          include: {
            driver: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        restaurant: {
          select: {
            currency: true,
            momoMTN: true,
            momoMTNName: true,
            momoMoov: true,
            momoMoovName: true,
            momoCeltiis: true,
            momoCeltiisName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedOrders = orders.map(order => ({
      ...order,
      currency: order.restaurant?.currency || 'XOF',
      momoMTN: order.restaurant?.momoMTN,
      momoMTNName: order.restaurant?.momoMTNName,
      momoMoov: order.restaurant?.momoMoov,
      momoMoovName: order.restaurant?.momoMoovName,
      momoCeltiis: order.restaurant?.momoCeltiis,
      momoCeltiisName: order.restaurant?.momoCeltiisName,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error('Erreur GET dashboard orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}