import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename, resolve } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

// ✅ Magic bytes pour vérifier le vrai type de fichier
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // ✅ Vérifier la taille (5Mo max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'L\'image ne doit pas dépasser 5Mo' }, { status: 400 });
    }

    // ✅ Vérifier le type MIME déclaré
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
    }

    // ✅ Lire le fichier pour vérifier le contenu réel
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ Vérifier les magic bytes (contenu réel)
    const detectedType = verifyMagicBytes(buffer);
    if (!detectedType) {
      return NextResponse.json({ 
        error: 'Type de fichier non valide ou corrompu' 
      }, { status: 400 });
    }

    // ✅ Extensions autorisées
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!allowedExtensions.includes(detectedType)) {
      return NextResponse.json({ error: 'Extension non autorisée' }, { status: 400 });
    }

    // ✅ Créer le dossier uploads s'il n'existe pas
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'menu');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ✅ Générer un nom unique avec UUID
    const filename = `${randomUUID()}.${detectedType}`;
    
    // ✅ Construire le chemin et vérifier qu'il reste dans uploadDir
    const filepath = join(uploadDir, filename);
    const resolvedPath = resolve(filepath);
    const resolvedUploadDir = resolve(uploadDir);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      return NextResponse.json({ error: 'Chemin invalide' }, { status: 400 });
    }

    // ✅ Écrire le fichier
    await writeFile(filepath, buffer);

    // ✅ Retourner l'URL publique
    const url = `/uploads/menu/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      message: 'Image uploadée avec succès',
    });
  } catch (error: any) {
    console.error('Erreur upload:', error);
    return NextResponse.json({ error: 'Erreur serveur', message: error.message }, { status: 500 });
  }
}