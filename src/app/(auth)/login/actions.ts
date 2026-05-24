'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'

interface LoginState {
  error: string | null
}

/**
 * Server Action de autenticação.
 * Chamada pelo LoginForm via useActionState — nunca diretamente.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email    = (formData.get('email')    as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)

  if (!email || !password) {
    return { error: 'Preencha o e-mail e a senha.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Mensagem genérica por segurança (não revela se o e-mail existe)
    return { error: 'E-mail ou senha incorretos. Verifique e tente novamente.' }
  }

  redirect(ROUTES.DASHBOARD)
}
