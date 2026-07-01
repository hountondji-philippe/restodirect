import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const restaurantId = params.id;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: {
        momoMTN: true,
        momoMTNName: true,
        momoMoov: true,
        momoMoovName: true,
        momoCeltiis: true,
        momoCeltiisName: true,
        momoInstructions: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouvé' }, { status: 404 });
    }

    return NextResponse.json(restaurant);
  } catch (error: any) {
    console.error('Erreur GET momo config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}