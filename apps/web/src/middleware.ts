import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/api/auth',
    '/api/restaurants',
    '/api/restaurants/',
    '/api/orders/track',
    '/partner',
    '/driver/register',
    '/driver/pending',
    '/_next',
    '/favicon.ico',
    '/logos',
    '/sounds',
    '/uploads',
  ];

  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

  // Pages publiques accessibles sans auth
  if (pathname === '/' || pathname === '/search' || pathname === '/restaurants' || 
      pathname === '/cart' || pathname === '/checkout' || pathname === '/order/confirmation' || 
      pathname === '/order/track' || pathname === '/order/tracking' || pathname === '/invite') {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      cookieName: 'next-auth.session-token',
    });

    // Si utilisateur connecté sur page publique, rediriger vers son espace
    if (token && pathname === '/') {
      const userRole = token.role as string;

      if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (userRole === 'RESTAURATEUR') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userRole === 'LIVREUR') {
        return NextResponse.redirect(new URL('/driver/dashboard', request.url));
      }
    }

    return NextResponse.next();
  }

  // API routes publiques
  if (pathname === '/api/orders' && request.method === 'POST') {
    return NextResponse.next();
  }

  if (pathname.match(/^\/api\/orders\/[^\/]+\/momo$/) && request.method === 'PATCH') {
    return NextResponse.next();
  }

  if (pathname.match(/^\/api\/orders\/[^\/]+\/review$/) && request.method === 'POST') {
    return NextResponse.next();
  }

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Vérifier le token pour les routes protégées
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: 'next-auth.session-token',
  });

  // Si pas de token, rediriger vers login
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = token.role as string;

  console.log('DEBUG MIDDLEWARE →', pathname, '| role:', userRole, '| token présent:', !!token);

  // Protection APIs Dashboard (RESTAURATEUR uniquement)
  if (pathname.startsWith('/api/dashboard')) {
    if (userRole !== 'RESTAURATEUR') {
      return NextResponse.json(
        { error: 'Accès refusé - Rôle requis : RESTAURATEUR' },
        { status: 403 }
      );
    }
  }

  // Protection APIs Driver (LIVREUR uniquement)
  if (pathname.startsWith('/api/driver') || pathname.startsWith('/api/deliveries')) {
    if (userRole !== 'LIVREUR') {
      return NextResponse.json(
        { error: 'Accès refusé - Rôle requis : LIVREUR' },
        { status: 403 }
      );
    }
  }

  // Protection APIs Admin (SUPER_ADMIN uniquement)
  if (pathname.startsWith('/api/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Accès refusé - Rôle requis : SUPER_ADMIN' },
        { status: 403 }
      );
    }
  }

  // Protection pages Admin
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Protection pages Dashboard (RESTAURATEUR uniquement)
  if (pathname.startsWith('/dashboard')) {
    if (userRole !== 'RESTAURATEUR') {
      if (userRole === 'LIVREUR') {
        return NextResponse.redirect(new URL('/driver/dashboard', request.url));
      } else if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Protection pages Livreur
  if (pathname.startsWith('/driver/dashboard') ||
      pathname.startsWith('/driver/orders') ||
      pathname.startsWith('/driver/stats') ||
      pathname.startsWith('/driver/settings') ||
      pathname === '/driver') {
    if (userRole !== 'LIVREUR') {
      if (userRole === 'RESTAURATEUR') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Protection pages Client
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