import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import type {
  RecursoBling,
  BlingEstoqueDados,
  BlingPedidoVendaDados,
  BlingNotaFiscalDados,
  BlingNotaFiscalConsumidorDados,
  BlingNfeItem,
  BlingNfeParcela,
} from './types'
import { blingGetWithRetry, tryRefreshToken } from './client'

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
    .select('id, access_token, refresh_token, expires_at')
    .limit(1)
    .maybeSingle()

  if (!config?.access_token) return

  let token = config.access_token
  const isExpired = config.expires_at && new Date(config.expires_at) <= new Date()
  if (isExpired) {
    if (!config.refresh_token) return
    const novoToken = await tryRefreshToken({ id: config.id, refresh_token: config.refresh_token })
    if (!novoToken) return
    token = novoToken
  }

  const endpoint = tipoNota === 'NFe' ? `/nfe/${id}` : `/nfce/${id}`
  const resposta = await blingGetWithRetry(endpoint, token)
  const d = resposta?.data as BlingNotaFiscalDados | null
  if (!d) return

  const transporte = d.transporte ?? {}
  const etiqueta = transporte.etiqueta ?? {}

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
    canal_venda_id: d.loja?.id ?? null,
    vendedor_id: d.vendedor?.id ?? null,
    frete_por_conta: transporte.fretePorConta ?? null,
    transportador_nome: transporte.transportador?.nome ?? null,
    transportador_documento: transporte.transportador?.numeroDocumento ?? null,
    etiqueta_nome: etiqueta.nome || d.contato?.nome || null,
    etiqueta_endereco: etiqueta.endereco ?? null,
    etiqueta_numero: etiqueta.numero ?? null,
    etiqueta_complemento: etiqueta.complemento ?? null,
    etiqueta_municipio: etiqueta.municipio ?? null,
    etiqueta_uf: etiqueta.uf ?? null,
    etiqueta_cep: etiqueta.cep ?? null,
    etiqueta_bairro: etiqueta.bairro ?? null,
    atualizado_em: new Date().toISOString(),
  }).eq('id', id)

  if (Array.isArray(d.itens) && d.itens.length > 0) {
    await db.from('nfe_itens').delete().eq('nfe_id', id)
    await db.from('nfe_itens').insert(
      (d.itens as BlingNfeItem[]).map((item) => ({
        nfe_id: id,
        codigo: item.codigo ?? null,
        descricao: item.descricao ?? null,
        unidade: item.unidade ?? null,
        quantidade: item.quantidade ?? null,
        valor: item.valor ?? null,
        valor_total: item.valorTotal ?? null,
        tipo: item.tipo ?? null,
        peso_bruto: item.pesoBruto ?? null,
        peso_liquido: item.pesoLiquido ?? null,
        numero_pedido_compra: item.numeroPedidoCompra ?? null,
        classificacao_fiscal: item.classificacaoFiscal ?? null,
        cest: item.cest ?? null,
        codigo_servico: item.codigoServico ?? null,
        origem: item.origem ?? null,
        informacoes_adicionais: item.informacoesAdicionais ?? null,
        gtin: item.gtin ?? null,
        cfop: item.cfop ?? null,
        valor_aprox_total_tributos: item.impostos?.valorAproximadoTotalTributos ?? null,
        icms_st: item.impostos?.icms?.st ?? null,
        icms_origem: item.impostos?.icms?.origem ?? null,
        icms_modalidade: item.impostos?.icms?.modalidade ?? null,
        icms_aliquota: item.impostos?.icms?.aliquota ?? null,
        icms_valor: item.impostos?.icms?.valor ?? null,
      }))
    )
  }

  if (Array.isArray(d.parcelas) && d.parcelas.length > 0) {
    await db.from('nfe_parcelas').delete().eq('nfe_id', id)
    await db.from('nfe_parcelas').insert(
      (d.parcelas as BlingNfeParcela[]).map((parcela) => ({
        nfe_id: id,
        data: parcela.data ?? null,
        valor: parcela.valor ?? null,
        observacoes: parcela.observacoes ?? null,
        caut: parcela.caut ?? null,
        forma_pagamento_id: parcela.formaPagamento?.id ?? null,
      }))
    )
  }
}
