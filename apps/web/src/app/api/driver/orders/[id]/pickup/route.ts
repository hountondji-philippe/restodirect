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

    if (delivery.status !== 'ACCEPTED') {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    const [updatedDelivery, updatedOrder] = await prisma.$transaction([
      prisma.delivery.update({
        where: { orderId },
        data: {
          status: 'PICKED_UP',
          pickedUpAt: new Date(),
        },
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERING' },
      }),
    ]);

    await prisma.deliveryNotification.create({
      data: {
        orderId,
        type: 'PICKED_UP',
        message: `Le livreur a recupere la commande ${delivery.order.orderNumber}`,
        sentTo: 'RESTAURANT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Commande marquee comme recuperee',
      delivery: updatedDelivery,
    });
  } catch (error: any) {
    console.error('Erreur pickup order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}