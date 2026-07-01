import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const submitSchema = z.object({
  transactionId: z.string().min(4, 'ID de transaction invalide (min 4 caractères)').max(50),
  paymentProofUrl: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`momo-submit-${clientIp}`, {
      windowMs: 10 * 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 10 minutes.' }, { status: 429 });
    }

    const orderId = params.id;
    const body = await request.json();
    const validation = submitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'ID de transaction invalide',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const { transactionId, paymentProofUrl } = validation.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.paymentMethod !== 'MOBILE_MONEY') {
      return NextResponse.json({ error: 'Cette commande n\'est pas en Mobile Money' }, { status: 400 });
    }

    if (order.momoPaymentConfirmed) {
      return NextResponse.json({ error: 'Le paiement a déjà été confirmé' }, { status: 400 });
    }

    const updateData: any = {
      momoTransactionId: transactionId,
      paymentStatus: 'PENDING_VERIFICATION',
    };

    if (paymentProofUrl) {
      updateData.momoPaymentProof = paymentProofUrl;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    await prisma.deliveryNotification.create({
      data: {
        orderId,
        type: 'PAYMENT_SUBMITTED',
        message: `Le client a soumis l'ID de transaction ${transactionId} pour la commande #${order.orderNumber}`,
        sentTo: 'RESTAURANT',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ID de transaction enregistré. En attente de confirmation du restaurant.',
    });
  } catch (error: any) {
    console.error('Erreur PATCH momo client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}