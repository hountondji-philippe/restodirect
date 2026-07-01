import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reviewSchema = z.object({
  restaurantRating: z.number().min(1).max(5),
  restaurantComment: z.string().max(500).optional(),
  driverRating: z.number().min(1).max(5).optional(),
  driverComment: z.string().max(500).optional(),
  userEmail: z.string().email().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json();
    const validation = reviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const { restaurantRating, restaurantComment, driverRating, driverComment, userEmail } = validation.data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        delivery: {
          include: {
            driver: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.status !== 'COMPLETED') {
      return NextResponse.json({
        error: 'La commande doit être complétée pour laisser un avis',
      }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    
    if (session?.user) {
      const userId = (session.user as any).id;
      if (order.userId !== userId) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    } else if (userEmail) {
      if (order.userEmail !== userEmail) {
        return NextResponse.json({ error: 'Email non valide pour cette commande' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const existingReview = await prisma.review.findUnique({
      where: { orderId },
    });

    if (existingReview) {
      return NextResponse.json({
        error: 'Un avis a déjà été laissé pour cette commande',
      }, { status: 400 });
    }

    let userId = order.userId;
    
    if (!userId) {
      const anonymousEmail = `anonymous_${order.id}@restodirect.local`;
      let anonymousUser = await prisma.user.findUnique({
        where: { email: anonymousEmail },
      });

      if (!anonymousUser) {
        anonymousUser = await prisma.user.create({
          data: {
            email: anonymousEmail,
            name: order.userName || 'Client anonyme',
            role: 'CLIENT',
          },
        });
      }

      userId = anonymousUser.id;
    }

    const review = await prisma.review.create({
      data: {
        orderId,
        userId,
        restaurantId: order.restaurantId,
        restaurantRating,
        restaurantComment: restaurantComment || null,
        driverId: order.delivery?.driverId || null,
        driverRating: driverRating || null,
        driverComment: driverComment || null,
      },
    });

    const restaurantReviews = await prisma.review.findMany({
      where: { restaurantId: order.restaurantId },
      select: { restaurantRating: true },
    });

    const avgRestaurantRating = restaurantReviews.reduce((sum, r) => sum + r.restaurantRating, 0) / restaurantReviews.length;

    await prisma.restaurant.update({
      where: { id: order.restaurantId },
      data: {
        rating: avgRestaurantRating,
        reviewCount: restaurantReviews.length,
      },
    });

    if (order.delivery?.driverId && driverRating) {
      const driverReviews = await prisma.review.findMany({
        where: { driverId: order.delivery.driverId },
        select: { driverRating: true },
      });

      const validDriverRatings = driverReviews.filter(r => r.driverRating !== null);
      const avgDriverRating = validDriverRatings.length > 0
        ? validDriverRatings.reduce((sum, r) => sum + (r.driverRating || 0), 0) / validDriverRatings.length
        : 0;

      await prisma.user.update({
        where: { id: order.delivery.driverId },
        data: {
          rating: avgDriverRating,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Avis enregistré avec succès',
      review,
    });
  } catch (error: any) {
    console.error('Erreur création avis:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}