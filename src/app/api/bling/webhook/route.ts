import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { verificarTokenWebhook, parsearEnvelopeBling } from '@/lib/bling/webhook'
import { processarEvento } from '@/lib/bling/processadores'
import type { Database, Json } from '@/types/supabase'

function criarClienteServiceRole() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function extrairBlingId(recurso: string, data: Record<string, unknown>): number | null {
  if (recurso === 'stock') {
    const produto = data.produto as Record<string, unknown> | undefined
    return typeof produto?.id === 'number' ? produto.id : null
  }
  return typeof data.id === 'number' ? data.id : null
}

export async function POST(request: Request) {
  if (!verificarTokenWebhook(request)) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  const parsed = parsearEnvelopeBling(body)

  if (!parsed) {
    return Response.json({ ok: true, ignorado: true })
  }

  const { envelope, recurso, acao } = parsed
  const supabase = criarClienteServiceRole()

  const { data: eventoSalvo, error: erroEvento } = await supabase
    .from('bling_eventos')
    .insert({
      recurso,
      acao,
      event_id: envelope.eventId || null,
      bling_id: extrairBlingId(recurso, envelope.data),
      payload: envelope as unknown as Json,
      status: 'recebido',
    })
    .select('id')
    .single()

  if (erroEvento || !eventoSalvo) {
    console.error('[Bling Webhook] Erro ao salvar evento bruto:', erroEvento?.message)
    return Response.json({ ok: false })
  }

  const resultado = await processarEvento(
    supabase,
    eventoSalvo.id,
    recurso,
    acao,
    envelope.data
  )

  const novoStatus = resultado.ok ? 'processado' : 'erro'
  await supabase
    .from('bling_eventos')
    .update({
      status: novoStatus,
      erro_mensagem: resultado.erro ?? null,
    })
    .eq('id', eventoSalvo.id)

  if (!resultado.ok) {
    console.error('[Bling Webhook] Erro ao processar evento:', resultado.erro)
  }

  return Response.json({ ok: true })
}
