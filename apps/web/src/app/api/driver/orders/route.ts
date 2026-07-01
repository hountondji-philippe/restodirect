import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'LIVREUR') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const driver = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAvailable: true, isApproved: true },
    });

    if (!driver?.isApproved) {
      return NextResponse.json({ error: 'Compte non approuve' }, { status: 403 });
    }

    // SÉCURITÉ : Récupérer les restaurants auxquels ce livreur appartient
    const driverApprovals = await prisma.driverApproval.findMany({
      where: {
        driverId: userId,
        status: 'APPROVED',
      },
      select: {
        restaurantId: true,
      },
    });

    const approvedRestaurantIds = driverApprovals.map(a => a.restaurantId);

    if (approvedRestaurantIds.length === 0) {
      return NextResponse.json({
        available: [],
        myOrders: [],
        history: [],
      });
    }

    // 1. Commandes disponibles (READY, pas encore assignées)
    // SÉCURITÉ : Uniquement les restaurants auxquels le livreur appartient
    const availableOrders = await prisma.order.findMany({
      where: {
        status: 'READY',
        delivery: null,
        restaurantId: { in: approvedRestaurantIds },
        restaurant: { isActive: true },
      },
      include: {
        items: { include: { menuItem: true } },
        restaurant: {
          select: { id: true, name: true, address: true, city: true, phone: true, currency: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Commandes assignées à CE livreur (en cours)
    const myDeliveries = await prisma.delivery.findMany({
      where: {
        driverId: userId,
        status: { in: ['ACCEPTED', 'PICKED_UP'] },
      },
      include: {
        order: {
          include: {
            items: { include: { menuItem: true } },
            restaurant: {
              select: { id: true, name: true, address: true, city: true, phone: true, currency: true },
            },
          },
        },
        driver: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Historique COMPLET (DELIVERED + COMPLETED)
    const historyDeliveries = await prisma.delivery.findMany({
      where: {
        driverId: userId,
        status: { in: ['DELIVERED', 'COMPLETED'] },
      },
      include: {
        order: {
          include: {
            items: { include: { menuItem: true } },
            restaurant: { select: { name: true, currency: true } },
          },
        },
      },
      orderBy: { deliveredAt: 'desc' },
      take: 50,
    });

    const mapOrderWithClientInfo = (order: any) => ({
      ...order,
      user: {
        name: order.userName || 'Client',
        email: order.userEmail || 'Non spécifié',
        phone: order.userPhone || 'Non spécifié',
      },
      paymentMethod: order.paymentMethod || 'CASH',
      paymentStatus: order.paymentStatus || 'PENDING',
      currency: order.restaurant?.currency || 'XOF',
    });

    return NextResponse.json({
      available: availableOrders.map(mapOrderWithClientInfo),
      myOrders: myDeliveries.map(d => ({
        ...mapOrderWithClientInfo(d.order),
        delivery: d,
      })),
      history: historyDeliveries.map(d => ({
        ...mapOrderWithClientInfo(d.order),
        delivery: d,
      })),
    });
  } catch (error: any) {
    console.error('Erreur GET driver orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}