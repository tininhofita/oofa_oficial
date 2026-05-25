import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import type {
  RecursoBling,
  BlingEstoqueDados,
  BlingPedidoVendaDados,
  BlingNotaFiscalDados,
  BlingNotaFiscalConsumidorDados,
} from './types'

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
    tipo: typeof d.tipo === 'number' ? d.tipo : null,
    situacao: typeof d.situacao === 'number' ? d.situacao : null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    data_emissao: d.dataEmissao ?? null,
    data_operacao: d.dataOperacao ?? null,
    contato_id: d.contato?.id ?? null,
    chave_acesso: d.chaveAcesso ?? null,
    link_danfe: d.linkDanfe ?? null,
    link_pdf: d.linkPDF ?? null,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) return { ok: false, erro: error.message }
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
    tipo: typeof d.tipo === 'number' ? d.tipo : null,
    situacao: typeof d.situacao === 'number' ? d.situacao : null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    valor_nota: d.valorNota ?? null,
    data_emissao: d.dataEmissao ?? null,
    data_operacao: d.dataOperacao ?? null,
    contato_id: d.contato?.id ?? null,
    chave_acesso: d.chaveAcesso ?? null,
    link_danfe: d.linkDanfe ?? null,
    link_pdf: d.linkPDF ?? null,
    atualizado_em: new Date().toISOString(),
  }, { onConflict: 'id' })

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}
