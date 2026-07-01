import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Récupérer l'historique des commandes du client
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Retourne TOUTES les commandes du client (y compris COMPLETED)
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { menuItem: true } },
        restaurant: { select: { name: true, currency: true } },
        delivery: {
          select: {
            id: true,
            status: true,
            deliveredAt: true,
            confirmedByClient: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Erreur GET historique:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une commande de l'historique
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'ID de commande requis' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    // Vérifier que c'est bien le propriétaire
    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    // Ne supprimer que si la commande est terminée
    if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
      return NextResponse.json({ 
        error: 'Vous ne pouvez supprimer que les commandes terminées ou annulées' 
      }, { status: 400 });
    }

    // Suppression en cascade
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId } }),
      prisma.deliveryNotification.deleteMany({ where: { orderId } }),
      prisma.delivery.deleteMany({ where: { orderId } }),
      prisma.order.delete({ where: { id: orderId } }),
    ]);

    return NextResponse.json({ success: true, message: 'Commande supprimee' });
  } catch (error: any) {
    console.error('Erreur DELETE historique:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}