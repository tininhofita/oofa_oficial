"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/Badge'
import './importacao.css'

interface NotaFiscal {
  id: number
  numero: string | null
  serie: number | null
  tipo: number | null
  situacao: number | null
  data_emissao: string | null
  valor_nota: number | null
  tipo_nota: string | null
  etiqueta_nome?: string | null
  contatos?: {
    nome: string | null
  } | null
}

const SITUACOES_MAP: Record<number, { texto: string; variante: 'sucesso' | 'erro' | 'aviso' | 'info' | 'inativo' }> = {
  1: { texto: 'Pendente', variante: 'aviso' },
  2: { texto: 'Cancelada', variante: 'erro' },
  3: { texto: 'Aguardando Recibo', variante: 'info' },
  4: { texto: 'Rejeitada', variante: 'erro' },
  5: { texto: 'Autorizada', variante: 'sucesso' },
  6: { texto: 'Emitida', variante: 'sucesso' },
  7: { texto: 'Registrada', variante: 'sucesso' },
  8: { texto: 'Enviada', variante: 'info' },
  9: { texto: 'Cancelada Hom.', variante: 'erro' },
  10: { texto: 'Inutilizada', variante: 'inativo' },
  11: { texto: 'Bloqueada', variante: 'erro' },
}

const SITUACOES_CP_MAP: Record<number, { texto: string; variante: 'sucesso' | 'erro' | 'aviso' | 'info' | 'inativo' }> = {
  1: { texto: 'Em Aberto', variante: 'aviso' },
  2: { texto: 'Pago', variante: 'sucesso' },
  3: { texto: 'Parcialmente Pago', variante: 'info' },
  4: { texto: 'Devolvido', variante: 'inativo' },
  5: { texto: 'Cancelado', variante: 'erro' },
}


// Funções auxiliares de período de datas
const obterPrimeiroDiaMesAtual = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

const obterUltimoDiaMesAtual = () => {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const ultimoDia = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
}

const obterPeriodoMesAnterior = () => {
  const d = new Date()
  let y = d.getFullYear()
  let m = d.getMonth() // anterior (0-indexed)
  if (m === 0) {
    m = 12
    y = y - 1
  }
  const ultimoDia = new Date(y, m, 0).getDate()
  return {
    inicio: `${y}-${String(m).padStart(2, '0')}-01`,
    fim: `${y}-${String(m).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`
  }
}

// Formatador de data seguro para a página
const formatarData = (dataStr: string) => {
  if (!dataStr || dataStr === '—') return '—'
  try {
    const partes = dataStr.split('T')[0].split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(dataStr))
  } catch (e) {
    return dataStr
  }
}

interface SucessoStatusSinc {
  nfe_importadas: number
  nfe_atualizadas: number
  nfe_ignoradas: number
  nfce_importadas: number
  nfce_atualizadas: number
  nfce_ignoradas: number
}

