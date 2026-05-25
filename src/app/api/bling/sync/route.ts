import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { obterTokenValido, blingGetWithRetry } from '@/lib/bling/client'

// Situações de Nota no Bling V3
const SITUACOES_NFE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const SITUACOES_NFCE = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

interface StatsSincronizacao {
  nfe_listadas: number
  nfe_importadas: number
  nfe_atualizadas: number
  nfe_ignoradas: number
  nfe_itens: number
  nfe_parcelas: number
  nfce_listadas: number
  nfce_importadas: number
  nfce_atualizadas: number
  nfce_ignoradas: number
  nfce_itens: number
  nfce_parcelas: number
  erros: string[]
}

function validarDataISO(v: string | null | undefined): string | null {
  if (!v || v.startsWith('0000')) return null
  return v
}

function formatarDataBling(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatarDatetimeBling(date: Date, fimDoDia = false): string {
  const base = formatarDataBling(date)
  return fimDoDia ? `${base} 23:59:59` : `${base} 00:00:00`
}

/**
 * Mapeia o contato vindo da API do Bling para o formato da tabela.
 */
function mapearContato(contato: any) {
  if (!contato?.id) return null
  const end = contato.endereco?.geral ?? contato.endereco ?? {}
  return {
    id: contato.id,
    nome: contato.nome ?? null,
    codigo: contato.codigo ?? null,
    situacao: contato.situacao ?? null,
    numero_documento: contato.numeroDocumento ?? null,
    telefone: contato.telefone ?? null,
    celular: contato.celular ?? null,
    fantasia: contato.fantasia ?? null,
    tipo: contato.tipo ?? null,
    indicador_ie: contato.indicadorIe ?? null,
    ie: contato.ie ?? null,
    rg: contato.rg ?? null,
    inscricao_municipal: contato.inscricaoMunicipal ?? null,
    email: contato.email ?? null,
    email_nota_fiscal: contato.emailNotaFiscal ?? null,
    endereco: end.endereco ?? null,
    numero: end.numero ?? null,
    complemento: end.complemento ?? null,
    bairro: end.bairro ?? null,
    cep: end.cep ?? null,
    municipio: end.municipio ?? null,
    uf: end.uf ?? null,
    pais: contato.pais?.nome ?? end.pais ?? null,
  }
}

/**
 * Realiza a paginação completa no Bling para um endpoint específico.
 */
async function buscarTodasPaginas(endpoint: string, token: string) {
  const itens: any[] = []
  let pagina = 1
  while (true) {
    const separador = endpoint.includes('?') ? '&' : '?'
    const dados = await blingGetWithRetry(`${endpoint}${separador}pagina=${pagina}&limite=100`, token)
    const linhas = dados?.data ?? []
    if (!linhas.length) break
    itens.push(...linhas)
    if (linhas.length < 100) break
    pagina++
    await sleep(400) // Delay curto entre páginas para respeitar o Rate Limit
  }
  return itens
}

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const tabela = url.searchParams.get('tabela')
    const estimar = url.searchParams.get('estimar') === 'true'

    // 1. Obtém o token ativo (com refresh automático de expiração)
    const token = await obterTokenValido()
    const supabase = (await createClient()) as any
    const agora = new Date().toISOString()

    // Sincronização exclusiva de naturezas de operação
    if (tabela === 'naturezas') {
      try {
        const resBling = await blingGetWithRetry('/naturezas-operacoes?situacao=1', token)
        const itens = resBling?.data ?? []
        if (itens.length > 0) {
          const rows = itens.map((n: any) => ({
            id: n.id,
            situacao: n.situacao ?? null,
            padrao: typeof n.padrao === 'number' ? n.padrao > 0 : Boolean(n.padrao),
            descricao: n.descricao ?? '',
            updated_at: agora
          }))
          const { error: errUpsert } = await supabase
            .from('naturezas_operacao')
            .upsert(rows, { onConflict: 'id' })

          if (errUpsert) throw errUpsert

          return NextResponse.json({
            ok: true,
            stats: { naturezas_importadas: rows.length },
            syncedAt: agora
          })
        }
        return NextResponse.json({ ok: true, stats: { naturezas_importadas: 0 }, syncedAt: agora })
      } catch (err: any) {
        return NextResponse.json({ error: `Falha ao sincronizar naturezas: ${err.message}` }, { status: 500 })
      }
    }

    const dataInicioStr = url.searchParams.get('dataInicio')
    const dataFimStr = url.searchParams.get('dataFim')
    const tipoNotaStr = url.searchParams.get('tipoNota') || 'todas' // 'nfe', 'nfce', 'todas'

    if (!dataInicioStr || !dataFimStr) {
      return NextResponse.json({ error: 'Parâmetros dataInicio e dataFim são obrigatórios.' }, { status: 400 })
    }

    const stats: StatsSincronizacao = {
      nfe_listadas: 0,
      nfe_importadas: 0,
      nfe_atualizadas: 0,
      nfe_ignoradas: 0,
      nfe_itens: 0,
      nfe_parcelas: 0,
      nfce_listadas: 0,
      nfce_importadas: 0,
      nfce_atualizadas: 0,
      nfce_ignoradas: 0,
      nfce_itens: 0,
      nfce_parcelas: 0,
      erros: [],
    }

    // ----------------------------------------------------
    // FASE 1: IMPORTAÇÃO DE NF-e
    // ----------------------------------------------------
    const listagemNfe: any[] = []
    const dataInicialNfe = `${dataInicioStr} 00:00:00`
    const dataFinalNfe = `${dataFimStr} 23:59:59`

    if (tipoNotaStr === 'todas' || tipoNotaStr === 'nfe') {
      for (let si = 0; si < SITUACOES_NFE.length; si++) {
        try {
          const situacao = SITUACOES_NFE[si]
          const nfs = await buscarTodasPaginas(
            `/nfe?dataEmissaoInicial=${encodeURIComponent(dataInicialNfe)}&dataEmissaoFinal=${encodeURIComponent(dataFinalNfe)}&situacao=${situacao}`,
            token
          )
          listagemNfe.push(...nfs)
          if (si < SITUACOES_NFE.length - 1) await sleep(400)
        } catch (err: any) {
          stats.erros.push(`Falha na listagem de NFe (situacao ${SITUACOES_NFE[si]}): ${err.message}`)
        }
      }
    }

    // Remove duplicidades da listagem
    const listagemNfeUnica = Array.from(new Map(listagemNfe.map((n) => [n.id, n])).values())
    stats.nfe_listadas = listagemNfeUnica.length

    // ----------------------------------------------------
    // FASE 2: IMPORTAÇÃO DE NFC-e
    // ----------------------------------------------------
    const listagemNfce: any[] = []
    const dataInicialNfce = `${dataInicioStr} 00:00:00`
    const dataFinalNfce = `${dataFimStr} 23:59:59`

    if (tipoNotaStr === 'todas' || tipoNotaStr === 'nfce') {
      for (let si = 0; si < SITUACOES_NFCE.length; si++) {
        try {
          const situacao = SITUACOES_NFCE[si]
          const nfs = await buscarTodasPaginas(
            `/nfce?dataEmissaoInicial=${encodeURIComponent(dataInicialNfce)}&dataEmissaoFinal=${encodeURIComponent(dataFinalNfce)}&situacao=${situacao}`,
            token
          )
          listagemNfce.push(...nfs)
          if (si < SITUACOES_NFCE.length - 1) await sleep(400)
        } catch (err: any) {
          stats.erros.push(`Falha na listagem de NFCe (situacao ${SITUACOES_NFCE[si]}): ${err.message}`)
        }
      }
    }

    const listagemNfceUnica = Array.from(new Map(listagemNfce.map((n) => [n.id, n])).values())
    stats.nfce_listadas = listagemNfceUnica.length

    // Caso seja apenas uma solicitação de estimativa, retorna instantaneamente
    if (estimar) {
      const nfeCount = listagemNfeUnica.length
      const nfceCount = listagemNfceUnica.length
      const totalCount = nfeCount + nfceCount
      return NextResponse.json({
        ok: true,
        estimativa: {
          nfe_listadas: nfeCount,
          nfce_listadas: nfceCount,
          total_listadas: totalCount,
          tempo_estimado_segundos: Math.round(totalCount * 0.25)
        }
      })
    }

    // ----------------------------------------------------
    // FASE 3: DETALHAMENTO E GRAVAÇÃO NO BANCO (EM LOTES COM THROTTLING)
    // ----------------------------------------------------
    const detalharGravarNotas = async (notasLista: any[], tipoNota: 'NFe' | 'NFCe') => {
      const isNfe = tipoNota === 'NFe'
      const endpoint = isNfe ? 'nfe' : 'nfce'

      for (let i = 0; i < notasLista.length; i++) {
        const notaResumida = notasLista[i]
        try {
          // Busca o detalhe completo da nota no Bling
          const res = await blingGetWithRetry(`/${endpoint}/${notaResumida.id}`, token)
          const nf = res?.data ?? res
          if (!nf?.id) continue

          const transporte = nf.transporte ?? {}
          const etiqueta = transporte.etiqueta ?? {}

          // 1. Tenta realizar UPSERT de cadastros auxiliares com segurança (ignora erro se tabela não existir)
          if (nf.loja?.id) {
            try {
              await supabase
                .from('canais_venda')
                .upsert({ id: nf.loja.id, descricao: nf.loja.descricao || null }, { onConflict: 'id' })
            } catch (e) {}
          }
          if (nf.naturezaOperacao?.id) {
            try {
              await supabase
                .from('naturezas_operacao')
                .upsert({ id: nf.naturezaOperacao.id, descricao: nf.naturezaOperacao.descricao || null }, { onConflict: 'id' })
            } catch (e) {}
          }
          if (nf.contato?.id) {
            let dadosContato = nf.contato
            // Se o contato da NFe não tem nome, busca o cadastro completo no Bling
            if (!dadosContato.nome) {
              try {
                const resp = await blingGetWithRetry(`/contatos/${dadosContato.id}`, token)
                if (resp?.data?.nome) dadosContato = { ...dadosContato, ...resp.data }
              } catch { /* best-effort */ }
            }
            const contatoMapeado = mapearContato(dadosContato)
            if (contatoMapeado) {
              // Remove campos nulos para não sobrescrever valores existentes no banco
              const payload = Object.fromEntries(
                Object.entries(contatoMapeado).filter(([, v]) => v !== null)
              )
              try {
                await supabase
                  .from('contatos')
                  .upsert(payload, { onConflict: 'id' })
              } catch (e) {}
            }
          }

          // 2. Mapeia e salva a NFe/NFCe principal no banco do Oofa
          const dadosNfe = {
            id: nf.id,
            tipo: nf.tipo ?? null,
            situacao: nf.situacao ?? null,
            numero: nf.numero ?? null,
            serie: nf.serie ?? null,
            data_emissao: validarDataISO(nf.dataEmissao),
            data_operacao: validarDataISO(nf.dataOperacao),
            chave_acesso: nf.chaveAcesso ?? null,
            valor_nota: nf.valorNota ?? null,
            valor_frete: nf.valorFrete ?? null,
            valor_desconto: nf.valorDesconto ?? null,
            finalidade: nf.finalidade ?? null,
            tipo_nota: tipoNota,
            xml: nf.xml ?? null,
            link_danfe: nf.linkDanfe ?? null,
            link_pdf: nf.linkPDF ?? null,
            optante_simples_nacional: nf.optanteSimplesNacional ?? false,
            numero_pedido_loja: nf.numeroPedidoLoja ?? null,
            contato_id: nf.contato?.id || null,
            natureza_operacao_id: nf.naturezaOperacao?.id || null,
            canal_venda_id: nf.loja?.id || null,
            vendedor_id: nf.vendedor?.id || null,
            frete_por_conta: transporte.fretePorConta ?? null,
            transportador_nome: transporte.transportador?.nome ?? null,
            transportador_documento: transporte.transportador?.numeroDocumento ?? null,
            etiqueta_nome: etiqueta.nome || nf.contato?.nome || null,
            etiqueta_endereco: etiqueta.endereco ?? null,
            etiqueta_numero: etiqueta.numero ?? null,
            etiqueta_complemento: etiqueta.complemento ?? null,
            etiqueta_municipio: etiqueta.municipio ?? null,
            etiqueta_uf: etiqueta.uf ?? null,
            etiqueta_cep: etiqueta.cep ?? null,
            etiqueta_bairro: etiqueta.bairro ?? null,
            atualizado_em: agora,
          }

          // 2.1 Verifica se a nota já existe no banco local para estatísticas de importação, atualização e ignoradas
          const { data: notaExistente } = await supabase
            .from('nfe')
            .select('situacao, valor_nota')
            .eq('id', nf.id)
            .maybeSingle()

          const jaExiste = Boolean(notaExistente)
          let deveGravar = true

          if (jaExiste) {
            const situacaoIgual = notaExistente?.situacao === (nf.situacao ?? null)
            const valorIgual = Number(notaExistente?.valor_nota) === Number(nf.valorNota ?? 0)

            if (situacaoIgual && valorIgual) {
              deveGravar = false
              if (isNfe) stats.nfe_ignoradas++
              else stats.nfce_ignoradas++
            } else {
              if (isNfe) stats.nfe_atualizadas++
              else stats.nfce_atualizadas++
            }
          } else {
            if (isNfe) stats.nfe_importadas++
            else stats.nfce_importadas++
          }

          if (!deveGravar) {
            // Se a nota for idêntica, ignoramos a gravação para economizar processamento e limites
            continue
          }

          const { error: errNota } = await supabase.from('nfe').upsert(dadosNfe, { onConflict: 'id' })
          if (errNota) {
            stats.erros.push(`Falha no upsert da nota ${nf.id}: ${errNota.message}`)
            continue
          }

          // 3. Importa itens da nota
          const itens = nf.itens ?? []
          if (itens.length > 0) {
            await supabase.from('nfe_itens').delete().eq('nfe_id', nf.id)
            const rowsItens = itens.map((item: any) => ({
              nfe_id: nf.id,
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
            const { error: errItens } = await supabase.from('nfe_itens').insert(rowsItens)
            if (!errItens) {
              if (isNfe) stats.nfe_itens += itens.length
              else stats.nfce_itens += itens.length
            } else {
              stats.erros.push(`Falha nos itens da nota ${nf.id}: ${errItens.message}`)
            }
          }

          // 4. Importa parcelas da nota
          const parcelas = nf.parcelas ?? []
          if (parcelas.length > 0) {
            await supabase.from('nfe_parcelas').delete().eq('nfe_id', nf.id)
            const rowsParcelas = parcelas.map((p: any) => ({
              nfe_id: nf.id,
              data: p.data ?? null,
              valor: p.valor ?? null,
              observacoes: p.observacoes ?? null,
              caut: p.caut ?? null,
              forma_pagamento_id: p.formaPagamento?.id ?? null,
            }))
            const { error: errParcelas } = await supabase.from('nfe_parcelas').insert(rowsParcelas)
            if (!errParcelas) {
              if (isNfe) stats.nfe_parcelas += parcelas.length
              else stats.nfce_parcelas += parcelas.length
            } else {
              stats.erros.push(`Falha nas parcelas da nota ${nf.id}: ${errParcelas.message}`)
            }
          }
        } catch (err: any) {
          stats.erros.push(`Excecao na importacao dos detalhes da nota ${notaResumida.id}: ${err.message}`)
        }

        // Delay de 250ms por nota para respeitar o Rate Limit do Bling
        await sleep(250)
      }
    }

    // Roda em lotes controlados dependendo do tipo selecionado
    if (tipoNotaStr === 'todas' || tipoNotaStr === 'nfe') {
      await detalharGravarNotas(listagemNfeUnica, 'NFe')
    }
    if (tipoNotaStr === 'todas' || tipoNotaStr === 'nfce') {
      await detalharGravarNotas(listagemNfceUnica, 'NFCe')
    }

    return NextResponse.json({
      ok: true,
      stats,
      syncedAt: agora,
    })

  } catch (err: any) {
    console.error('Falha geral na sincronização:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
