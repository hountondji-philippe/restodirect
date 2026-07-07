import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('proof') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'L\'image ne doit pas dépasser 5Mo' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
    }

    // Convertir en base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Stocker en base de données
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        momoPaymentProof: dataUrl,
        momoPaymentConfirmed: false,
      },
    });

    return NextResponse.json({
      success: true,
      url: dataUrl,
      message: 'Capture uploadée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur upload payment proof:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { momoPaymentProof: true },
    });

    if (!order || !order.momoPaymentProof) {
      return NextResponse.json({ error: 'Preuve non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ url: order.momoPaymentProof });
  } catch (error: any) {
    console.error('Erreur GET payment proof:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}