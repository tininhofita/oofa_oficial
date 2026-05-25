// Envelope padrão de todos os webhooks Bling V3
// O campo `event` segue o formato "recurso.acao", ex: "stock.updated", "order.created"
export interface BlingWebhookEnvelope {
  eventId: string
  date: string
  version: number
  event: string        // "stock.updated" | "order.created" | "invoice.issued" | etc.
  companyId: number
  data: Record<string, unknown>
}

// Prefixos de recursos reconhecidos (parte antes do ".")
export const RECURSOS_BLING_VALIDOS = ['stock', 'order', 'invoice', 'consumer_invoice'] as const
export type RecursoBling = typeof RECURSOS_BLING_VALIDOS[number]

// Extrai o prefixo do recurso de uma string de evento
// "stock.updated" → "stock"
export function extrairRecurso(event: string): RecursoBling | null {
  const prefixo = event.split('.')[0]
  if (RECURSOS_BLING_VALIDOS.includes(prefixo as RecursoBling)) {
    return prefixo as RecursoBling
  }
  return null
}

// Mapeamento de recurso → label legível
export const MAPEAMENTO_RECURSO_BLING: Record<RecursoBling, string> = {
  stock: 'Estoque',
  order: 'Pedido de Venda',
  invoice: 'Nota Fiscal Eletrônica',
  consumer_invoice: 'NFC-e',
}

// --- Tipos de dados por recurso ---

export interface BlingEstoqueDados {
  produto: { id: number }
  saldoFisicoTotal: number
  saldoVirtualTotal: number
}

export interface BlingPedidoVendaDados {
  id: number
  numero?: string
  numeroLoja?: string
  data?: string
  dataSaida?: string
  dataPrevista?: string
  totalProdutos?: number
  total?: number
  situacao?: { id: number; valor: string }
  contato?: { id: number; nome: string; tipoPessoa?: string; numeroDocumento?: string }
  loja?: { id: number }
  vendedor?: { id: number }
  observacoes?: string
  numeroPedidoCompra?: string
  itens?: unknown[]
  parcelas?: unknown[]
  transporte?: unknown
}

export interface BlingNotaFiscalDados {
  id: number
  tipo?: string        // "E" (entrada) | "S" (saída)
  situacao?: string    // "A" (autorizada), "C" (cancelada), etc.
  numero?: string
  serie?: number
  dataEmissao?: string
  dataOperacao?: string
  chaveAcesso?: string
  linkDanfe?: string
  linkPDF?: string
  contato?: { id?: number; nome: string; numeroDocumento: string }
  loja?: { id: number }
}

export interface BlingNotaFiscalConsumidorDados {
  id: number
  tipo?: string
  situacao?: string
  numero?: string
  serie?: number
  valorNota?: number
  dataEmissao?: string
  dataOperacao?: string
  chaveAcesso?: string
  linkDanfe?: string
  linkPDF?: string
  contato?: { id?: number; nome: string; numeroDocumento?: string }
  loja?: { id: number }
}
