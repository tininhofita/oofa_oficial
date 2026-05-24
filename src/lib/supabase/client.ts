import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import type { Database } from '@/types/supabase'

/**
 * Cliente Supabase para uso em Client Components ('use client').
 * Nunca use este client em Server Components ou API Routes.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
