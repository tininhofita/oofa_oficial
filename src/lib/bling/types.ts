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

export interface BlingNfeItem {
  codigo?: string
  descricao?: string
  unidade?: string
  quantidade?: number
  valor?: number
  valorTotal?: number
  tipo?: string
  pesoBruto?: number
  pesoLiquido?: number
  numeroPedidoCompra?: string
  classificacaoFiscal?: string
  cest?: string
  codigoServico?: string
  origem?: number
  informacoesAdicionais?: string
  gtin?: string
  cfop?: string
  valorAproxTotalTributos?: number
  icms?: { st?: number; origem?: number; modalidade?: number; aliquota?: number; valor?: number }
}

export interface BlingNfeParcela {
  data?: string
  valor?: number
  observacoes?: string
  caut?: string
  formaPagamento?: { id?: number }
}

export interface BlingNotaFiscalDados {
  id: number
  tipo?: number
  situacao?: number
  numero?: string
  serie?: number
  dataEmissao?: string
  dataOperacao?: string
  chaveAcesso?: string
  linkDanfe?: string
  linkPDF?: string
  linkPdf?: string
  valorNota?: number
  valorFrete?: number
  valorDesconto?: number
  finalidade?: number
  xml?: string
  optanteSimplesNacional?: boolean
  numeroPedidoLoja?: string
  contato?: { id?: number; nome?: string; tipoPessoa?: string; numeroDocumento?: string }
  loja?: { id: number }
  naturezaOperacao?: { id: number }
  canalVenda?: { id: number }
  vendedor?: { id: number }
  fretePorConta?: number
  transportador?: { nome?: string; documento?: string }
  etiqueta?: {
    nome?: string
    endereco?: string
    numero?: string
    complemento?: string
    municipio?: string
    uf?: string
    cep?: string
    bairro?: string
  }
  itens?: BlingNfeItem[]
  parcelas?: BlingNfeParcela[]
}

export interface BlingNotaFiscalConsumidorDados {
  id: number
  tipo?: number
  situacao?: number
  numero?: string
  serie?: number
  valorNota?: number
  dataEmissao?: string
  dataOperacao?: string
  chaveAcesso?: string
  linkDanfe?: string
  linkPDF?: string
  linkPdf?: string
  valorFrete?: number
  valorDesconto?: number
  xml?: string
  contato?: { id?: number; nome?: string; tipoPessoa?: string; numeroDocumento?: string }
  loja?: { id: number }
  naturezaOperacao?: { id: number }
  canalVenda?: { id: number }
  vendedor?: { id: number }
  fretePorConta?: number
  transportador?: { nome?: string; documento?: string }
  etiqueta?: {
    nome?: string
    endereco?: string
    numero?: string
    complemento?: string
    municipio?: string
    uf?: string
    cep?: string
    bairro?: string
  }
}
