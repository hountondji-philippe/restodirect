import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE - Supprimer une commande de l'historique du livreur
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== 'LIVREUR') {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const driverId = (session.user as any).id;
    const deliveryId = params.id;

    // Vérifier que la delivery appartient bien à ce livreur
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: { order: true },
    });

    if (!delivery) {
      return NextResponse.json({ error: 'Livraison non trouvee' }, { status: 404 });
    }

    if (delivery.driverId !== driverId) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    // Ne supprimer que si la livraison est terminée
    if (delivery.status !== 'DELIVERED' && delivery.status !== 'COMPLETED') {
      return NextResponse.json({ 
        error: 'Vous ne pouvez supprimer que les livraisons terminées' 
      }, { status: 400 });
    }

    // Supprimer la delivery (pas la commande, juste la relation livreur)
    await prisma.delivery.delete({
      where: { id: deliveryId },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Livraison supprimee de votre historique' 
    });
  } catch (error: any) {
    console.error('Erreur DELETE delivery:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}