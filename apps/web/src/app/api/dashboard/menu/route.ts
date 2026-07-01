import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const menuItemSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
  price: z.number().positive('Le prix doit être positif'),
  image: z.string().min(1, 'L\'image est requise'),
  category: z.string().min(2, 'La catégorie est requise'),
});

// POST - Ajouter un plat
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = (session.user as any).id;

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Aucun restaurant trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const validation = menuItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Erreur de validation',
        details: validation.error.issues 
      }, { status: 400 });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        ...validation.data,
        restaurantId: restaurant.id,
      },
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création plat:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

// PATCH - Modifier un plat
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    const validation = menuItemSchema.partial().safeParse(data);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Erreur de validation',
        details: validation.error.issues 
      }, { status: 400 });
    }

    // Vérifier que le plat appartient au restaurant du restaurateur
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!menuItem) {
      return NextResponse.json({ error: 'Plat non trouvé' }, { status: 404 });
    }

    if (menuItem.restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const updatedMenuItem = await prisma.menuItem.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json(updatedMenuItem);
  } catch (error: any) {
    console.error('Erreur modification plat:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

// DELETE - Supprimer un plat
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const menuItemId = searchParams.get('id');

    if (!menuItemId) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    // Vérifier que le plat appartient bien au restaurant du restaurateur
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: true },
    });

    if (!menuItem) {
      return NextResponse.json({ error: 'Plat non trouvé' }, { status: 404 });
    }

    if (menuItem.restaurant.ownerId !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur suppression plat:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}