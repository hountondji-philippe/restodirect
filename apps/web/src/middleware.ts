import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ Routes 100% publiques (pas d'auth nécessaire)
  const publicPaths = [
    '/',
    '/search',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth',              // NextAuth endpoints
    '/api/restaurants',       // Liste publique des restaurants
    '/api/restaurants/',      // Détails d'un restaurant (avec ID)
    '/api/orders',            // Création de commande (POST)
    '/api/orders/track',      // Suivi de commande (public)
    '/partner',
    '/driver/register',
    '/driver/pending',
    '/restaurants',
    '/cart',
    '/checkout',
    '/order/confirmation',
    '/order/track',
    '/order/tracking',
    '/invite',
    '/_next',
    '/favicon.ico',
    '/logos',
    '/sounds',
    '/uploads',
  ];

  // Vérifier si la route est publique
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // ✅ Cas spécial : GET /api/orders (création de commande) est public
  // Mais POST /api/orders nécessite une session pour certains cas
  if (pathname === '/api/orders' && request.method === 'POST') {
    // Permettre la création de commande sans compte
    return NextResponse.next();
  }

  // ✅ Cas spécial : PATCH /api/orders/[id]/momo (soumission ID transaction)
  // Permettre au client de soumettre l'ID sans compte
  if (pathname.match(/^\/api\/orders\/[^\/]+\/momo$/) && request.method === 'PATCH') {
    return NextResponse.next();
  }

  // ✅ Cas spécial : POST /api/orders/[id]/review (avis client)
  if (pathname.match(/^\/api\/orders\/[^\/]+\/review$/) && request.method === 'POST') {
    return NextResponse.next();
  }

  if (isPublicPath) {
    return NextResponse.next();
  }

  // ✅ Vérifier le token JWT
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  if (!token) {
    // Si c'est une API, retourner 401 (pas de redirection)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Sinon, rediriger vers login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;

  // ✅ Protection APIs Dashboard (RESTAURATEUR uniquement)
  if (pathname.startsWith('/api/dashboard')) {
    if (userRole !== 'RESTAURATEUR') {
      return NextResponse.json(
        { error: 'Accès refusé - Rôle requis : RESTAURATEUR' },
        { status: 403 }
      );
    }
  }

  // ✅ Protection APIs Driver (LIVREUR uniquement)
  if (pathname.startsWith('/api/driver') || pathname.startsWith('/api/deliveries')) {
    if (userRole !== 'LIVREUR') {
      return NextResponse.json(
        { error: 'Accès refusé - Rôle requis : LIVREUR' },
        { status: 403 }
      );
    }
  }

  // ✅ Protection APIs Admin (SUPER_ADMIN uniquement)
  if (pathname.startsWith('/api/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé - Rôle requis : SUPER_ADMIN' },
        { status: 403 }
      );
    }
  }

  // ✅ Protection pages Admin
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ✅ Protection pages Dashboard (RESTAURATEUR uniquement)
  if (pathname.startsWith('/dashboard')) {
    if (userRole !== 'RESTAURATEUR') {
      if (userRole === 'LIVREUR') {
        return NextResponse.redirect(new URL('/driver/dashboard', request.url));
      } else if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ✅ Protection pages Livreur
  if (pathname.startsWith('/driver/dashboard') ||
      pathname.startsWith('/driver/orders') ||
      pathname.startsWith('/driver/stats') ||
      pathname.startsWith('/driver/settings')) {
    if (userRole !== 'LIVREUR') {
      if (userRole === 'RESTAURATEUR') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ✅ Protection pages Client
  if (pathname.startsWith('/profile') || pathname.startsWith('/account')) {
    if (userRole !== 'CLIENT') {
      if (userRole === 'RESTAURATEUR') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userRole === 'LIVREUR') {
        return NextResponse.redirect(new URL('/driver/dashboard', request.url));
      } else if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logos|sounds|uploads).*)',
  ],
};