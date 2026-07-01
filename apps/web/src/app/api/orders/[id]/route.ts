import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERING', 'DELIVERED', 'CANCELLED', 'ASSIGNED']),
});

// PATCH - Mettre à jour le statut d'une commande
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const { status } = validation.data;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    // Vérifier les permissions
    if (userRole === 'RESTAURATEUR' && order.restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: { menuItem: true },
        },
        restaurant: {
          select: { name: true, currency: true },
        },
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error('Erreur mise à jour commande:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

// GET - Récupérer une commande spécifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { menuItem: true },
        },
        restaurant: {
          select: { name: true, phone: true, currency: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Erreur GET commande:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer une commande
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE commande:', params.id);
    
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('❌ Non authentifié');
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const { id } = params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    console.log('👤 User:', { userId, userRole });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!order) {
      console.log(' Commande non trouvée');
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    console.log(' Commande trouvée:', order.orderNumber);

    // Vérifier les permissions
    if (userRole === 'RESTAURATEUR' && order.restaurant.ownerId !== userId) {
      console.log(' Pas le propriétaire');
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    // Supprimer les orderItems d'abord
    await prisma.orderItem.deleteMany({
      where: { orderId: id },
    });

    // Supprimer la delivery si elle existe
    await prisma.delivery.deleteMany({
      where: { orderId: id },
    });

    // Supprimer les notifications
    await prisma.deliveryNotification.deleteMany({
      where: { orderId: id },
    });

    // Supprimer la commande
    await prisma.order.delete({
      where: { id },
    });

    console.log(' Commande supprimée avec succès');

    return NextResponse.json({ 
      success: true, 
      message: 'Commande supprimee avec succes' 
    });
  } catch (error: any) {
    console.error(' Erreur suppression commande:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      message: error.message 
    }, { status: 500 });
  }
}