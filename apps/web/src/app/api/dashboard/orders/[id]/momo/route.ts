import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const confirmSchema = z.object({
  action: z.enum(['confirm', 'reject']),
  reason: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const orderId = params.id;
    const body = await request.json();
    const validation = confirmSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { action, reason } = validation.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: { select: { ownerId: true, id: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    if (order.paymentMethod !== 'MOBILE_MONEY') {
      return NextResponse.json({ error: 'Cette commande n\'est pas en Mobile Money' }, { status: 400 });
    }

    if (action === 'confirm') {
      if (order.momoPaymentConfirmed) {
        return NextResponse.json({ error: 'Le paiement a déjà été confirmé' }, { status: 400 });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          momoPaymentConfirmed: true,
          momoConfirmedAt: new Date(),
          momoConfirmedBy: userId,
          paymentStatus: 'PAID',
        },
      });

      await prisma.deliveryNotification.create({
        data: {
          orderId,
          type: 'PAYMENT_CONFIRMED',
          message: `Paiement Mobile Money confirmé pour la commande #${order.orderNumber}`,
          sentTo: 'CLIENT',
        },
      });

      return NextResponse.json({ success: true, message: 'Paiement confirmé' });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          momoPaymentConfirmed: false,
          momoRejectedAt: new Date(),
          momoRejectionReason: reason || null,
          paymentStatus: 'REJECTED',
          status: 'CANCELLED',
        },
      });

      await prisma.deliveryNotification.create({
        data: {
          orderId,
          type: 'PAYMENT_REJECTED',
          message: `Paiement Mobile Money refusé pour la commande #${order.orderNumber}${reason ? ': ' + reason : ''}`,
          sentTo: 'CLIENT',
        },
      });

      return NextResponse.json({ success: true, message: 'Paiement refusé' });
    }
  } catch (error: any) {
    console.error('Erreur PATCH momo restaurateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}