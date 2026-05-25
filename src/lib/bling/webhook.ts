import { env } from '@/lib/env'
import { extrairRecurso } from './types'
import type { BlingWebhookEnvelope, RecursoBling } from './types'

export function verificarTokenWebhook(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return false

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim()

  const secret = env.BLING_WEBHOOK_SECRET
  if (!secret) return false

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
  const acao = partes[1] ?? 'unknown'

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
