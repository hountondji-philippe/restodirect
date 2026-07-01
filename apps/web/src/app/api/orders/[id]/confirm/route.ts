import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { delivery: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'La commande n\'est pas encore livrée' }, { status: 400 });
    }

    if (order.confirmedAt) {
      return NextResponse.json({ error: 'Commande déjà confirmée' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      const userId = (session.user as any).id;
      const userRole = (session.user as any).role;
      
      if (order.userId && order.userId !== userId && userRole !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }

    if (!order.delivery) {
      return NextResponse.json({ error: 'Pas de livraison associée' }, { status: 400 });
    }

    const [updatedOrder, updatedDelivery] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          confirmedAt: new Date(),
        },
      }),
      prisma.delivery.update({
        where: { orderId },
        data: {
          status: 'COMPLETED',
          confirmedByClient: true,
        },
      }),
    ]);

    await prisma.user.update({
      where: { id: order.delivery.driverId },
      data: {
        totalDeliveries: { increment: 1 },
      },
    });

    await prisma.deliveryNotification.create({
      data: {
        orderId,
        type: 'CONFIRMED',
        message: `Le client a confirmé la réception de la commande ${order.orderNumber}`,
        sentTo: 'RESTAURANT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Commande confirmée avec succès',
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error('Erreur confirm order:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}