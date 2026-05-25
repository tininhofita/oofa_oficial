import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import type {
  RecursoBling,
  BlingEstoqueDados,
  BlingPedidoVendaDados,
  BlingNotaFiscalDados,
  BlingNotaFiscalConsumidorDados,
} from './types'
import { blingGetWithRetry } from './client'

type ClienteSupabase = SupabaseClient<Database>

export async function processarEvento(
  supabase: ClienteSupabase,
  eventoId: string,
  recurso: RecursoBling,
  acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  switch (recurso) {
    case 'stock':
      return processarEstoque(supabase, eventoId, data)
    case 'order':
      return processarPedidoVenda(supabase, eventoId, acao, data)
    case 'invoice':
      return processarNotaFiscal(supabase, eventoId, acao, data)
    case 'consumer_invoice':
      return processarNFCe(supabase, eventoId, acao, data)
  }
}

async function processarEstoque(
  supabase: ClienteSupabase,
  eventoId: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as unknown as BlingEstoqueDados

  if (!d.produto?.id) {
    return { ok: false, erro: 'produto.id ausente no payload de estoque' }
  }

  const { error } = await supabase.from('bling_estoques').insert({
    bling_evento_id: eventoId,
    produto_id: d.produto.id,
    saldo_fisico_total: d.saldoFisicoTotal ?? null,
    saldo_virtual_total: d.saldoVirtualTotal ?? null,
  })

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

async function processarPedidoVenda(
  supabase: ClienteSupabase,
  eventoId: string,
  acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as unknown as BlingPedidoVendaDados

  if (!d.id) return { ok: false, erro: 'id ausente no payload de pedido de venda' }

  const { error } = await supabase.from('bling_pedidos_vendas').insert({
    bling_evento_id: eventoId,
    bling_id: d.id,
    acao,
    numero: d.numero ?? null,
    numero_loja: d.numeroLoja ?? null,
    data: d.data ?? null,
    data_saida: d.dataSaida ?? null,
    data_prevista: d.dataPrevista ?? null,
    total_produtos: d.totalProdutos ?? null,
    total: d.total ?? null,
    situacao_id: d.situacao?.id ?? null,
    situacao_valor: d.situacao?.valor ?? null,
    contato_id: d.contato?.id ?? null,
    contato_nome: d.contato?.nome ?? null,
    contato_tipo_pessoa: d.contato?.tipoPessoa ?? null,
    contato_documento: d.contato?.numeroDocumento ?? null,
    loja_id: d.loja?.id ?? null,
    vendedor_id: d.vendedor?.id ?? null,
    observacoes: d.observacoes ?? null,
    numero_pedido_compra: d.numeroPedidoCompra ?? null,
    itens: (d.itens ?? null) as Json,
    parcelas: (d.parcelas ?? null) as Json,
    transporte: (d.transporte ?? null) as Json,
    payload_completo: data as unknown as Json,
  })

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

async function processarNotaFiscal(
  supabase: ClienteSupabase,
  eventoId: string,
  _acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as unknown as BlingNotaFiscalDados

  if (!d.id) return { ok: false, erro: 'id ausente no payload de nota fiscal' }

  const { error } = await supabase.from('nfe').upsert({
    id: d.id,
    bling_evento_id: eventoId,
    tipo_nota: 'NFe',
    tipo: d.tipo ?? null,
    situacao: d.situacao ?? null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    data_emissao: d.dataEmissao ?? null,
    data_operacao: d.dataOperacao ?? null,
    contato_id: d.contato?.id ?? null,
    natureza_operacao_id: d.naturezaOperacao?.id ?? null,
    chave_acesso: d.chaveAcesso ?? null,
    link_danfe: d.linkDanfe ?? null,
    link_pdf: d.linkPDF ?? null,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) return { ok: false, erro: error.message }

  await enriquecerNfe(supabase, d.id, 'NFe').catch(() => null)
  return { ok: true }
}

async function processarNFCe(
  supabase: ClienteSupabase,
  eventoId: string,
  _acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as unknown as BlingNotaFiscalConsumidorDados

  if (!d.id) return { ok: false, erro: 'id ausente no payload de NFC-e' }

  const { error } = await supabase.from('nfe').upsert({
    id: d.id,
    bling_evento_id: eventoId,
    tipo_nota: 'NFCe',
    tipo: d.tipo ?? null,
    situacao: d.situacao ?? null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    valor_nota: d.valorNota ?? null,
    data_emissao: d.dataEmissao ?? null,
    data_operacao: d.dataOperacao ?? null,
    contato_id: d.contato?.id ?? null,
    natureza_operacao_id: d.naturezaOperacao?.id ?? null,
    chave_acesso: d.chaveAcesso ?? null,
    link_danfe: d.linkDanfe ?? null,
    link_pdf: d.linkPDF ?? null,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) return { ok: false, erro: error.message }

  await enriquecerNfe(supabase, d.id, 'NFCe').catch(() => null)
  return { ok: true }
}

async function enriquecerNfe(
  supabase: ClienteSupabase,
  id: number,
  tipoNota: 'NFe' | 'NFCe'
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: config } = await db
    .from('integracao_bling')
    .select('access_token, expires_at')
    .limit(1)
    .maybeSingle()

  if (!config?.access_token) return
  if (config.expires_at && new Date(config.expires_at) <= new Date()) return

  const endpoint = tipoNota === 'NFe' ? `/nfe/${id}` : `/nfce/${id}`
  const resposta = await blingGetWithRetry(endpoint, config.access_token)
  const d = resposta?.data as BlingNotaFiscalDados | null
  if (!d) return

  await db.from('nfe').update({
    tipo: d.tipo ?? null,
    situacao: d.situacao ?? null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    data_emissao: d.dataEmissao ?? null,
    data_operacao: d.dataOperacao ?? null,
    chave_acesso: d.chaveAcesso ?? null,
    link_danfe: d.linkDanfe ?? null,
    link_pdf: d.linkPdf ?? d.linkPDF ?? null,
    valor_nota: d.valorNota ?? null,
    valor_frete: d.valorFrete ?? null,
    valor_desconto: d.valorDesconto ?? null,
    finalidade: d.finalidade ?? null,
    xml: d.xml ?? null,
    optante_simples_nacional: d.optanteSimplesNacional ?? false,
    numero_pedido_loja: d.numeroPedidoLoja ?? null,
    contato_id: d.contato?.id ?? null,
    natureza_operacao_id: d.naturezaOperacao?.id ?? null,
    canal_venda_id: d.canalVenda?.id ?? null,
    vendedor_id: d.vendedor?.id ?? null,
    frete_por_conta: d.fretePorConta ?? null,
    transportador_nome: d.transportador?.nome ?? null,
    transportador_documento: d.transportador?.documento ?? null,
    etiqueta_nome: d.etiqueta?.nome ?? null,
    etiqueta_endereco: d.etiqueta?.endereco ?? null,
    etiqueta_numero: d.etiqueta?.numero ?? null,
    etiqueta_complemento: d.etiqueta?.complemento ?? null,
    etiqueta_municipio: d.etiqueta?.municipio ?? null,
    etiqueta_uf: d.etiqueta?.uf ?? null,
    etiqueta_cep: d.etiqueta?.cep ?? null,
    etiqueta_bairro: d.etiqueta?.bairro ?? null,
    atualizado_em: new Date().toISOString(),
  }).eq('id', id)
}
