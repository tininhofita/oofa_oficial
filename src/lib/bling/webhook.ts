import { env } from '@/lib/env'
import { extrairRecurso } from './types'
import type { BlingWebhookEnvelope, RecursoBling } from './types'

export function verificarTokenWebhook(request: Request): boolean {
  const secret = env.BLING_WEBHOOK_SECRET
  if (!secret) return false

  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) return false

  return token === secret
}

export interface EnvelopeParsed {
  envelope: BlingWebhookEnvelope
  recurso: RecursoBling
  acao: string   // "updated" | "created" | "deleted" | "issued"
}

export function parsearEnvelopeBling(body: unknown): EnvelopeParsed | null {
  if (typeof body !== 'object' || body === null) return null

  const b = body as Record<string, unknown>

  if (typeof b.event !== 'string' || typeof b.data !== 'object' || b.data === null) {
    return null
  }

  const recurso = extrairRecurso(b.event)
  if (!recurso) return null

  const partes = b.event.split('.')
  if (partes.length < 2) return null
  const acao = partes[1]

  const envelope: BlingWebhookEnvelope = {
    eventId: typeof b.eventId === 'string' ? b.eventId : '',
    date: typeof b.date === 'string' ? b.date : new Date().toISOString(),
    version: typeof b.version === 'number' ? b.version : 1,
    event: b.event,
    companyId: typeof b.companyId === 'number' ? b.companyId : 0,
    data: b.data as Record<string, unknown>,
  }

  return { envelope, recurso, acao }
}
