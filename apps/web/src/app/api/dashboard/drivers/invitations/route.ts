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
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    const invitations = await prisma.invitation.findMany({
      where: {
        restaurantId: restaurant.id,
        type: 'LIVREUR',
      },
      select: {
        id: true,
        email: true,
        token: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        usedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error('Erreur recuperation invitations:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}