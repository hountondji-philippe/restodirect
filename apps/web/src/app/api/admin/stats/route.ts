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

    const [
      totalUsers,
      totalRestaurants,
      totalDrivers,
      totalOrders,
      totalRevenue,
      pendingRestaurants,
      pendingDrivers,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CLIENT' } }),
      prisma.restaurant.count(),
      prisma.user.count({ where: { role: 'LIVREUR' } }),
      prisma.order.count(),
      prisma.order.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.restaurant.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'LIVREUR', isApproved: false } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: { select: { name: true } },
          items: {
            include: { menuItem: { select: { name: true } } },
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalRestaurants,
      totalDrivers,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingRestaurants,
      pendingDrivers,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Erreur stats admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}