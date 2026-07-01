import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'LIVREUR') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const driverId = (session.user as any).id;
    const orderId = params.id;

    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: { order: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery non trouvee' }, { status: 404 });
    }

    if (delivery.driverId !== driverId) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    if (delivery.status !== 'PICKED_UP') {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const [updatedDelivery, updatedOrder] = await prisma.$transaction([
      prisma.delivery.update({
        where: { orderId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
      }),
    ]);

    await prisma.deliveryNotification.create({
      data: {
        orderId,
        type: 'DELIVERED',
        message: `La commande ${delivery.order.orderNumber} a ete livree`,
        sentTo: 'RESTAURANT',
      },
    });

    await prisma.deliveryNotification.create({
      data: {
        orderId,
        type: 'DELIVERED',
        message: `Votre commande ${delivery.order.orderNumber} a ete livree. Veuillez confirmer la reception.`,
        sentTo: 'CLIENT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Commande marquee comme livree',
      delivery: updatedDelivery,
    });
  } catch (error: any) {
    console.error('Erreur deliver order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}