import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // HIGH SECURITY HEADERS
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Content-Security-Policy (CSP) - Allow common scripts, images, and fonts
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: blob: https://*.googleusercontent.com https://images.unsplash.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://lumberjack.razorpay.com; " +
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;"
  );

  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register' || request.nextUrl.pathname.startsWith('/api')) {
      return response;
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const secretStr = process.env.JWT_SECRET || 'skillspin_default_secret_key_2026';
    const secret = new TextEncoder().encode(secretStr);
    
    if (!process.env.JWT_SECRET) {
      console.warn('CRITICAL SECURITY WARNING: JWT_SECRET extension variable is not set! Using default salt!');
    }

    const { payload } = await jwtVerify(token, secret);
    
    // Check Admin rights
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return response;
  } catch (err) {
    const errorResponse = NextResponse.redirect(new URL('/login', request.url));
    errorResponse.cookies.delete('auth_token');
    return errorResponse;
  }
}

export const config = {
  matcher: ['/wallet/:path*', '/match-room/:path*', '/admin/:path*'],
};
