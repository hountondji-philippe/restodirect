import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const momoSchema = z.object({
  momoMTN: z.string().regex(/^[0-9]{8}$/, 'Numéro MTN invalide (8 chiffres)').optional().nullable(),
  momoMTNName: z.string().min(2).max(100).optional().nullable(),
  momoMoov: z.string().regex(/^[0-9]{8}$/, 'Numéro Moov invalide (8 chiffres)').optional().nullable(),
  momoMoovName: z.string().min(2).max(100).optional().nullable(),
  momoCeltiis: z.string().regex(/^[0-9]{8}$/, 'Numéro Celtiis invalide (8 chiffres)').optional().nullable(),
  momoCeltiisName: z.string().min(2).max(100).optional().nullable(),
  momoInstructions: z.string().max(500).optional().nullable(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
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
    console.error('Erreur GET momo:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const validation = momoSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouvé' }, { status: 404 });
    }

    const updated = await prisma.restaurant.update({
      where: { id: restaurant.id },
      data: validation.data,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuration Mobile Money enregistrée',
      data: updated,
    });
  } catch (error: any) {
    console.error('Erreur PUT momo:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}