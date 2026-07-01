import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
    redirect('/');
  }

  const userName = session.user?.name || 'A';
  const userEmail = session.user?.email || '';

  return (
    <div className="min-h-screen bg-muted/40">
      <AdminSidebar userName={userName} userEmail={userEmail} />
      
      {/* Main Content avec marge pour la sidebar fixe */}
      <div className="md:ml-64 flex flex-col min-h-screen">
        {/* Header mobile */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:hidden sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary">RestoDirect</h2>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{userName[0]?.toUpperCase()}</span>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}