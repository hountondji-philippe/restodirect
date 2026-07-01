import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;
    const body = await request.json();
    const { isAvailable } = body;

    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json({ error: 'Parametre invalide' }, { status: 400 });
    }

    // SÉCURITÉ : Vérifier que le restaurateur possède un restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    // SÉCURITÉ : Vérifier que le livreur est bien approuvé pour CE restaurant
    const driverApproval = await prisma.driverApproval.findFirst({
      where: {
        driverId: id,
        restaurantId: restaurant.id,
        status: 'APPROVED',
      },
    });

    if (!driverApproval) {
      return NextResponse.json({ error: 'Livreur non autorise pour ce restaurant' }, { status: 403 });
    }

    // Vérifier que le livreur existe
    const driver = await prisma.user.findUnique({
      where: { id },
    });

    if (!driver || driver.role !== 'LIVREUR') {
      return NextResponse.json({ error: 'Livreur non trouve' }, { status: 404 });
    }

    const updatedDriver = await prisma.user.update({
      where: { id },
      data: { isAvailable },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isAvailable: true,
        isApproved: true,
      },
    });

    return NextResponse.json(updatedDriver);
  } catch (error: any) {
    console.error('Erreur mise a jour livreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = params;

    // SÉCURITÉ : Vérifier que le restaurateur possède un restaurant
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    // SÉCURITÉ : Vérifier que le livreur est bien lié à CE restaurant
    const driverApproval = await prisma.driverApproval.findFirst({
      where: {
        driverId: id,
        restaurantId: restaurant.id,
      },
    });

    if (!driverApproval) {
      return NextResponse.json({ error: 'Livreur non autorise pour ce restaurant' }, { status: 403 });
    }

    // SÉCURITÉ : Supprimer uniquement l'approbation (pas le compte utilisateur)
    // Le livreur peut travailler pour d'autres restaurants
    await prisma.driverApproval.delete({
      where: { id: driverApproval.id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Livreur retire du restaurant avec succes' 
    });
  } catch (error: any) {
    console.error('Erreur suppression livreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}