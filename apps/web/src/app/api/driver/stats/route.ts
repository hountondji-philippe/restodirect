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

    // Stats totales
    const totalDeliveries = await prisma.delivery.count({
      where: { driverId: userId, status: 'COMPLETED' },
    });

    const deliveries = await prisma.delivery.findMany({
      where: { driverId: userId },
      select: { earnings: true, rating: true, status: true, deliveredAt: true },
    });

    const totalEarnings = deliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);
    const averageRating = deliveries.filter(d => d.rating).reduce((sum, d) => sum + (d.rating || 0), 0) / (deliveries.filter(d => d.rating).length || 1);
    const activeDeliveries = deliveries.filter(d => ['ACCEPTED', 'PICKED_UP'].includes(d.status)).length;

    // Stats cette semaine
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thisWeekDeliveries = deliveries.filter(d => d.deliveredAt && new Date(d.deliveredAt) >= weekAgo);
    const completedThisWeek = thisWeekDeliveries.filter(d => d.status === 'COMPLETED').length;
    const earningsThisWeek = thisWeekDeliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);

    return NextResponse.json({
      totalDeliveries,
      totalEarnings,
      averageRating: averageRating || 0,
      activeDeliveries,
      completedThisWeek,
      earningsThisWeek,
    });
  } catch (error: any) {
    console.error('Erreur stats driver:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}