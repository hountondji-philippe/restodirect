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

    // Vérifier que c'est le Super Admin
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const restaurantId = params.id;

    // Vérifier que le restaurant existe
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { owner: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    // Suppression en cascade sécurisée
    // 1. Supprimer les OrderItems liés aux orders du restaurant
    await prisma.orderItem.deleteMany({
      where: {
        order: {
          restaurantId: restaurantId,
        },
      },
    });

    // 2. Supprimer les Deliveries du restaurant
    await prisma.delivery.deleteMany({
      where: { restaurantId: restaurantId },
    });

    // 3. Supprimer les Orders du restaurant
    await prisma.order.deleteMany({
      where: { restaurantId: restaurantId },
    });

    // 4. Supprimer les Reviews du restaurant
    await prisma.review.deleteMany({
      where: { restaurantId: restaurantId },
    });

    // 5. Supprimer les DriverApprovals (cascade déjà configuré)
    // 6. Supprimer les Invitations (cascade déjà configuré)
    // 7. Supprimer les MenuItems (cascade déjà configuré)
    await prisma.invitation.deleteMany({
      where: { restaurantId: restaurantId },
    });

    await prisma.driverApproval.deleteMany({
      where: { restaurantId: restaurantId },
    });

    // 8. Enfin supprimer le restaurant
    await prisma.restaurant.delete({
      where: { id: restaurantId },
    });

    // 9. Supprimer le compte propriétaire associé (optionnel mais recommandé)
    if (restaurant.ownerId) {
      await prisma.user.delete({
        where: { id: restaurant.ownerId },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Restaurant "${restaurant.name}" supprime avec succes`,
    });
  } catch (error: any) {
    console.error('Erreur suppression restaurant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}