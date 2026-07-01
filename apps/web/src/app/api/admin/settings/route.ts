import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

const updateSettingsSchema = z.object({
  platformName: z.string().min(2, 'Nom requis').max(100).optional(),
  platformVersion: z.string().max(20).optional(),
  environment: z.enum(['development', 'production', 'staging']).optional(),
  emailProvider: z.enum(['resend', 'gmail', 'smtp']).optional(),
  emailMode: z.enum(['sandbox', 'production']).optional(),
  emailFrom: z.string().email('Email invalide').optional(),
  databaseType: z.string().max(50).optional(),
  databaseFile: z.string().max(100).optional(),
  ormVersion: z.string().max(50).optional(),
  authProvider: z.string().max(50).optional(),
  hashAlgorithm: z.string().max(50).optional(),
  rateLimitingEnabled: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const settings = await prisma.platformSettings.findFirst();

    if (!settings) {
      return NextResponse.json({
        platformName: 'RestoDirect',
        platformVersion: '1.0.0',
        environment: 'production',
        emailProvider: 'gmail',
        emailMode: 'production',
        emailFrom: process.env.EMAIL_USER || 'noreply@restodirect.com',
        databaseType: 'PostgreSQL',
        databaseFile: 'Neon',
        ormVersion: 'Prisma 5.22.0',
        authProvider: 'NextAuth.js',
        hashAlgorithm: 'bcrypt (12 rounds)',
        rateLimitingEnabled: true,
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Erreur GET settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const clientIp = getClientIp(request);
    const rateLimitResult = rateLimit(`admin-settings-${clientIp}`, {
      windowMs: 60 * 60 * 1000,
      maxRequests: 10,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Trop de tentatives' }, { status: 429 });
    }

    const body = await request.json();
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Erreur de validation',
        details: validation.error.issues,
      }, { status: 400 });
    }

    const settingsData = validation.data;

    const existingSettings = await prisma.platformSettings.findFirst();

    let updatedSettings;

    if (existingSettings) {
      updatedSettings = await prisma.platformSettings.update({
        where: { id: existingSettings.id },
        data: settingsData,
      });
    } else {
      updatedSettings = await prisma.platformSettings.create({
        data: settingsData,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Erreur PATCH settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}