export default function ImportacaoPage() {
  // Controle de Aba Ativa
  const [abaAtiva, setAbaAtiva] = useState<'nfe' | 'contas_pagar'>('nfe')

  // --- Estados de Notas Fiscais ---
  const [dataInicioImportacao, setDataInicioImportacao] = useState(obterPrimeiroDiaMesAtual())
  const [dataFimImportacao, setDataFimImportacao] = useState(obterUltimoDiaMesAtual())
  const [tipoNotaImportacao, setTipoNotaImportacao] = useState<'todas' | 'nfe' | 'nfce'>('todas')

  const [exibicaoDataInicio, setExibicaoDataInicio] = useState(obterPrimeiroDiaMesAtual())
  const [exibicaoDataFim, setExibicaoDataFim] = useState(obterUltimoDiaMesAtual())
  const [tipoFiltroPeriodo, setTipoFiltroPeriodo] = useState<'este_mes' | 'mes_anterior' | 'customizado'>('este_mes')

  const [paginaAtual, setPaginaAtual] = useState(1)
  const [totalNotasFiltradas, setTotalNotasFiltradas] = useState(0)
  const itensPorPagina = 25

  const [ultimoRegistroNfe, setUltimoRegistroNfe] = useState<{ numero: string; data: string } | null>(null)
  const [ultimoRegistroNfce, setUltimoRegistroNfce] = useState<{ numero: string; data: string } | null>(null)

  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroSituacao, setFiltroSituacao] = useState('todos')
  const [carregandoNotas, setCarregandoNotas] = useState(true)

  const [stats, setStats] = useState({
    nfe_total: 0,
    nfe_valor: 0,
    nfce_total: 0,
    nfce_valor: 0,
  })

  // --- Estados de Contas a Pagar ---
  const [dataInicioCP, setDataInicioCP] = useState(obterPrimeiroDiaMesAtual())
  const [dataFimCP, setDataFimCP] = useState(obterUltimoDiaMesAtual())
  const [tipoDataCP, setTipoDataCP] = useState<'vencimento' | 'emissao' | 'pagamento'>('vencimento')

  const [exibicaoDataInicioCP, setExibicaoDataInicioCP] = useState(obterPrimeiroDiaMesAtual())
  const [exibicaoDataFimCP, setExibicaoDataFimCP] = useState(obterUltimoDiaMesAtual())
  const [tipoFiltroPeriodoCP, setTipoFiltroPeriodoCP] = useState<'este_mes' | 'mes_anterior' | 'customizado'>('este_mes')

  const [paginaAtualCP, setPaginaAtualCP] = useState(1)
  const [totalContasFiltradas, setTotalContasFiltradas] = useState(0)

  const [ultimoRegistroCP, setUltimoRegistroCP] = useState<{ id: number; data: string; valor: number; numero_documento: string } | null>(null)
  const [contas, setContas] = useState<any[]>([])
  const [buscaCP, setBuscaCP] = useState('')
  const [filtroSituacaoCP, setFiltroSituacaoCP] = useState('todos')
  const [carregandoContas, setCarregandoContas] = useState(true)

  const [statsCP, setStatsCP] = useState({
    aberto_total: 0,
    aberto_valor: 0,
    pago_total: 0,
    pago_valor: 0,
    cancelado_total: 0,
  })

  // Estados Globais de Sincronização
  const [sincronizando, setSincronizando] = useState(false)
  const [mensagemStatus, setMensagemStatus] = useState('')
  const [erroSinc, setErroSinc] = useState<string | null>(null)
  const [sucessoSinc, setSucessoSinc] = useState<SucessoStatusSinc | null>(null)

  const supabase = createClient() as any

  // Efeito de escuta para sincronizar datas do período pré-definido de Notas Fiscais
  useEffect(() => {
    if (tipoFiltroPeriodo === 'este_mes') {
      setExibicaoDataInicio(obterPrimeiroDiaMesAtual())
      setExibicaoDataFim(obterUltimoDiaMesAtual())
    } else if (tipoFiltroPeriodo === 'mes_anterior') {
      const { inicio, fim } = obterPeriodoMesAnterior()
      setExibicaoDataInicio(inicio)
      setExibicaoDataFim(fim)
    }
  }, [tipoFiltroPeriodo])

  // Efeito de escuta para sincronizar datas do período pré-definido de Contas a Pagar
  useEffect(() => {
    if (tipoFiltroPeriodoCP === 'este_mes') {
      setExibicaoDataInicioCP(obterPrimeiroDiaMesAtual())
      setExibicaoDataFimCP(obterUltimoDiaMesAtual())
    } else if (tipoFiltroPeriodoCP === 'mes_anterior') {
      const { inicio, fim } = obterPeriodoMesAnterior()
      setExibicaoDataInicioCP(inicio)
      setExibicaoDataFimCP(fim)
    }
  }, [tipoFiltroPeriodoCP])

  // Reseta para a primeira página sempre que alterar qualquer filtro de Notas Fiscais
  useEffect(() => {
    setPaginaAtual(1)
  }, [busca, filtroTipo, filtroSituacao, exibicaoDataInicio, exibicaoDataFim])

  // Reseta para a primeira página sempre que alterar qualquer filtro de Contas a Pagar
  useEffect(() => {
    setPaginaAtualCP(1)
  }, [buscaCP, filtroSituacaoCP, exibicaoDataInicioCP, exibicaoDataFimCP])

  // Consolida contagens exatas e somas paginadas para superar limitações do banco de dados Supabase (limite de 1000)
  const carregarEstatisticas = useCallback(async () => {
    try {
      // 1. Contagem exata de NF-e
      const { count: totalNfe, error: errCountNfe } = await supabase
        .from('nfe')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_nota', 'NFe')
        .neq('situacao', 2)
        .gte('data_emissao', `${exibicaoDataInicio} 00:00:00`)
        .lte('data_emissao', `${exibicaoDataFim} 23:59:59`)

      if (errCountNfe) throw errCountNfe

      // 2. Contagem exata de NFC-e
      const { count: totalNfce, error: errCountNfce } = await supabase
        .from('nfe')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_nota', 'NFCe')
        .neq('situacao', 2)
        .gte('data_emissao', `${exibicaoDataInicio} 00:00:00`)
        .lte('data_emissao', `${exibicaoDataFim} 23:59:59`)

      if (errCountNfce) throw errCountNfce

      // 3. Pagina a soma do valor de NF-e (de 1000 em 1000) de forma leve (apenas coluna valor_nota)
      let valorTotalNfe = 0
      let deNfe = 0
      const limiteLote = 1000
      while (true) {
        const { data, error } = await supabase
          .from('nfe')
          .select('valor_nota')
          .eq('tipo_nota', 'NFe')
          .neq('situacao', 2)
          .gte('data_emissao', `${exibicaoDataInicio} 00:00:00`)
          .lte('data_emissao', `${exibicaoDataFim} 23:59:59`)
          .range(deNfe, deNfe + limiteLote - 1)

        if (error) throw error
        if (!data || data.length === 0) break

        valorTotalNfe += data.reduce((acc: number, cur: any) => acc + (cur.valor_nota ?? 0), 0)
        if (data.length < limiteLote) break
        deNfe += limiteLote
      }

      // 4. Pagina a soma do valor de NFC-e (de 1000 em 1000)
      let valorTotalNfce = 0
      let deNfce = 0
      while (true) {
        const { data, error } = await supabase
          .from('nfe')
          .select('valor_nota')
          .eq('tipo_nota', 'NFCe')
          .neq('situacao', 2)
          .gte('data_emissao', `${exibicaoDataInicio} 00:00:00`)
          .lte('data_emissao', `${exibicaoDataFim} 23:59:59`)
          .range(deNfce, deNfce + limiteLote - 1)

        if (error) throw error
        if (!data || data.length === 0) break

        valorTotalNfce += data.reduce((acc: number, cur: any) => acc + (cur.valor_nota ?? 0), 0)
        if (data.length < limiteLote) break
        deNfce += limiteLote
      }

      setStats({
        nfe_total: totalNfe ?? 0,
        nfe_valor: valorTotalNfe,
        nfce_total: totalNfce ?? 0,
        nfce_valor: valorTotalNfce,
      })
    } catch (err) {
      console.error('Erro ao calcular estatísticas paginadas:', err)
    }
  }, [supabase, exibicaoDataInicio, exibicaoDataFim])

  // Busca as últimas importadas de cada tipo para exibição informativa nos cards de NF
  const carregarUltimasNotas = useCallback(async () => {
    try {
      const { data: ultimaNfe } = await supabase
        .from('nfe')
        .select('numero, data_emissao')
        .eq('tipo_nota', 'NFe')
        .order('data_emissao', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ultimaNfe) {
        setUltimoRegistroNfe({
          numero: ultimaNfe.numero || '—',
          data: ultimaNfe.data_emissao || '—',
        })
      } else {
        setUltimoRegistroNfe(null)
      }

      const { data: ultimaNfce } = await supabase
        .from('nfe')
        .select('numero, data_emissao')
        .eq('tipo_nota', 'NFCe')
        .order('data_emissao', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ultimaNfce) {
        setUltimoRegistroNfce({
          numero: ultimaNfce.numero || '—',
          data: ultimaNfce.data_emissao || '—',
        })
      } else {
        setUltimoRegistroNfce(null)
      }
    } catch (e) {
      console.warn('Erro ao buscar as últimas notas registradas:', e)
    }
  }, [supabase])

  // Busca e processa as notas da tabela aplicando filtros e paginação diretamente no Supabase
  const carregarNotasTabela = useCallback(async () => {
    setCarregandoNotas(true)
    try {
      let query = supabase
        .from('nfe')
        .select(`
          id,
          numero,
          serie,
          tipo,
          situacao,
          data_emissao,
          valor_nota,
          tipo_nota,
          contato_id,
          etiqueta_nome
        `, { count: 'exact' })
        .gte('data_emissao', `${exibicaoDataInicio} 00:00:00`)
        .lte('data_emissao', `${exibicaoDataFim} 23:59:59`)

      // Filtro de tipo
      if (filtroTipo === 'nfe') {
        query = query.eq('tipo_nota', 'NFe')
      } else if (filtroTipo === 'nfce') {
        query = query.eq('tipo_nota', 'NFCe')
      }

      // Filtro de situação
      if (filtroSituacao === 'autorizada') {
        query = query.in('situacao', [5, 6, 7])
      } else if (filtroSituacao === 'cancelada') {
        query = query.eq('situacao', 2)
      } else if (filtroSituacao === 'pendente') {
        query = query.eq('situacao', 1)
      } else if (filtroSituacao === 'outras') {
        query = query.not('situacao', 'in', '(1,2,5,6,7)')
      }

      // Busca textual por número ou nome
      if (busca.trim()) {
        const termo = busca.trim()
        if (/^\d+$/.test(termo)) {
          query = query.or(`numero.ilike.%${termo}%,etiqueta_nome.ilike.%${termo}%`)
        } else {
          query = query.ilike('etiqueta_nome', `%${termo}%`)
        }
      }

      const de = (paginaAtual - 1) * itensPorPagina
      const ate = de + itensPorPagina - 1

      const { data, count, error } = await query
        .order('data_emissao', { ascending: false })
        .range(de, ate)

      if (error) throw error

      setTotalNotasFiltradas(count ?? 0)

      const listaNotas = (data ?? []) as unknown as NotaFiscal[]
      const contatoIds = Array.from(new Set(listaNotas.map((n: any) => n.contato_id).filter(Boolean)))

      let contatosMap: Record<number, string> = {}
      if (contatoIds.length > 0) {
        try {
          const { data: contatosData, error: errContatos } = await supabase
            .from('contatos')
            .select('id, nome')
            .in('id', contatoIds)

          if (!errContatos && contatosData) {
            contatosMap = contatosData.reduce((acc: Record<number, string>, c: any) => {
              acc[c.id] = c.nome || ''
              return acc
            }, {} as Record<number, string>)
          }
        } catch (e) {
          console.warn('Tabela contatos não disponível:', e)
        }
      }

      const notasComContato = listaNotas.map((n: any) => ({
        ...n,
        contatos: n.contato_id && contatosMap[n.contato_id]
          ? { nome: contatosMap[n.contato_id] }
          : null,
      }))

      setNotas(notasComContato)
    } catch (err) {
      console.error('Erro ao carregar notas da tabela:', err)
    } finally {
      setCarregandoNotas(false)
    }
  }, [supabase, exibicaoDataInicio, exibicaoDataFim, filtroTipo, filtroSituacao, busca, paginaAtual])

  // --- Lógica e Carregadores para Contas a Pagar ---

  const carregarEstatisticasCP = useCallback(async () => {
    try {
      // 1. Contas em Aberto (Situação 1)
      const { count: totalAberto, error: errAberto } = await supabase
        .from('bling_contas_pagar')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 1)
        .gte('vencimento', `${exibicaoDataInicioCP}`)
        .lte('vencimento', `${exibicaoDataFimCP}`)

      if (errAberto) throw errAberto

      let valorAberto = 0
      let deAberto = 0
      const limiteLote = 1000
      while (true) {
        const { data, error } = await supabase
          .from('bling_contas_pagar')
          .select('valor')
          .eq('situacao', 1)
          .gte('vencimento', `${exibicaoDataInicioCP}`)
          .lte('vencimento', `${exibicaoDataFimCP}`)
          .range(deAberto, deAberto + limiteLote - 1)

        if (error) throw error
        if (!data || data.length === 0) break

        valorAberto += data.reduce((acc: number, cur: any) => acc + (cur.valor ?? 0), 0)
        if (data.length < limiteLote) break
        deAberto += limiteLote
      }

      // 2. Contas Pagas (Situação 2)
      const { count: totalPago, error: errPago } = await supabase
        .from('bling_contas_pagar')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 2)
        .gte('vencimento', `${exibicaoDataInicioCP}`)
        .lte('vencimento', `${exibicaoDataFimCP}`)

      if (errPago) throw errPago

      let valorPago = 0
      let dePago = 0
      while (true) {
        const { data, error } = await supabase
          .from('bling_contas_pagar')
          .select('valor')
          .eq('situacao', 2)
          .gte('vencimento', `${exibicaoDataInicioCP}`)
          .lte('vencimento', `${exibicaoDataFimCP}`)
          .range(dePago, dePago + limiteLote - 1)

        if (error) throw error
        if (!data || data.length === 0) break

        valorPago += data.reduce((acc: number, cur: any) => acc + (cur.valor ?? 0), 0)
        if (data.length < limiteLote) break
        dePago += limiteLote
      }

      // 3. Contas Canceladas (Situação 5)
      const { count: totalCancelado, error: errCancelado } = await supabase
        .from('bling_contas_pagar')
        .select('*', { count: 'exact', head: true })
        .eq('situacao', 5)
        .gte('vencimento', `${exibicaoDataInicioCP}`)
        .lte('vencimento', `${exibicaoDataFimCP}`)

      if (errCancelado) throw errCancelado

      setStatsCP({
        aberto_total: totalAberto ?? 0,
        aberto_valor: valorAberto,
        pago_total: totalPago ?? 0,
        pago_valor: valorPago,
        cancelado_total: totalCancelado ?? 0,
      })
    } catch (err) {
      console.error('Erro ao carregar estatísticas de Contas a Pagar:', err)
    }
  }, [supabase, exibicaoDataInicioCP, exibicaoDataFimCP])

  const carregarUltimaContaCP = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bling_contas_pagar')
        .select('id, vencimento, valor, numero_documento')
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setUltimoRegistroCP({
          id: data.id,
          data: data.vencimento || '—',
          valor: data.valor ?? 0,
          numero_documento: data.numero_documento || `ID ${data.id}`
        })
      } else {
        setUltimoRegistroCP(null)
      }
    } catch (e) {
      console.warn('Erro ao carregar última conta a pagar:', e)
    }
  }, [supabase])

  const carregarContasTabela = useCallback(async () => {
    setCarregandoContas(true)
    try {
      let query = supabase
        .from('bling_contas_pagar')
        .select(`
          id,
          situacao,
          vencimento,
          valor,
          saldo,
          data_emissao,
          vencimento_original,
          numero_documento,
          competencia,
          historico,
          numero_banco,
          contato_id
        `, { count: 'exact' })
        .gte('vencimento', `${exibicaoDataInicioCP}`)
        .lte('vencimento', `${exibicaoDataFimCP}`)

      // Filtro de Situação
      if (filtroSituacaoCP !== 'todos') {
        query = query.eq('situacao', Number(filtroSituacaoCP))
      }

      // Busca textual por número do documento
      if (buscaCP.trim()) {
        const termo = buscaCP.trim()
        query = query.or(`numero_documento.ilike.%${termo}%,historico.ilike.%${termo}%`)
      }

      const de = (paginaAtualCP - 1) * itensPorPagina
      const ate = de + itensPorPagina - 1

      const { data, count, error } = await query
        .order('vencimento', { ascending: false })
        .range(de, ate)

      if (error) throw error

      setTotalContasFiltradas(count ?? 0)

      const listaContas = (data ?? []) as any[]
      const contatoIds = Array.from(new Set(listaContas.map((c) => c.contato_id).filter(Boolean)))

      let contatosMap: Record<number, string> = {}
      if (contatoIds.length > 0) {
        try {
          const { data: contatosData } = await supabase
            .from('contatos')
            .select('id, nome')
            .in('id', contatoIds)

          if (contatosData) {
            contatosMap = contatosData.reduce((acc: Record<number, string>, c: any) => {
              acc[c.id] = c.nome || ''
              return acc
            }, {} as Record<number, string>)
          }
        } catch {}
      }

      const contasComContato = listaContas.map((c) => ({
        ...c,
        contato_nome: c.contato_id && contatosMap[c.contato_id] ? contatosMap[c.contato_id] : 'Cliente/Fornecedor Não Mapeado'
      }))

      setContas(contasComContato)
    } catch (err) {
      console.error('Erro ao carregar contas da tabela:', err)
    } finally {
      setCarregandoContas(false)
    }
  }, [supabase, exibicaoDataInicioCP, exibicaoDataFimCP, filtroSituacaoCP, buscaCP, paginaAtualCP])

  // Chamada agregada para recarregar Notas Fiscais
  const carregarNotas = useCallback(async () => {
    await Promise.all([
      carregarNotasTabela(),
      carregarEstatisticas(),
      carregarUltimasNotas()
    ])
  }, [carregarNotasTabela, carregarEstatisticas, carregarUltimasNotas])

  // Chamada agregada para recarregar Contas a Pagar
  const carregarContasPagar = useCallback(async () => {
    await Promise.all([
      carregarContasTabela(),
      carregarEstatisticasCP(),
      carregarUltimaContaCP()
    ])
  }, [carregarContasTabela, carregarEstatisticasCP, carregarUltimaContaCP])

  // Efeitos iniciais e de reatividade de filtros
  useEffect(() => {
    carregarNotasTabela()
  }, [carregarNotasTabela])

  useEffect(() => {
    carregarEstatisticas()
  }, [carregarEstatisticas])

  useEffect(() => {
    carregarUltimasNotas()
  }, [carregarUltimasNotas])

  useEffect(() => {
    carregarContasTabela()
  }, [carregarContasTabela])

  useEffect(() => {
    carregarEstatisticasCP()
  }, [carregarEstatisticasCP])

  useEffect(() => {
    carregarUltimaContaCP()
  }, [carregarUltimaContaCP])

  // Disparar importação manual no Bling via nossa API de sync (Notas Fiscais ou Contas a Pagar)
  const dispararImportacao = async () => {
    setSincronizando(true)
    setErroSinc(null)
    setSucessoSinc(null)

    if (abaAtiva === 'nfe') {
      setMensagemStatus('Sincronizando notas fiscais com o Bling ERP... Por favor, aguarde.')
      try {
        const response = await fetch(`/api/bling/sync?dataInicio=${dataInicioImportacao}&dataFim=${dataFimImportacao}&tipoNota=${tipoNotaImportacao}`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Falha inesperada ao executar importação.')
        }

        setMensagemStatus('Sincronização concluída com sucesso!')
        setSucessoSinc({
          nfe_importadas: data.stats?.nfe_importadas ?? 0,
          nfe_atualizadas: data.stats?.nfe_atualizadas ?? 0,
          nfe_ignoradas: data.stats?.nfe_ignoradas ?? 0,
          nfce_importadas: data.stats?.nfce_importadas ?? 0,
          nfce_atualizadas: data.stats?.nfce_atualizadas ?? 0,
          nfce_ignoradas: data.stats?.nfce_ignoradas ?? 0,
        })

        await carregarNotas()

        if (data.stats?.erros && data.stats.erros.length > 0) {
          setErroSinc(`A sincronização terminou com falhas parciais:\n` + data.stats.erros.slice(0, 3).join('\n') + (data.stats.erros.length > 3 ? `\n... e mais ${data.stats.erros.length - 3} erros.` : ''))
        }
      } catch (err: any) {
        console.error(err)
        setErroSinc(err.message)
      } finally {
        setSincronizando(false)
      }
    } else {
      setMensagemStatus('Sincronizando contas a pagar com o Bling ERP... Por favor, aguarde.')
      try {
        const response = await fetch(`/api/bling/sync?tabela=contas_pagar&dataInicio=${dataInicioCP}&dataFim=${dataFimCP}&tipoData=${tipoDataCP}`, {
          method: 'POST',
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Falha inesperada ao executar importação.')
        }

        setMensagemStatus('Sincronização concluída com sucesso!')
        setSucessoSinc({
          nfe_importadas: data.stats?.contas_importadas ?? 0, // Novas importadas
          nfe_atualizadas: data.stats?.contas_atualizadas ?? 0, // Atualizadas
          nfe_ignoradas: data.stats?.contas_ignoradas ?? 0, // Ignoradas
          nfce_importadas: 0,
          nfce_atualizadas: 0,
          nfce_ignoradas: 0,
        })

        await carregarContasPagar()

        if (data.stats?.erros && data.stats.erros.length > 0) {
          setErroSinc(`A sincronização terminou com falhas parciais:\n` + data.stats.erros.slice(0, 3).join('\n') + (data.stats.erros.length > 3 ? `\n... e mais ${data.stats.erros.length - 3} erros.` : ''))
        }
      } catch (err: any) {
        console.error(err)
        setErroSinc(err.message)
      } finally {
        setSincronizando(false)
      }
    }
  }

  // Formatador monetário
  const formatarReal = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  return (
    <PageContainer titulo={abaAtiva === 'nfe' ? "Importação de Notas Fiscais" : "Importação de Contas a Pagar"}>

      <div className="importacao">
        
        {/* Abas Premium de Navegação */}
        <div className="importacao__abas">
          <button
            className={`importacao__aba-botao ${abaAtiva === 'nfe' ? 'importacao__aba-botao--ativa' : ''}`}
            onClick={() => {
              setAbaAtiva('nfe')
              setErroSinc(null)
              setSucessoSinc(null)
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            Notas Fiscais
          </button>
          <button
            className={`importacao__aba-botao ${abaAtiva === 'contas_pagar' ? 'importacao__aba-botao--ativa' : ''}`}
            onClick={() => {
              setAbaAtiva('contas_pagar')
              setErroSinc(null)
              setSucessoSinc(null)
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            Contas a Pagar
          </button>
        </div>

        {abaAtiva === 'nfe' ? (
          <>
            {/* Painel de Filtro de Período e Ação de Importação de NFe */}
            <section className="importacao__painel-controle">
              <h2 className="importacao__tabela-titulo">Carga de Notas Fiscais (Bling ERP)</h2>
              <div className="importacao__controle-linha">
                <div className="importacao__input-grupo">
                  <label htmlFor="dataInicioImportacao">Data de Emissão (Início)</label>
                  <input
                    id="dataInicioImportacao"
                    type="date"
                    value={dataInicioImportacao}
                    onChange={(e) => setDataInicioImportacao(e.target.value)}
                    disabled={sincronizando}
                  />
                </div>
                <div className="importacao__input-grupo">
                  <label htmlFor="dataFimImportacao">Data de Emissão (Fim)</label>
                  <input
                    id="dataFimImportacao"
                    type="date"
                    value={dataFimImportacao}
                    onChange={(e) => setDataFimImportacao(e.target.value)}
                    disabled={sincronizando}
                  />
                </div>
                <div className="importacao__input-grupo">
                  <label htmlFor="tipoNotaImportacao">Tipo de Documento</label>
                  <select
                    id="tipoNotaImportacao"
                    value={tipoNotaImportacao}
                    onChange={(e) => setTipoNotaImportacao(e.target.value as any)}
                    disabled={sincronizando}
                  >
                    <option value="todas">Ambos (NF-e & NFC-e)</option>
                    <option value="nfe">Somente NF-e</option>
                    <option value="nfce">Somente NFC-e</option>
                  </select>
                </div>
                <button
                  onClick={dispararImportacao}
                  disabled={sincronizando}
                  className={`importacao__botao-disparar ${sincronizando ? 'importacao__botao-disparar--carregando' : ''}`}
                >
                  {sincronizando ? 'Sincronizando...' : 'Disparar Importação'}
                </button>
              </div>

              {/* Feedbacks de Progresso e Resultado */}
              {sincronizando && (
                <div className="importacao__status-progresso">
                  <div className="importacao__spinner"></div>
                  <span className="importacao__status-texto">{mensagemStatus}</span>
                  <p className="importacao__status-subhint">
                    Buscando em lotes e aplicando throttling de 250ms por nota para proteger a conexão com o Bling. Por favor, aguarde.
                  </p>
                </div>
              )}

              {sucessoSinc && (
                <div className="importacao__alerta importacao__alerta--sucesso">
                  <span className="importacao__sucesso-titulo">Sincronização concluída com sucesso!</span>
                  <div className="importacao__sucesso-grade">
                    <div className="importacao__sucesso-item">
                      <strong>NF-e:</strong> {sucessoSinc.nfe_importadas} novas importadas, {sucessoSinc.nfe_atualizadas} atualizadas, {sucessoSinc.nfe_ignoradas} ignoradas (já existiam no banco).
                    </div>
                    <div className="importacao__sucesso-item">
                      <strong>NFC-e:</strong> {sucessoSinc.nfce_importadas} novas importadas, {sucessoSinc.nfce_atualizadas} atualizadas, {sucessoSinc.nfce_ignoradas} ignoradas (já existiam no banco).
                    </div>
                  </div>
                </div>
              )}

              {erroSinc && (
                <div className="importacao__alerta importacao__alerta--erro">
                  Erro ao realizar importação: {erroSinc}
                  <p className="importacao__alerta-hint">
                    Certifique-se de que a conexão da API do Bling esteja ativa e válida em <strong>Integrações → Bling ERP</strong>.
                  </p>
                </div>
              )}
            </section>

            {/* Painel Exibição & Estatísticas reativo NFe */}
            <div className="importacao__exibicao-filtros">
              <h2 className="importacao__exibicao-titulo">Exibição & Estatísticas do Banco</h2>
              <div className="importacao__filtros-grade">
                <div className="importacao__input-grupo-horizontal">
                  <label htmlFor="periodoExibicao">Período</label>
                  <select
                    id="periodoExibicao"
                    value={tipoFiltroPeriodo}
                    onChange={(e) => setTipoFiltroPeriodo(e.target.value as any)}
                    className="importacao__filtro-select"
                  >
                    <option value="este_mes">Este Mês</option>
                    <option value="mes_anterior">Mês Anterior</option>
                    <option value="customizado">Customizável</option>
                  </select>
                </div>
                <div className="importacao__input-grupo-horizontal">
                  <label htmlFor="exibicaoDataInicio">De</label>
                  <input
                    id="exibicaoDataInicio"
                    type="date"
                    value={exibicaoDataInicio}
                    onChange={(e) => setExibicaoDataInicio(e.target.value)}
                    disabled={tipoFiltroPeriodo !== 'customizado'}
                  />
                </div>
                <div className="importacao__input-grupo-horizontal">
                  <label htmlFor="exibicaoDataFim">Até</label>
                  <input
                    id="exibicaoDataFim"
                    type="date"
                    value={exibicaoDataFim}
                    onChange={(e) => setExibicaoDataFim(e.target.value)}
                    disabled={tipoFiltroPeriodo !== 'customizado'}
                  />
                </div>
              </div>
            </div>

            {/* Cards Estatísticos NFe */}
            <section className="importacao__cards-grade">
              <div className="importacao__card importacao__card--nfe">
                <span className="importacao__card-subtitulo">Notas Fiscais Eletrônicas (NF-e)</span>
                <h3 className="importacao__card-titulo">{stats.nfe_total} emitidas</h3>
                <div className="importacao__card-valores">
                  <span>Valor Total:</span>
                  <strong className="importacao__card-destaque">{formatarReal(stats.nfe_valor)}</strong>
                </div>
                <div className="importacao__card-registro-recente">
                  <span>Última Importada:</span>
                  <strong>
                    {ultimoRegistroNfe ? `Nº ${ultimoRegistroNfe.numero} (${formatarData(ultimoRegistroNfe.data)})` : '—'}
                  </strong>
                </div>
              </div>

              <div className="importacao__card importacao__card--nfce">
                <span className="importacao__card-subtitulo">Notas de Consumidor (NFC-e)</span>
                <h3 className="importacao__card-titulo">{stats.nfce_total} emitidas</h3>
                <div className="importacao__card-valores">
                  <span>Valor Total:</span>
                  <strong className="importacao__card-destaque">{formatarReal(stats.nfce_valor)}</strong>
                </div>
                <div className="importacao__card-registro-recente">
                  <span>Última Importada:</span>
                  <strong>
                    {ultimoRegistroNfce ? `Nº ${ultimoRegistroNfce.numero} (${formatarData(ultimoRegistroNfce.data)})` : '—'}
                  </strong>
                </div>
              </div>
            </section>

            {/* Lista e Filtros NFe */}
            <section className="importacao__historico-secao">
              <div className="importacao__tabela-cabecalho">
                <h2 className="importacao__tabela-titulo">Notas Fiscais no Banco</h2>
                
                <div className="importacao__filtros-grade">
                  <input
                    type="text"
                    placeholder="Buscar por número ou cliente..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="importacao__busca-input"
                  />
                  
                  <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="importacao__filtro-select">
                    <option value="todos">Todos os Tipos</option>
                    <option value="nfe">Somente NF-e</option>
                    <option value="nfce">Somente NFC-e</option>
                  </select>

                  <select value={filtroSituacao} onChange={(e) => setFiltroSituacao(e.target.value)} className="importacao__filtro-select">
                    <option value="todos">Todas as Situações</option>
                    <option value="autorizada">Autorizadas / Emitidas</option>
                    <option value="pendente">Pendentes</option>
                    <option value="cancelada">Canceladas</option>
                    <option value="outras">Outras Situações</option>
                  </select>
                </div>
              </div>

              {carregandoNotas ? (
                <div className="importacao__carregando-tabela">
                  <div className="importacao__spinner"></div>
                  <span>Carregando notas do banco...</span>
                </div>
              ) : notas.length > 0 ? (
                <>
                  <div className="importacao__tabela-wrapper">
                    <table className="importacao__tabela">
                      <thead>
                        <tr>
                          <th>ID Bling</th>
                          <th>Número</th>
                          <th>Série</th>
                          <th>Tipo</th>
                          <th>Cliente</th>
                          <th>Valor</th>
                          <th>Emissão</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {notas.map((nota) => {
                          const situacaoObj = SITUACOES_MAP[nota.situacao ?? 0] ?? { texto: `Código ${nota.situacao}`, variante: 'inativo' }
                          return (
                            <tr key={nota.id}>
                              <td className="importacao__tabela-monospaced">{nota.id}</td>
                              <td>{nota.numero ?? '—'}</td>
                              <td>{nota.serie ?? '—'}</td>
                              <td>
                                <Badge variante={nota.tipo_nota === 'NFe' ? 'info' : 'inativo'}>
                                  {nota.tipo_nota}
                                </Badge>
                              </td>
                              <td className="importacao__tabela-cliente">{nota.contatos?.nome || nota.etiqueta_nome || 'Cliente Não Mapeado'}</td>
                              <td className="importacao__tabela-valor">{formatarReal(nota.valor_nota ?? 0)}</td>
                              <td>
                                {nota.data_emissao
                                  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(nota.data_emissao))
                                  : '—'}
                              </td>
                              <td>
                                <Badge variante={situacaoObj.variante}>
                                  {situacaoObj.texto}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação Premium e Reativa da Tabela NFe */}
                  {totalNotasFiltradas > itensPorPagina && (
                    <div className="importacao__paginacao">
                      <button
                        onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaAtual === 1 || carregandoNotas}
                        className="importacao__paginacao-botao"
                      >
                        Anterior
                      </button>
                      <span className="importacao__paginacao-info">
                        Página <strong>{paginaAtual}</strong> de <strong>{Math.ceil(totalNotasFiltradas / itensPorPagina)}</strong> (Total: {totalNotasFiltradas} notas)
                      </span>
                      <button
                        onClick={() => setPaginaAtual((prev) => Math.min(prev + 1, Math.ceil(totalNotasFiltradas / itensPorPagina)))}
                        disabled={paginaAtual >= Math.ceil(totalNotasFiltradas / itensPorPagina) || carregandoNotas}
                        className="importacao__paginacao-botao"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="importacao__tabela-vazia">
                  <svg className="importacao__vazia-icone" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.7 }}>
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p className="importacao__vazia-titulo">Nenhuma nota fiscal localizada</p>
                  <p className="importacao__vazia-desc">
                    Não encontramos notas fiscais correspondentes aos filtros ativos ou não há dados carregados para o período selecionado.
                  </p>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* Painel de Filtro de Período e Ação de Importação de Contas a Pagar */}
            <section className="importacao__painel-controle">
              <h2 className="importacao__tabela-titulo">Carga de Contas a Pagar (Bling ERP)</h2>
              <div className="importacao__controle-linha">
                <div className="importacao__input-grupo">
                  <label htmlFor="dataInicioCP">Data (Início)</label>
                  <input
                    id="dataInicioCP"
                    type="date"
                    value={dataInicioCP}
                    onChange={(e) => setDataInicioCP(e.target.value)}
                    disabled={sincronizando}
                  />
                </div>
                <div className="importacao__input-grupo">
                  <label htmlFor="dataFimCP">Data (Fim)</label>
                  <input
                    id="dataFimCP"
                    type="date"
                    value={dataFimCP}
                    onChange={(e) => setDataFimCP(e.target.value)}
                    disabled={sincronizando}
                  />
                </div>
                <div className="importacao__input-grupo">
                  <label htmlFor="tipoDataCP">Filtrar no Bling por</label>
                  <select
                    id="tipoDataCP"
                    value={tipoDataCP}
                    onChange={(e) => setTipoDataCP(e.target.value as any)}
                    disabled={sincronizando}
                  >
                    <option value="vencimento">Data de Vencimento</option>
                    <option value="emissao">Data de Emissão</option>
                    <option value="pagamento">Data de Pagamento</option>
                  </select>
                </div>
                <button
                  onClick={dispararImportacao}
                  disabled={sincronizando}
                  className={`importacao__botao-disparar ${sincronizando ? 'importacao__botao-disparar--carregando' : ''}`}
                >
                  {sincronizando ? 'Sincronizando...' : 'Disparar Importação'}
                </button>
              </div>

              {/* Feedbacks de Progresso e Resultado CP */}
              {sincronizando && (
                <div className="importacao__status-progresso">
                  <div className="importacao__spinner"></div>
                  <span className="importacao__status-texto">{mensagemStatus}</span>
                  <p className="importacao__status-subhint">
                    Buscando em lotes e aplicando throttling de 250ms por conta para proteger a conexão com o Bling. Por favor, aguarde.
                  </p>
                </div>
              )}

              {sucessoSinc && (
                <div className="importacao__alerta importacao__alerta--sucesso">
                  <span className="importacao__sucesso-titulo">Sincronização concluída com sucesso!</span>
                  <div className="importacao__sucesso-grade">
                    <div className="importacao__sucesso-item">
                      <strong>Contas a Pagar:</strong> {sucessoSinc.nfe_importadas} novas contas importadas, {sucessoSinc.nfe_atualizadas} atualizadas, {sucessoSinc.nfe_ignoradas} ignoradas (já existiam no banco).
                    </div>
                  </div>
                </div>
              )}

              {erroSinc && (
                <div className="importacao__alerta importacao__alerta--erro">
                  Erro ao realizar importação: {erroSinc}
                  <p className="importacao__alerta-hint">
                    Certifique-se de que a conexão da API do Bling esteja ativa e válida em <strong>Integrações → Bling ERP</strong>.
                  </p>
                </div>
              )}
            </section>

            {/* Painel Exibição & Estatísticas reativo CP */}
            <div className="importacao__exibicao-filtros">
              <h2 className="importacao__exibicao-titulo">Exibição & Estatísticas do Banco</h2>
              <div className="importacao__filtros-grade">
                <div className="importacao__input-grupo-horizontal">
                  <label htmlFor="periodoExibicaoCP">Período</label>
                  <select
                    id="periodoExibicaoCP"
                    value={tipoFiltroPeriodoCP}
                    onChange={(e) => setTipoFiltroPeriodoCP(e.target.value as any)}
                    className="importacao__filtro-select"
                  >
                    <option value="este_mes">Este Mês</option>
                    <option value="mes_anterior">Mês Anterior</option>
                    <option value="customizado">Customizável</option>
                  </select>
                </div>
                <div className="importacao__input-grupo-horizontal">
                  <label htmlFor="exibicaoDataInicioCP">De</label>
                  <input
                    id="exibicaoDataInicioCP"
                    type="date"
                    value={exibicaoDataInicioCP}
                    onChange={(e) => setExibicaoDataInicioCP(e.target.value)}
                    disabled={tipoFiltroPeriodoCP !== 'customizado'}
                  />
                </div>
                <div className="importacao__input-grupo-horizontal">
                  <label htmlFor="exibicaoDataFimCP">Até</label>
                  <input
                    id="exibicaoDataFimCP"
                    type="date"
                    value={exibicaoDataFimCP}
                    onChange={(e) => setExibicaoDataFimCP(e.target.value)}
                    disabled={tipoFiltroPeriodoCP !== 'customizado'}
                  />
                </div>
              </div>
            </div>

            {/* Cards Estatísticos CP */}
            <section className="importacao__cards-grade">
              <div className="importacao__card importacao__card--nfe">
                <span className="importacao__card-subtitulo">Contas em Aberto</span>
                <h3 className="importacao__card-titulo">{statsCP.aberto_total} lançamentos</h3>
                <div className="importacao__card-valores">
                  <span>Total em Aberto:</span>
                  <strong className="importacao__card-destaque">{formatarReal(statsCP.aberto_valor)}</strong>
                </div>
                <div className="importacao__card-registro-recente">
                  <span>Contas Canceladas:</span>
                  <strong>{statsCP.cancelado_total} contas</strong>
                </div>
              </div>

              <div className="importacao__card importacao__card--contas">
                <span className="importacao__card-subtitulo">Contas Pagas / Liquidadas</span>
                <h3 className="importacao__card-titulo">{statsCP.pago_total} liquidadas</h3>
                <div className="importacao__card-valores">
                  <span>Total Pago:</span>
                  <strong className="importacao__card-destaque">{formatarReal(statsCP.pago_valor)}</strong>
                </div>
                <div className="importacao__card-registro-recente">
                  <span>Última Importada:</span>
                  <strong>
                    {ultimoRegistroCP ? `${ultimoRegistroCP.numero_documento} (${formatarReal(ultimoRegistroCP.valor)})` : '—'}
                  </strong>
                </div>
              </div>
            </section>

            {/* Lista e Filtros CP */}
            <section className="importacao__historico-secao">
              <div className="importacao__tabela-cabecalho">
                <h2 className="importacao__tabela-titulo">Contas a Pagar no Banco</h2>
                
                <div className="importacao__filtros-grade">
                  <input
                    type="text"
                    placeholder="Buscar documento ou histórico..."
                    value={buscaCP}
                    onChange={(e) => setBuscaCP(e.target.value)}
                    className="importacao__busca-input"
                  />

                  <select value={filtroSituacaoCP} onChange={(e) => setFiltroSituacaoCP(e.target.value)} className="importacao__filtro-select">
                    <option value="todos">Todas as Situações</option>
                    <option value="1">Em Aberto</option>
                    <option value="2">Pagas</option>
                    <option value="3">Parcialmente Pagas</option>
                    <option value="4">Devolvidas</option>
                    <option value="5">Canceladas</option>
                  </select>
                </div>
              </div>

              {carregandoContas ? (
                <div className="importacao__carregando-tabela">
                  <div className="importacao__spinner"></div>
                  <span>Carregando contas a pagar...</span>
                </div>
              ) : contas.length > 0 ? (
                <>
                  <div className="importacao__tabela-wrapper">
                    <table className="importacao__tabela">
                      <thead>
                        <tr>
                          <th>ID Bling</th>
                          <th>Nº Documento</th>
                          <th>Favorecido / Fornecedor</th>
                          <th>Emissão</th>
                          <th>Vencimento</th>
                          <th>Valor</th>
                          <th>Saldo</th>
                          <th>Situação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contas.map((conta) => {
                          const situacaoObj = SITUACOES_CP_MAP[conta.situacao ?? 0] ?? { texto: `Código ${conta.situacao}`, variante: 'inativo' }
                          return (
                            <tr key={conta.id}>
                              <td className="importacao__tabela-monospaced">{conta.id}</td>
                              <td>{conta.numero_documento || '—'}</td>
                              <td className="importacao__tabela-cliente">{conta.contato_nome}</td>
                              <td>
                                {conta.data_emissao
                                  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(conta.data_emissao))
                                  : '—'}
                              </td>
                              <td>
                                {conta.vencimento
                                  ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(conta.vencimento))
                                  : '—'}
                              </td>
                              <td className="importacao__tabela-valor">{formatarReal(conta.valor ?? 0)}</td>
                              <td>{formatarReal(conta.saldo ?? 0)}</td>
                              <td>
                                <Badge variante={situacaoObj.variante}>
                                  {situacaoObj.texto}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginação CP */}
                  {totalContasFiltradas > itensPorPagina && (
                    <div className="importacao__paginacao">
                      <button
                        onClick={() => setPaginaAtualCP((prev) => Math.max(prev - 1, 1))}
                        disabled={paginaAtualCP === 1 || carregandoContas}
                        className="importacao__paginacao-botao"
                      >
                        Anterior
                      </button>
                      <span className="importacao__paginacao-info">
                        Página <strong>{paginaAtualCP}</strong> de <strong>{Math.ceil(totalContasFiltradas / itensPorPagina)}</strong> (Total: {totalContasFiltradas} contas)
                      </span>
                      <button
                        onClick={() => setPaginaAtualCP((prev) => Math.min(prev + 1, Math.ceil(totalContasFiltradas / itensPorPagina)))}
                        disabled={paginaAtualCP >= Math.ceil(totalContasFiltradas / itensPorPagina) || carregandoContas}
                        className="importacao__paginacao-botao"
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="importacao__tabela-vazia">
                  <svg className="importacao__vazia-icone" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.7 }}>
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                  <p className="importacao__vazia-titulo">Nenhuma conta a pagar localizada</p>
                  <p className="importacao__vazia-desc">
                    Não encontramos contas a pagar correspondentes aos filtros ativos ou não há dados carregados para o período selecionado.
                  </p>
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </PageContainer>
  )
}
