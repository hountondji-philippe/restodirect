import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail, generateOrderConfirmationEmail } from '@/lib/email';

const orderSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant requis'),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().min(1).max(20),
    price: z.number().min(0),
  })).min(1, 'Au moins un article requis'),
  deliveryAddress: z.string().min(5, 'Adresse de livraison requise'),
  city: z.string().min(2, 'Ville requise'),
  paymentMethod: z.enum(['CASH', 'MOBILE_MONEY']),
  paymentProvider: z.string().optional(),
  notes: z.string().optional(),
  userEmail: z.string().email('Email invalide'),
  userName: z.string().min(2, 'Nom requis'),
  userPhone: z.string().min(8, 'Téléphone requis'),
  deliveryFee: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      console.error('Validation error:', validation.error.issues);
      return NextResponse.json({
        error: 'Données invalides',
        details: validation.error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
      }, { status: 400 });
    }

    const {
      restaurantId,
      items,
      deliveryAddress,
      city,
      paymentMethod,
      paymentProvider,
      notes,
      userEmail,
      userName,
      userPhone,
      deliveryFee = 0,
    } = validation.data;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId, isActive: true },
      select: { id: true, name: true, currency: true },
    });

    if (!restaurant) {
      return NextResponse.json({
        error: 'Restaurant non trouvé ou inactif'
      }, { status: 404 });
    }

    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        restaurantId: restaurantId,
        isAvailable: true,
      },
    });

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json({
        error: 'Certains articles ne sont plus disponibles'
      }, { status: 400 });
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + deliveryFee;
    const orderNumber = `RD-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const userId = session?.user ? (session.user as any).id : null;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'PENDING',
        total,
        deliveryFee,
        paymentMethod,
        paymentStatus: paymentMethod === 'MOBILE_MONEY' ? 'PENDING_MOBILE_MONEY' : 'PENDING',
        paymentProvider: paymentProvider || null,
        deliveryAddress,
        city,
        notes: notes || null,
        userEmail,
        userName,
        userPhone,
        userId,
        restaurantId,
        items: {
          create: items.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
      },
    });

    await prisma.deliveryNotification.create({
      data: {
        orderId: order.id,
        type: 'NEW_ORDER',
        message: `Nouvelle commande #${order.orderNumber} reçue`,
        sentTo: 'RESTAURANT',
      },
    });

    if (userId) {
      await prisma.deliveryNotification.create({
        data: {
          orderId: order.id,
          type: 'ORDER_CONFIRMATION',
          message: `Votre commande #${order.orderNumber} a été reçue`,
          sentTo: 'CLIENT',
        },
      });
    }

    try {
      const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order/tracking/${orderNumber.replace('RD-', '')}`;
      const emailContent = generateOrderConfirmationEmail(orderNumber, trackingUrl);
      
      await sendEmail({
        to: userEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError);
    }

    return NextResponse.json({
      success: true,
      order,
      message: 'Commande créée avec succès',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erreur creation commande:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      message: error.message
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        restaurant: true,
        delivery: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Erreur GET orders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}