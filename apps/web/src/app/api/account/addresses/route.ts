import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const addressSchema = z.object({
  label: z.string().min(2, 'Le libellé est requis'),
  fullName: z.string().min(2, 'Le nom complet est requis'),
  phone: z.string().min(8, 'Le téléphone est requis'),
  address: z.string().min(5, 'L\'adresse est requise'),
  city: z.string().min(2, 'La ville est requise'),
  country: z.string().min(2, 'Le pays est requis'),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(addresses);
  } catch (error: any) {
    console.error('Erreur GET addresses:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const validation = addressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Erreur de validation',
        details: validation.error.issues 
      }, { status: 400 });
    }

    const { isDefault, ...data } = validation.data;

    // Si c'est l'adresse par défaut, désactiver les autres
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        ...data,
        isDefault: isDefault || false,
        userId,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST address:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}