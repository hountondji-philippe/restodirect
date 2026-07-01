import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import DashboardLayoutClient from '@/components/dashboard/dashboard-layout-client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'RESTAURATEUR') {
    redirect('/');
  }

  let restaurantName = 'Mon Restaurant';
  let restaurantActive = false;
  
  try {
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: (session.user as any).id },
      select: { name: true, isActive: true },
    });
    
    if (restaurant) {
      restaurantName = restaurant.name;
      restaurantActive = restaurant.isActive;
    }
  } catch (error) {
    console.error('Erreur récupération restaurant:', error);
  }

  const userName = session.user?.name || 'R';
  const userEmail = session.user?.email || '';

  return (
    <DashboardLayoutClient
      restaurantName={restaurantName}
      restaurantActive={restaurantActive}
      userName={userName}
      userEmail={userEmail}
    >
      {children}
    </DashboardLayoutClient>
  );
}