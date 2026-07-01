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
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'RESTAURATEUR') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: userId },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant non trouve' }, { status: 404 });
    }

    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`invite-driver-${clientIp}`, {
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

    const { email, name, phone } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est deja utilise' }, { status: 400 });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        type: 'LIVREUR',
        restaurantId: restaurant.id,
        createdBy: userId,
        expiresAt,
      },
    });

    const emailData = generateInvitationEmail('LIVREUR', token, restaurant.name);
    const emailResult = await sendEmail({ to: email, subject: emailData.subject, html: emailData.html });

    if (!emailResult.success) {
      await prisma.invitation.delete({ where: { id: invitation.id } });
      return NextResponse.json({ error: 'Erreur envoi email' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation envoyee au livreur',
      invitationId: invitation.id,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur invitation livreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}