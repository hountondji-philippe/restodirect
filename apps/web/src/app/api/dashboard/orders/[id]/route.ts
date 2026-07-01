import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY',
    'ASSIGNED',
    'DELIVERING',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
  ]),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
        items: {
          include: {
            menuItem: true,
          },
        },
        delivery: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Erreur GET dashboard order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const { status } = validation.data;
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'CONFIRMED' && { confirmedAt: new Date() }),
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Erreur PATCH dashboard order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    if (userRole !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const orderId = params.id;

    console.log(`[DELETE] Tentative de suppression commande: ${orderId} par user: ${userId}`);

    // Vérifier que la commande existe et appartient au restaurateur
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: {
          select: { ownerId: true },
        },
        items: true,
        delivery: true,
      },
    });

    if (!order) {
      console.log(`[DELETE] Commande ${orderId} non trouvée`);
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.restaurant.ownerId !== userId) {
      console.log(`[DELETE] Refusé: user ${userId} n'est pas propriétaire du restaurant`);
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // ✅ SÉCURITÉ : Permettre la suppression de TOUTES les commandes SAUF celles en cours de livraison
    // Statuts autorisés : PENDING, CONFIRMED, PREPARING, READY, DELIVERED, COMPLETED, CANCELLED
    // Statuts interdits : ASSIGNED, DELIVERING, AUTO_CONFIRMED (impliquent un livreur actif)
    const forbiddenStatuses = ['ASSIGNED', 'DELIVERING', 'AUTO_CONFIRMED'];
    
    if (forbiddenStatuses.includes(order.status)) {
      console.log(`[DELETE] Refusé: statut ${order.status} ne peut pas être supprimé`);
      return NextResponse.json({
        error: 'Impossible de supprimer une commande en cours de livraison ou déjà confirmée automatiquement',
      }, { status: 400 });
    }

    console.log(`[DELETE] Statut ${order.status} autorisé pour suppression`);

    // Supprimer dans l'ordre correct pour éviter les violations de contrainte
    try {
      // 1. Supprimer les reviews associées
      await prisma.review.deleteMany({
        where: { orderId },
      });

      // 2. Supprimer les notifications de livraison
      await prisma.deliveryNotification.deleteMany({
        where: { orderId },
      });

      // 3. Supprimer la livraison si elle existe
      if (order.delivery) {
        await prisma.delivery.delete({
          where: { orderId },
        });
      }

      // 4. Supprimer les items de la commande
      await prisma.orderItem.deleteMany({
        where: { orderId },
      });

      // 5. Supprimer la commande elle-même
      await prisma.order.delete({
        where: { id: orderId },
      });

      console.log(`[DELETE] ✅ Commande ${orderId} supprimée avec succès`);

      return NextResponse.json({
        success: true,
        message: 'Commande supprimée avec succès',
      });
    } catch (dbError: any) {
      console.error(`[DELETE] Erreur base de données:`, dbError);
      return NextResponse.json({
        error: 'Erreur lors de la suppression',
        message: dbError.message,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erreur DELETE dashboard order:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      message: error.message 
    }, { status: 500 });
  }
}