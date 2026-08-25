import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const usuarioId = request.cookies.get('usuario_id')?.value;
  const pathname = request.nextUrl.pathname;

  // Rotas públicas (não precisa login)
  const rotasPublicas = ['/', '/planos', '/login'];
  
  // Se não tem usuário e tá tentando acessar rota protegida
  if (!usuarioId && !rotasPublicas.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se tem usuário e tá na página de login, redireciona pra dashboard
  if (usuarioId && pathname.includes('/login')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
