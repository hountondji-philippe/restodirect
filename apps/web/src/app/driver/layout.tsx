import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Settings, LogOut, Truck, BarChart3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'LIVREUR') {
    redirect('/');
  }

  // Vérifier que le livreur est approuvé
  const driver = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { isApproved: true, name: true, email: true },
  });

  if (!driver?.isApproved) {
    redirect('/');
  }

  const userName = driver.name || 'L';
  const userEmail = driver.email || '';

  const menuItems = [
    { href: '/driver', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/driver/orders', label: 'Commandes', icon: ShoppingBag },
    { href: '/driver/stats', label: 'Statistiques', icon: BarChart3 },
    { href: '/driver/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Sidebar desktop */}
      <aside className="w-64 border-r border-border bg-background hidden md:flex flex-col fixed h-full">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-primary">RestoDirect</h2>
          <p className="text-xs text-muted-foreground mt-1">Espace Livreur</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">{userName[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <Link 
            href="/api/auth/signout" 
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded-md hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* Main Content avec marge pour la sidebar */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Header mobile */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:hidden sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-primary">RestoDirect</h2>
            <span className="text-xs text-muted-foreground">Livreur</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{userName[0]?.toUpperCase()}</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Bouton menu mobile */}
      <Link
        href="/driver"
        className="md:hidden fixed bottom-4 right-4 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-40 hover:bg-primary/90"
      >
        <Truck className="h-6 w-6" />
      </Link>
    </div>
  );
}