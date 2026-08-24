import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const usuarioId = request.cookies.get('usuario_id')?.value;

  if (!usuarioId && !request.nextUrl.pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (usuarioId && request.nextUrl.pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
