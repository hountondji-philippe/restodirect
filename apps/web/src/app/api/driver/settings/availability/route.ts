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

    if (userRole !== 'LIVREUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isAvailable: true,
        rating: true,
        totalDeliveries: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Récupérer les stats de livraisons récentes
    const recentDeliveries = await prisma.delivery.findMany({
      where: { 
        driverId: userId,
        status: 'COMPLETED'
      },
      orderBy: { deliveredAt: 'desc' },
      take: 10,
      select: {
        id: true,
        earnings: true,
        deliveredAt: true,
        order: {
          select: {
            orderNumber: true,
            total: true,
          }
        }
      }
    });

    // Calculer les gains totaux
    const totalEarnings = recentDeliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);

    return NextResponse.json({
      ...user,
      recentDeliveries,
      totalEarnings,
    });
  } catch (error: any) {
    console.error('Erreur GET availability:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'LIVREUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer le statut actuel
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAvailable: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier s'il y a des livraisons en cours
    const activeDeliveries = await prisma.delivery.findMany({
      where: {
        driverId: userId,
        status: {
          in: ['ACCEPTED', 'PICKED_UP', 'DELIVERING']
        }
      }
    });

    // Si le livreur veut se mettre indisponible mais a des livraisons en cours
    if (currentUser.isAvailable && activeDeliveries.length > 0) {
      return NextResponse.json({
        error: `Impossible de se rendre indisponible : vous avez ${activeDeliveries.length} livraison(s) en cours`,
        activeDeliveries: activeDeliveries.length
      }, { status: 400 });
    }

    // Toggle le statut
    const newAvailability = !currentUser.isAvailable;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isAvailable: newAvailability },
      select: {
        id: true,
        name: true,
        isAvailable: true,
      }
    });

    return NextResponse.json({
      success: true,
      isAvailable: updatedUser.isAvailable,
      message: newAvailability 
        ? 'Vous êtes maintenant disponible pour les livraisons' 
        : 'Vous êtes maintenant indisponible',
    });
  } catch (error: any) {
    console.error('Erreur PATCH availability:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}