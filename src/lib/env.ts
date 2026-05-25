/**
 * Validação de variáveis de ambiente
 * Sempre importe daqui — nunca use process.env diretamente no código.
 * O sistema não deve subir se uma variável obrigatória estiver faltando.
 */

function getEnvVar(key: string, valorEstatico?: string): string {
  const value = valorEstatico || process.env[key]
  if (!value) {
    throw new Error(
      `[Oofa] Variável de ambiente obrigatória não definida: ${key}\n` +
      `Copie .env.example para .env.local e preencha os valores.`
    )
  }
  return value
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL:      getEnvVar('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  CRON_SECRET:                   process.env.CRON_SECRET ?? '',
  BLING_CLIENT_ID:               process.env.BLING_CLIENT_ID ?? '',
  BLING_CLIENT_SECRET:           process.env.BLING_CLIENT_SECRET ?? '',
  BLING_WEBHOOK_SECRET:          process.env.BLING_WEBHOOK_SECRET ?? '',
  NUVEMSHOP_CLIENT_ID:           process.env.NUVEMSHOP_CLIENT_ID ?? '',
  NUVEMSHOP_CLIENT_SECRET:       process.env.NUVEMSHOP_CLIENT_SECRET ?? '',
  NUVEMSHOP_WEBHOOK_SECRET:      process.env.NUVEMSHOP_WEBHOOK_SECRET ?? '',
  NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const
