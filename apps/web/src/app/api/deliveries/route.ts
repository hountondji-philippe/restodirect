import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Lister les commandes disponibles pour les livreurs
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // Si livreur, voir uniquement les commandes de SON restaurant
    if (userRole === 'LIVREUR') {
      // Trouver le restaurant auquel le livreur est associé
      const driverApproval = await prisma.driverApproval.findFirst({
        where: {
          driverId: userId,
          status: 'APPROVED',
        },
        select: {
          restaurantId: true,
        },
      });

      if (!driverApproval) {
        return NextResponse.json({ 
          error: 'Vous n\'êtes pas approuvé pour ce restaurant' 
        }, { status: 403 });
      }

      // Récupérer les commandes READY de CE restaurant uniquement
      // qui n'ont pas encore de livreur assigné
      const readyOrders = await prisma.order.findMany({
        where: {
          status: 'READY',
          restaurantId: driverApproval.restaurantId,
          delivery: null, // Pas encore de livreur assigné
        },
        include: {
          items: {
            include: { menuItem: true },
          },
          restaurant: {
            select: { name: true, address: true, phone: true },
          },
          user: {
            select: { name: true, phone: true, address: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      return NextResponse.json(readyOrders);
    }

    // Si restaurateur, voir les livraisons de son restaurant
    if (userRole === 'RESTAURATEUR') {
      const restaurant = await prisma.restaurant.findFirst({
        where: { ownerId: userId },
      });

      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
      }

      const deliveries = await prisma.delivery.findMany({
        where: { restaurantId: restaurant.id },
        include: {
          order: {
            include: {
              items: { include: { menuItem: true } },
              user: { select: { name: true, phone: true, address: true } },
            },
          },
          driver: {
            select: { name: true, phone: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(deliveries);
    }

    return NextResponse.json({ error: 'Role non autorise' }, { status: 403 });
  } catch (error: any) {
    console.error('Erreur GET livraisons:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

// POST - Un livreur prend une commande
export async function POST(request: Request) {
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

    const body = await request.json();
    const { orderId } = body;

    // Vérifier que le livreur est approuvé pour un restaurant
    const driverApproval = await prisma.driverApproval.findFirst({
      where: {
        driverId: userId,
        status: 'APPROVED',
      },
      select: {
        restaurantId: true,
      },
    });

    if (!driverApproval) {
      return NextResponse.json({ 
        error: 'Vous n\'êtes pas approuvé pour ce restaurant' 
      }, { status: 403 });
    }

    // Vérifier que la commande est prête, sans livreur, et du BON restaurant
    const order = await prisma.order.findUnique({
      where: { 
        id: orderId,
        restaurantId: driverApproval.restaurantId, // IMPORTANT: vérifier le restaurant
      },
      include: { delivery: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee ou non disponible' }, { status: 404 });
    }

    if (order.delivery) {
      return NextResponse.json({ error: 'Commande deja prise par un autre livreur' }, { status: 400 });
    }

    if (order.status !== 'READY') {
      return NextResponse.json({ error: 'Commande pas encore prete' }, { status: 400 });
    }

    // Créer la livraison
    const delivery = await prisma.delivery.create({
      data: {
        orderId: order.id,
        driverId: userId,
        restaurantId: order.restaurantId,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
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

    // Mettre à jour le statut de la commande
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERING' },
    });

    return NextResponse.json(delivery, { status: 201 });
  } catch (error: any) {
    console.error('Erreur prise livraison:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}