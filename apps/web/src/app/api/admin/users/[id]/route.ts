import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = params.id;

    // Empêcher la suppression du Super Admin lui-même
    if (userId === (session.user as any).id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouve' }, { status: 404 });
    }

    // Empêcher la suppression d'autres Super Admin
    if (user.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Impossible de supprimer un Super Admin' }, { status: 400 });
    }

    // Suppression en cascade
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    
    // Supprimer les restaurants si c'est un restaurateur
    if (user.role === 'RESTAURATEUR') {
      const restaurants = await prisma.restaurant.findMany({ where: { ownerId: userId } });
      for (const restaurant of restaurants) {
        await prisma.orderItem.deleteMany({
          where: { order: { restaurantId: restaurant.id } },
        });
        await prisma.delivery.deleteMany({ where: { restaurantId: restaurant.id } });
        await prisma.review.deleteMany({ where: { restaurantId: restaurant.id } });
        await prisma.invitation.deleteMany({ where: { restaurantId: restaurant.id } });
        await prisma.driverApproval.deleteMany({ where: { restaurantId: restaurant.id } });
      }
      await prisma.restaurant.deleteMany({ where: { ownerId: userId } });
    }

    // Supprimer les orders si c'est un client
    if (user.role === 'CLIENT') {
      await prisma.orderItem.deleteMany({
        where: { order: { userId } },
      });
      await prisma.order.deleteMany({ where: { userId } });
    }

    // Supprimer les reviews
    await prisma.review.deleteMany({ where: { userId } });

    // Enfin supprimer l'utilisateur
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: `Utilisateur "${user.name || user.email}" supprime avec succes`,
    });
  } catch (error: any) {
    console.error('Erreur suppression utilisateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}