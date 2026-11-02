import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/host/login') {
    return NextResponse.next();
  }

  if (pathname === '/host' || pathname.startsWith('/host/')) {
    const cookie = request.cookies.get('host_session')?.value;
    if (!cookie) {
      return NextResponse.redirect(new URL('/host/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/host', '/host/:path*'],
};
