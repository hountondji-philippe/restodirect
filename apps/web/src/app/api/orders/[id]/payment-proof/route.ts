import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

const MAGIC_BYTES: Record<string, string[]> = {
  'jpg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe8'],
  'jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe8'],
  'png': ['89504e47'],
  'gif': ['47494638'],
  'webp': ['52494646'],
};

function verifyMagicBytes(buffer: Buffer): string | null {
  const hex = buffer.slice(0, 4).toString('hex');
  for (const [ext, signatures] of Object.entries(MAGIC_BYTES)) {
    if (signatures.some(sig => hex.startsWith(sig))) {
      return ext;
    }
  }
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    if (order.paymentMethod !== 'MOBILE_MONEY') {
      return NextResponse.json({ error: 'Cette commande n\'est pas en Mobile Money' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('proof') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'L\'image ne doit pas dépasser 5Mo' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const detectedType = verifyMagicBytes(buffer);
    if (!detectedType) {
      return NextResponse.json({ error: 'Type de fichier non valide' }, { status: 400 });
    }

    // Chemin ABSOLU vers le dossier public
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'payment-proofs');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filename = `${randomUUID()}.${detectedType}`;
    const filepath = join(uploadDir, filename);
    const resolvedPath = resolve(filepath);
    const resolvedUploadDir = resolve(uploadDir);

    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
    }

    await writeFile(filepath, buffer);

    // URL relative pour Next.js
    const proofUrl = `/uploads/payment-proofs/${filename}`;

    await prisma.order.update({
      where: { id: orderId },
      data: { momoPaymentProof: proofUrl },
    });

    return NextResponse.json({
      success: true,
      url: proofUrl,
      message: 'Capture uploadée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur upload payment proof:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}