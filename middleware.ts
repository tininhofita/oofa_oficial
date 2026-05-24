import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from '@/constants/routes'

/**
 * Middleware de proteção de rotas via Supabase Auth.
 * - Rotas em (app)/ exigem autenticação → redireciona para /login
 * - Rota de login com sessão ativa → redireciona para /dashboard
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Atualiza a sessão (necessário para manter o cookie atualizado)
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isLoginPage = pathname === ROUTES.LOGIN
  const isApiRoute = pathname.startsWith('/api/')

  // Não proteger rotas de API (têm sua própria autenticação)
  if (isApiRoute) return response

  // Redireciona usuário não autenticado para o login
  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url))
  }

  // Redireciona usuário autenticado que tenta acessar o login
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
