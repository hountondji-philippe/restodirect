import type { Metadata } from 'next';
import '../styles/globals.css';
import { PublicShell } from '@/components/layout/public-shell';
import { AuthProvider } from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: 'RestoDirect',
  description: 'Plateforme de reservation et commande en ligne',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col bg-background">
        <AuthProvider>
          <PublicShell>
            {children}
          </PublicShell>
        </AuthProvider>
      </body>
    </html>
  );
}