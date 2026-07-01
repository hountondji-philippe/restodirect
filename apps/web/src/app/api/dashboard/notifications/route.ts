import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    let notifications = [];

    if (userRole === 'RESTAURATEUR') {
      // Récupérer le restaurant du restaurateur
      const restaurant = await prisma.restaurant.findFirst({
        where: { ownerId: userId },
        select: { id: true },
      });

      if (!restaurant) {
        return NextResponse.json([]);
      }

      // Notifications pour les commandes de ce restaurant
      notifications = await prisma.deliveryNotification.findMany({
        where: {
          order: {
            restaurantId: restaurant.id,
          },
          sentTo: 'RESTAURANT',
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: 20,
      });
    } else if (userRole === 'LIVREUR') {
      // Notifications pour les commandes assignées à ce livreur
      notifications = await prisma.deliveryNotification.findMany({
        where: {
          order: {
            delivery: {
              driverId: userId,
            },
          },
          sentTo: 'DRIVER',
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: 20,
      });
    } else if (userRole === 'CLIENT') {
      // Notifications pour les commandes du client
      notifications = await prisma.deliveryNotification.findMany({
        where: {
          order: {
            userId: userId,
          },
          sentTo: 'CLIENT',
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              total: true,
            },
          },
        },
        orderBy: { sentAt: 'desc' },
        take: 20,
      });
    }

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Erreur GET notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    await prisma.deliveryNotification.updateMany({
      where: {
        id: { in: notificationIds },
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur PATCH notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}