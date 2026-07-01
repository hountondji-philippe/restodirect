import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    const cleanNumber = orderNumber.replace('#', '').trim();
    
    let order = await prisma.order.findUnique({
      where: { orderNumber: cleanNumber },
      include: {
        items: {
          include: { menuItem: true },
        },
        restaurant: {
          select: {
            name: true,
            phone: true,
            currency: true,
            momoMTN: true,
            momoMTNName: true,
            momoMoov: true,
            momoMoovName: true,
            momoCeltiis: true,
            momoCeltiisName: true,
            momoInstructions: true,
          },
        },
        user: {
          select: { name: true, email: true, phone: true },
        },
        delivery: true,
      },
    });

    if (!order && !cleanNumber.startsWith('RD-')) {
      order = await prisma.order.findUnique({
        where: { orderNumber: `RD-${cleanNumber}` },
        include: {
          items: {
            include: { menuItem: true },
          },
          restaurant: {
            select: {
              name: true,
              phone: true,
              currency: true,
              momoMTN: true,
              momoMTNName: true,
              momoMoov: true,
              momoMoovName: true,
              momoCeltiis: true,
              momoCeltiisName: true,
              momoInstructions: true,
            },
          },
          user: {
            select: { name: true, email: true, phone: true },
          },
          delivery: true,
        },
      });
    }

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      currency: order.restaurant?.currency || 'XOF',
    });
  } catch (error: any) {
    console.error('Erreur GET commande:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}