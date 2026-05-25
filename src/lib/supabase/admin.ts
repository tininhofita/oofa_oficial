import { createClient as criarClienteSupabase } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/supabase'

/**
 * Cria um cliente Supabase com privilégios de Admin (Service Role).
 * ATENÇÃO: Nunca importe ou utilize esta função no lado do cliente (Client Components).
 * Ela deve ser usada exclusivamente em Server Actions ou API Routes do lado do servidor.
 */
export function criarClienteAdmin() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[Oofa Admin] Variável SUPABASE_SERVICE_ROLE_KEY não definida nas variáveis de ambiente.')
  }

  return criarClienteSupabase<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
