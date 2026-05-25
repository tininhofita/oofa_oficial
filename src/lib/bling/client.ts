import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

const BLING_BASE = 'https://api.bling.com.br/Api/v3'

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/**
 * Realiza a renovação do Token OAuth do Bling usando o refresh_token.
 */
export async function tryRefreshToken(config: {
  id: string
  refresh_token: string
}): Promise<string | null> {
  const clientId = env.BLING_CLIENT_ID
  const clientSecret = env.BLING_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('[Bling Client] Credenciais client_id/secret ausentes para refresh.')
    return null
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const params = new URLSearchParams()
  params.append('grant_type', 'refresh_token')
  params.append('refresh_token', config.refresh_token)

  try {
    const res = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: '1.0',
      },
      body: params.toString(),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error(`[Bling Client] Erro na renovacao do token: ${res.status} - ${errorText}`)
      return null
    }

    const data = await res.json()
    if (!data?.access_token) return null

    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in ?? 21600))

    const supabase = (await createClient()) as any
    await supabase
      .from('integracao_bling')
      .update({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id)

    return data.access_token
  } catch (err) {
    console.error('[Bling Client] Excecao na renovacao do token:', err)
    return null
  }
}

/**
 * Obtem o token do Bling ativo e válido. Se estiver expirado, realiza o refresh automático.
 */
export async function obterTokenValido(): Promise<string> {
  const supabase = (await createClient()) as any
  const { data: config } = await supabase
    .from('integracao_bling')
    .select('id, access_token, refresh_token, expires_at')
    .limit(1)
    .maybeSingle()

  if (!config?.access_token) {
    throw new Error('Integracao com o Bling nao configurada ou sem token de acesso.')
  }

  const isExpired = config.expires_at && new Date(config.expires_at) <= new Date()

  if (isExpired) {
    if (!config.refresh_token) {
      throw new Error('Token expirado e sem refresh_token disponivel. Reconecte o Bling.')
    }
    const novoToken = await tryRefreshToken({ id: config.id, refresh_token: config.refresh_token })
    if (!novoToken) {
      throw new Error('Falha ao renovar o token do Bling. Reconecte a integracao.')
    }
    return novoToken
  }

  return config.access_token
}

/**
 * Realiza uma requisição GET na API V3 do Bling.
 */
export async function blingGet(path: string, token: string) {
  const url = path.startsWith('http') ? path : `${BLING_BASE}${path}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: '1.0',
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Erro Bling ${res.status}: ${body.slice(0, 300)}`)
  }

  return res.json().catch(() => null)
}

/**
 * Realiza requisição GET na API do Bling com Retry automático em caso de rate limiting (429).
 */
export async function blingGetWithRetry(path: string, token: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await blingGet(path, token)
    } catch (e: any) {
      if (attempt === retries - 1) throw e
      const delay = e.message.includes('429') ? 5000 : 2000
      await sleep(delay * (attempt + 1))
    }
  }
}
