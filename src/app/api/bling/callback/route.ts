import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/integracoes/bling?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/integracoes/bling?error=Nenhum+codigo+de+autorizacao+fornecido', request.url)
    )
  }

  try {
    const clientId = env.BLING_CLIENT_ID
    const clientSecret = env.BLING_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('BLING_CLIENT_ID ou BLING_CLIENT_SECRET nao configurados no servidor.')
    }

    // 1. Converte Client ID e Client Secret em base64
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    // 2. Faz o POST para o Bling obter o Access Token
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('code', code)
    params.append('redirect_uri', `${env.NEXT_PUBLIC_APP_URL}/api/bling/callback`)

    const tokenResponse = await fetch('https://www.bling.com.br/Api/v3/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': '1.0',
      },
      body: params.toString(),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(
        `Erro ao gerar token do Bling: ${tokenData.error?.description || JSON.stringify(tokenData)}`
      )
    }

    // 3. Calcula o timestamp de expiração
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in ?? 21600))

    const supabase = (await createClient()) as any

    // 4. Busca a primeira linha na tabela integracao_bling
    const { data: existente } = await supabase
      .from('integracao_bling')
      .select('id')
      .limit(1)
      .maybeSingle()

    const payload = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (existente?.id) {
      const { error: errUpdate } = await supabase
        .from('integracao_bling')
        .update(payload)
        .eq('id', existente.id)
      if (errUpdate) throw errUpdate
    } else {
      const { error: errInsert } = await supabase
        .from('integracao_bling')
        .insert(payload)
      if (errInsert) throw errInsert
    }

    // 5. Redireciona com sucesso
    return NextResponse.redirect(
      new URL('/integracoes/bling?success=true', request.url)
    )

  } catch (err: any) {
    console.error('Erro no callback do Bling:', err)
    return NextResponse.redirect(
      new URL(`/integracoes/bling?error=${encodeURIComponent(err.message)}`, request.url)
    )
  }
}
