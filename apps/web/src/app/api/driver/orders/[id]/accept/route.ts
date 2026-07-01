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

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      select: { isAvailable: true, isApproved: true },
    });

    if (!driver?.isAvailable) {
      return NextResponse.json({ error: 'Vous etes hors ligne' }, { status: 400 });
    }

    if (!driver?.isApproved) {
      return NextResponse.json({ error: 'Compte non approuve' }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    if (order.status !== 'READY') {
      return NextResponse.json({ error: 'Commande non prete' }, { status: 400 });
    }

    const approval = await prisma.driverApproval.findUnique({
      where: {
        driverId_restaurantId: {
          driverId,
          restaurantId: order.restaurantId,
        },
      },
    });

    if (!approval || approval.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Non autorise pour ce restaurant' }, { status: 403 });
    }

    // LOCKING ATOMIQUE
    try {
      const delivery = await prisma.$transaction(async (tx) => {
        const existingDelivery = await tx.delivery.findUnique({
          where: { orderId },
        });

        if (existingDelivery) {
          throw new Error('Commande deja prise');
        }

        const newDelivery = await tx.delivery.create({
          data: {
            orderId,
            driverId,
            restaurantId: order.restaurantId,
            status: 'ACCEPTED',
            acceptedAt: new Date(),
            earnings: order.deliveryFee,
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: 'ASSIGNED' },
        });

        await tx.deliveryNotification.create({
          data: {
            orderId,
            type: 'DRIVER_ASSIGNED',
            message: `Un livreur a pris la commande ${order.orderNumber}`,
            sentTo: 'RESTAURANT',
          },
        });

        return newDelivery;
      });

      return NextResponse.json({
        success: true,
        message: 'Commande acceptee',
        delivery,
      });
    } catch (txError: any) {
      if (txError.message === 'Commande deja prise') {
        return NextResponse.json({ error: 'Cette commande a deja ete prise par un autre livreur' }, { status: 409 });
      }
      throw txError;
    }
  } catch (error: any) {
    console.error('Erreur accept order:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}