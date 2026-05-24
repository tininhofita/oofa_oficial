import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'

/**
 * Página raiz — redireciona para o dashboard se autenticado,
 * ou para o login se não.
 */
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect(ROUTES.DASHBOARD)
  } else {
    redirect(ROUTES.LOGIN)
  }
}
