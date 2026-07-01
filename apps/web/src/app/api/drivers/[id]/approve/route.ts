import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Role non autorise' }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    const { id } = params;
    const body = await request.json();
    const { action, reason } = body; // action: 'approve' ou 'reject'

    const approval = await prisma.driverApproval.findUnique({
      where: { id },
      include: { driver: true },
    });

    if (!approval) {
      return NextResponse.json({ error: 'Demande non trouvee' }, { status: 404 });
    }

    if (approval.restaurantId !== restaurant.id) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    if (action === 'approve') {
      // Approuver le livreur
      await prisma.driverApproval.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });

      await prisma.user.update({
        where: { id: approval.driverId },
        data: {
          isApproved: true,
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, message: 'Livreur approuve' });
    } else if (action === 'reject') {
      // Rejeter le livreur
      await prisma.driverApproval.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          reason: reason || 'Non specifie',
        },
      });

      return NextResponse.json({ success: true, message: 'Livreur rejete' });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
  } catch (error: any) {
    console.error('Erreur validation livreur:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}