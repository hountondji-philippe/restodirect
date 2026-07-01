import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const activateSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100),
  phone: z.string().min(8, 'Telephone trop court').max(20),
  password: z.string().min(6, 'Mot de passe trop court').max(100),
});

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { restaurant: { select: { name: true } } },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 404 });
    }

    if (invitation.status === 'USED') {
      return NextResponse.json({ error: 'Ce lien a deja ete utilise' }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Ce lien a expire' }, { status: 400 });
    }

    return NextResponse.json({
      email: invitation.email,
      type: invitation.type,
      restaurantName: invitation.restaurant?.name || null,
    });
  } catch (error: any) {
    console.error('Erreur verification token:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`activate-${clientIp}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
    }

    const { token } = params;
    
    const invitation = await prisma.invitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 404 });
    }

    if (invitation.status === 'USED') {
      return NextResponse.json({ error: 'Ce lien a deja ete utilise' }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Ce lien a expire' }, { status: 400 });
    }

    const body = await request.json();
    const validation = activateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Erreur de validation',
        details: validation.error.issues.map(i => i.message),
      }, { status: 400 });
    }

    const { name, phone, password } = validation.data;
    const hashedPassword = await bcrypt.hash(password, 12);

    // Vérifier si un compte existe déjà avec cet email
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    let user;

    if (existingUser) {
      // SÉCURITÉ : Vérifier que le compte n'a pas déjà de mot de passe
      if (existingUser.password !== null) {
        return NextResponse.json({ 
          error: 'Ce compte a deja un mot de passe. Utilisez la page de connexion.' 
        }, { status: 400 });
      }

      // SÉCURITÉ : Vérifier que le token correspond bien au compte
      if (invitation.createdBy !== existingUser.id) {
        return NextResponse.json({ 
          error: 'Token ne correspond pas au compte' 
        }, { status: 403 });
      }

      // Mettre à jour le compte existant
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          phone,
          password: hashedPassword,
        },
      });

      // Si c'est un livreur, vérifier que l'approbation existe
      if (invitation.type === 'LIVREUR' && invitation.restaurantId) {
        const existingApproval = await prisma.driverApproval.findUnique({
          where: {
            driverId_restaurantId: {
              driverId: existingUser.id,
              restaurantId: invitation.restaurantId,
            },
          },
        });

        if (!existingApproval) {
          await prisma.driverApproval.create({
            data: {
              driverId: existingUser.id,
              restaurantId: invitation.restaurantId,
              status: 'APPROVED',
              approvedAt: new Date(),
            },
          });
        }
      }
    } else {
      // Créer un nouveau compte
      if (invitation.type === 'LIVREUR') {
        user = await prisma.user.create({
          data: {
            name,
            email: invitation.email,
            password: hashedPassword,
            phone,
            role: 'LIVREUR',
            isApproved: true,
            isAvailable: true,
          },
        });

        if (invitation.restaurantId) {
          await prisma.driverApproval.create({
            data: {
              driverId: user.id,
              restaurantId: invitation.restaurantId,
              status: 'APPROVED',
              approvedAt: new Date(),
            },
          });
        }
      } else if (invitation.type === 'RESTAURANT') {
        user = await prisma.user.create({
          data: {
            name,
            email: invitation.email,
            password: hashedPassword,
            phone,
            role: 'RESTAURATEUR',
            isApproved: true,
          },
        });

        if (invitation.restaurantId) {
          await prisma.restaurant.update({
            where: { id: invitation.restaurantId },
            data: { ownerId: user.id, phone: phone, isActive: true },
          });
        }
      } else {
        return NextResponse.json({ error: 'Type d\'invitation invalide' }, { status: 400 });
      }
    }

    // Marquer le token comme utilisé
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'USED', usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: 'Compte cree avec succes',
      userId: user.id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur activation compte:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}