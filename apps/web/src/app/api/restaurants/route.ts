import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const q = searchParams.get('q') || '';
    const cuisine = searchParams.get('cuisine') || '';
    const city = searchParams.get('city') || '';
    const priceRange = searchParams.get('priceRange') || '';
    const sort = searchParams.get('sort') || 'popular';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: any = {
      isActive: true,
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { cuisine: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (cuisine) {
      where.cuisine = { contains: cuisine, mode: 'insensitive' };
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (priceRange) {
      where.priceRange = priceRange;
    }

    const orderBy: any = (() => {
      switch (sort) {
        case 'rating': return { rating: 'desc' };
        case 'name': return { name: 'asc' };
        case 'deliveryTime': return { deliveryTime: 'asc' };
        default: return { createdAt: 'desc' };
      }
    })();

    const skip = (page - 1) * limit;

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        include: {
          menuItems: {
            where: { isAvailable: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.restaurant.count({ where }),
    ]);

    return NextResponse.json({
      restaurants,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Erreur GET restaurants:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  }
}