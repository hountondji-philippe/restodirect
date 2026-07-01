import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendEmail, generateInvitationEmail } from '@/lib/email';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { randomUUID } from 'crypto';

const inviteSchema = z.object({
  email: z.string().email('Email invalide').max(100),
  name: z.string().min(2, 'Nom trop court').max(100),
  phone: z.string().min(8, 'Telephone trop court').max(20),
  restaurantName: z.string().min(2, 'Nom du restaurant requis').max(100),
  city: z.string().min(2, 'Ville requise').max(50),
  country: z.string().min(2, 'Pays requis').max(50).default('Bénin'),
  cuisine: z.string().max(50).optional(),
  currency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`admin-invite-restaurant-${clientIp}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
    }

    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Erreur de validation',
        details: validation.error.issues.map(i => i.message),
      }, { status: 400 });
    }

    const { email, name, phone, restaurantName, city, country, cuisine, currency } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est deja utilise' }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        name: restaurantName,
        description: 'En attente de configuration',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        cuisine: cuisine || 'Non definie',
        address: 'A definir',
        city: city,
        country: country,
        phone: phone,
        currency: currency,
        deliveryTime: 'A definir',
        priceRange: '€€',
        isActive: false,
      },
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        type: 'RESTAURANT',
        restaurantId: restaurant.id,
        createdBy: (session.user as any).id,
        expiresAt,
      },
    });

    const emailData = generateInvitationEmail('RESTAURANT', token, restaurantName);
    const emailResult = await sendEmail({ to: email, subject: emailData.subject, html: emailData.html });

    if (!emailResult.success) {
      await prisma.invitation.delete({ where: { id: invitation.id } });
      await prisma.restaurant.delete({ where: { id: restaurant.id } });
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation envoyee a ${email}. Le proprietaire doit cliquer sur le lien pour definir son mot de passe.`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur invitation restaurant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}