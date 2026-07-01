import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// GET - Lister les demandes de livreurs (pour le restaurateur)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    if (userRole !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Role non autorise' }, { status: 403 });
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    const approvals = await prisma.driverApproval.findMany({
      where: { restaurantId: restaurant.id },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            rating: true,
            totalDeliveries: true,
            isApproved: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(approvals);
  } catch (error: any) {
    console.error('Erreur GET livreurs:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}

// POST - Inscription d'un livreur (crée une demande)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, password, restaurantId } = body;

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email deja utilise' }, { status: 400 });
    }

    // Hasher le mot de passe avec bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer le livreur (non approuvé par défaut)
    const driver = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        address,
        password: hashedPassword, // Mot de passe hashé
        role: 'LIVREUR',
        isApproved: false,
      },
    });

    // Créer une demande d'approbation
    if (restaurantId) {
      await prisma.driverApproval.create({
        data: {
          driverId: driver.id,
          restaurantId,
          status: 'PENDING',
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Inscription reussie. Votre compte sera valide par le restaurateur.',
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        role: driver.role,
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur creation livreur:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}