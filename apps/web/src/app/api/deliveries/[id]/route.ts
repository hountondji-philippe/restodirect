import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH - Mettre a jour le statut de livraison
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== 'LIVREUR') {
      return NextResponse.json({ error: 'Role non autorise' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison non trouvee' }, { status: 404 });
    }

    if (delivery.driverId !== userId) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const updateData: any = { status };

    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      // Mettre a jour la commande aussi
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: { status: 'DELIVERED' },
      });
    }

    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        driver: { select: { name: true, phone: true } },
        order: {
          include: {
            items: { include: { menuItem: true } },
            restaurant: { select: { name: true, address: true } },
            user: { select: { name: true, phone: true, address: true } },
          },
        },
      },
    });

    return NextResponse.json(updatedDelivery);
  } catch (error: any) {
    console.error('Erreur mise a jour livraison:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

// GET - Recuperer une livraison specifique
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        driver: { select: { name: true, phone: true } },
        order: {
          include: {
            items: { include: { menuItem: true } },
            restaurant: { select: { name: true, address: true, phone: true } },
            user: { select: { name: true, phone: true, address: true } },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison non trouvee' }, { status: 404 });
    }

    return NextResponse.json(delivery);
  } catch (error: any) {
    console.error('Erreur GET livraison:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}