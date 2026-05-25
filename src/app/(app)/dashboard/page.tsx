'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import './Dashboard.css'

interface ItemNotaFiscal {
  id: string
  codigo: string
  descricao: string
  quantidade: number
  valor: number
  valor_total: number
}

interface NaturezaOperacao {
  id: number
  descricao: string
  nome_customizado: string | null
}

interface NotaFiscal {
  id: number
  numero: string
  data_emissao: string
  valor_nota: number
  valor_frete: number
  tipo_nota: 'NFe' | 'NFCe'
  situacao: number
  natureza_operacao_id: number | null
  nfe_itens: ItemNotaFiscal[]
}

/**
 * Página principal do Dashboard Comercial.
 * Exibe métricas de notas fiscais, fretes, gráficos de faturamento por natureza,
 * distribuição por tamanho de produto e produtos mais vendidos.
 * Possui filtros globais de período, situação e naturezas de operação (múltipla escolha).
 * Desenvolvido seguindo as regras de nomenclatura em Português BR.
 */
export default function PaginaDashboardComercial() {
  // Estados para filtros
  const [tipoPeriodo, definirTipoPeriodo] = useState<string>('mes-atual')
  const [dataInicio, definirDataInicio] = useState<string>('')
  const [dataFim, definirDataFim] = useState<string>('')
  const [situacaoFiltro, definirSituacaoFiltro] = useState<string>('autorizada') // Padrão: Autorizadas / Emitidas

  // Estado do filtro global de Naturezas de Operação (múltipla escolha)
  const [naturezasSelecionadas, definirNaturezasSelecionadas] = useState<string[]>([])
  const [naturezasDropdownAberto, definirNaturezasDropdownAberto] = useState<boolean>(false)

  // Estados de dados e carregamento
  const [notasFiscais, definirNotasFiscais] = useState<NotaFiscal[]>([])
  const [naturezasCadastradas, definirNaturezasCadastradas] = useState<NaturezaOperacao[]>([])
  const [carregando, definirCarregando] = useState<boolean>(true)
  const [erro, definirErro] = useState<string | null>(null)

  const clienteSupabase = createClient() as any

  // Função auxiliar para alternar a seleção de naturezas de operação
  const alternarNatureza = (id: string) => {
    definirNaturezasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Determinar datas com base no período selecionado
  useEffect(() => {
    const obterDatasPadrao = () => {
      const agora = new Date() // Data atual do sistema
      let inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
      let fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)

      if (tipoPeriodo === 'mes-passado') {
        inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
        fim = new Date(agora.getFullYear(), agora.getMonth(), 0)
      } else if (tipoPeriodo === 'ultimos-30') {
        inicio = new Date()
        inicio.setDate(agora.getDate() - 30)
        fim = agora
      } else if (tipoPeriodo === 'ultimos-90') {
        inicio = new Date()
        inicio.setDate(agora.getDate() - 90)
        fim = agora
      }

      const formatarDataISO = (d: Date) => {
        const ano = d.getFullYear()
        const mes = String(d.getMonth() + 1).padStart(2, '0')
        const dia = String(d.getDate()).padStart(2, '0')
        return `${ano}-${mes}-${dia}`
      }

      if (tipoPeriodo !== 'periodo-customizado') {
        definirDataInicio(formatarDataISO(inicio))
        definirDataFim(formatarDataISO(fim))
      }
    };

    obterDatasPadrao()
  }, [tipoPeriodo])

  // Buscar dados no Supabase ao alterar filtros de datas ou situação
  useEffect(() => {
    async function carregarDadosDashboard() {
      if (!dataInicio || !dataFim) return

      try {
        definirCarregando(true)
        definirErro(null)

        // 1. Carregar Naturezas de Operação cadastradas para o mapeamento
        const { data: dadosNaturezas, error: erroNaturezas } = await clienteSupabase
          .from('naturezas_operacao')
          .select('id, descricao, nome_customizado')

        if (erroNaturezas) throw erroNaturezas
        definirNaturezasCadastradas(dadosNaturezas || [])

        // Converter datas para formato de texto compatível com TIMESTAMP sem fuso horário
        const inicioFormatado = `${dataInicio} 00:00:00`
        const fimFormatado = `${dataFim} 23:59:59`

        // 2. Query de Notas Fiscais paginada para superar o limite de 1000 registros do Supabase
        let todosDadosNotas: NotaFiscal[] = []
        let de = 0
        const limiteLote = 1000

        while (true) {
          let consulta = clienteSupabase
            .from('nfe')
            .select(`
              id,
              numero,
              data_emissao,
              valor_nota,
              valor_frete,
              tipo_nota,
              situacao,
              natureza_operacao_id,
              nfe_itens (
                id,
                codigo,
                descricao,
                quantidade,
                valor,
                valor_total
              )
            `)
            .gte('data_emissao', inicioFormatado)
            .lte('data_emissao', fimFormatado)
            .range(de, de + limiteLote - 1)

          if (situacaoFiltro === 'autorizada') {
            consulta = consulta.in('situacao', [5, 6, 7])
          } else if (situacaoFiltro === 'cancelada') {
            consulta = consulta.eq('situacao', 2)
          } else if (situacaoFiltro === 'pendente') {
            consulta = consulta.eq('situacao', 1)
          }

          const { data: dadosNotas, error: erroNotas } = await consulta

          if (erroNotas) throw erroNotas
          if (!dadosNotas || dadosNotas.length === 0) break

          todosDadosNotas = [...todosDadosNotas, ...dadosNotas]

          if (dadosNotas.length < limiteLote) break
          de += limiteLote
        }

        definirNotasFiscais(todosDadosNotas)
      } catch (err: any) {
        console.error('Erro ao carregar dados do dashboard:', err)
        console.error('Detalhes do erro:', {
          mensagem: err?.message,
          detalhes: err?.details,
          dica: err?.hint,
          codigo: err?.code
        })
        definirErro(`Não foi possível carregar as informações do dashboard: ${err?.message || 'Erro desconhecido'} (${err?.code || 'S/C'}). ${err?.details || ''}`)
      } finally {
        definirCarregando(false)
      }
    }

    carregarDadosDashboard()
  }, [dataInicio, dataFim, situacaoFiltro])

  // Função auxiliar para formatar valores em Reais (BRL)
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  // Função auxiliar para extrair o tamanho da descrição do produto
  const extrairTamanhoProduto = (descricao: string): string => {
    if (!descricao) return 'N/A'
    // Regex para buscar "Tamanho:P", "Tamanho: GG", "Tamanho:38", etc.
    const correspondencia = descricao.match(/Tamanho\s*:\s*([a-zA-Z0-9\-]+)/i)
    if (correspondencia && correspondencia[1]) {
      return correspondencia[1].trim().toUpperCase()
    }
    return 'N/A'
  }

  // --- FILTRAGEM GLOBAL POR NATUREZAS SELECIONADAS ---
  const notasFiltradas = notasFiscais.filter((nota) => {
    if (naturezasSelecionadas.length === 0) return true
    const chave = nota.natureza_operacao_id ? String(nota.natureza_operacao_id) : 'sem-natureza'
    return naturezasSelecionadas.includes(chave)
  })

  // --- CÁLCULO DE MÉTRICAS E CARDS ACUMULADOS ---
  const notasNFe = notasFiltradas.filter((n) => n.tipo_nota === 'NFe')
  const notasNFCe = notasFiltradas.filter((n) => n.tipo_nota === 'NFCe')

  const totalNFeQuantidade = notasNFe.length
  const totalNFeValor = notasNFe.reduce((total, n) => total + (Number(n.valor_nota) || 0), 0)

  const totalNFCeQuantidade = notasNFCe.length
  const totalNFCeValor = notasNFCe.reduce((total, n) => total + (Number(n.valor_nota) || 0), 0)

  const valorTotalFrete = notasFiltradas.reduce((total, n) => total + (Number(n.valor_frete) || 0), 0)
  const faturamentoConsolidado = totalNFeValor + totalNFCeValor

  // --- CÁLCULO DE FATURAMENTO POR NATUREZA DE OPERAÇÃO ---
  const obterFaturamentoPorNatureza = () => {
    const mapaNaturezas: Record<string, { nome: string; valor: number }> = {}

    notasFiltradas.forEach((nota) => {
      const valor = Number(nota.valor_nota) || 0
      const chave = nota.natureza_operacao_id ? String(nota.natureza_operacao_id) : 'sem-natureza'
      
      // Encontra a natureza correspondente no estado local naturezasCadastradas
      const nat = naturezasCadastradas.find((n) => String(n.id) === chave)
      const nome = nat ? (nat.nome_customizado || nat.descricao) : 'Sem Natureza Cadastrada'

      if (!mapaNaturezas[chave]) {
        mapaNaturezas[chave] = { nome, valor: 0 }
      }
      mapaNaturezas[chave].valor += valor
    })

    return Object.values(mapaNaturezas).sort((a, b) => b.valor - a.valor)
  }

  const faturamentoPorNatureza = obterFaturamentoPorNatureza()
  const maiorFaturamentoNatureza = faturamentoPorNatureza.length > 0 ? faturamentoPorNatureza[0].valor : 1

  // --- CÁLCULO DE DISTRIBUIÇÃO POR TAMANHO DE PRODUTO ---
  const obterDistribuicaoPorTamanho = () => {
    const mapaTamanhos: Record<string, number> = {}

    notasFiltradas.forEach((nota) => {
      nota.nfe_itens?.forEach((item) => {
        const quantidade = Number(item.quantidade) || 0
        const tamanho = extrairTamanhoProduto(item.descricao)
        // Ignora produtos sem tamanho (N/A)
        if (tamanho && tamanho !== 'N/A') {
          mapaTamanhos[tamanho] = (mapaTamanhos[tamanho] || 0) + quantidade
        }
      })
    })

    // Ordenar de forma lógica: PP, P, M, G, GG, XG, EG
    const ordemTamanhos = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'EG']
    
    return Object.entries(mapaTamanhos)
      .map(([tamanho, quantidade]) => ({ tamanho, quantidade }))
      .sort((a, b) => {
        const idxA = ordemTamanhos.indexOf(a.tamanho)
        const idxB = ordemTamanhos.indexOf(b.tamanho)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return b.quantidade - a.quantidade // Fallback por quantidade
      })
  }

  const distribuicaoTamanhos = obterDistribuicaoPorTamanho()
  const maiorQuantidadeTamanho = distribuicaoTamanhos.length > 0 ? Math.max(...distribuicaoTamanhos.map((t) => t.quantidade)) : 1

  // --- CÁLCULO DE PRODUTOS MAIS VENDIDOS ---
  const obterProdutosMaisVendidos = () => {
    const mapaProdutos: Record<string, { codigo: string; descricao: string; quantidade: number; valorTotal: number; tamanho: string }> = {}

    notasFiltradas.forEach((nota) => {
      nota.nfe_itens?.forEach((item) => {
        const chave = item.codigo || item.descricao
        const quantidade = Number(item.quantidade) || 0
        const valorTotal = Number(item.valor_total) || 0
        const tamanho = extrairTamanhoProduto(item.descricao)

        if (!mapaProdutos[chave]) {
          mapaProdutos[chave] = {
            codigo: item.codigo || 'S/C',
            descricao: item.descricao?.split(' Tamanho:')[0]?.split(';Tamanho:')[0] || 'Produto sem descrição',
            quantidade: 0,
            valorTotal: 0,
            tamanho
          }
        }

        mapaProdutos[chave].quantidade += quantidade
        mapaProdutos[chave].valorTotal += valorTotal
      })
    })

    return Object.values(mapaProdutos)
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10) // Trazer os top 10 produtos
  }

  const produtosMaisVendidos = obterProdutosMaisVendidos()

  // --- PRÉ-FILTRAGEM DE NATUREZAS DE OPERAÇÃO COM MOVIMENTAÇÃO NO PERÍODO ---
  const naturezasComMovimentacao = naturezasCadastradas.filter((nat) => {
    return notasFiscais.some((nota) => String(nota.natureza_operacao_id) === String(nat.id))
  })

  const temNotasSemNatureza = notasFiscais.some((nota) => !nota.natureza_operacao_id)

  return (
    <div className="dashboard-comercial">
      {/* Cabeçalho do Dashboard */}
      <header className="dashboard-comercial__cabecalho">
        <div className="dashboard-comercial__cabecalho-texto">
          <h1 className="dashboard-comercial__titulo">Dashboard Comercial</h1>
          <p className="dashboard-comercial__subtitulo">
            Acompanhe o desempenho de vendas, faturamento de notas e fretes em tempo real.
          </p>
        </div>
      </header>

      {/* Painel de Filtros Globais */}
      <section className="dashboard-comercial__painel-filtros">
        <div className="painel-filtros__grupo">
          <label className="painel-filtros__label">Filtro de Período</label>
          <select
            className="painel-filtros__input"
            value={tipoPeriodo}
            onChange={(e) => definirTipoPeriodo(e.target.value)}
          >
            <option value="mes-atual">Este Mês (Atual)</option>
            <option value="mes-passado">Mês Passado</option>
            <option value="ultimos-30">Últimos 30 dias</option>
            <option value="ultimos-90">Últimos 90 dias</option>
            <option value="periodo-customizado">Período Customizado</option>
          </select>
        </div>

        {tipoPeriodo === 'periodo-customizado' && (
          <>
            <div className="painel-filtros__grupo">
              <label className="painel-filtros__label">Data Início</label>
              <input
                type="date"
                className="painel-filtros__input"
                value={dataInicio}
                onChange={(e) => definirDataInicio(e.target.value)}
              />
            </div>
            <div className="painel-filtros__grupo">
              <label className="painel-filtros__label">Data Fim</label>
              <input
                type="date"
                className="painel-filtros__input"
                value={dataFim}
                onChange={(e) => definirDataFim(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="painel-filtros__grupo">
          <label className="painel-filtros__label">Situação da Nota</label>
          <select
            className="painel-filtros__input"
            value={situacaoFiltro}
            onChange={(e) => definirSituacaoFiltro(e.target.value)}
          >
            <option value="todas">Todas as Situações</option>
            <option value="autorizada">Autorizadas / Emitidas</option>
            <option value="pendente">Pendentes</option>
            <option value="cancelada">Canceladas</option>
          </select>
        </div>

        {/* Novo Filtro Global Multi-Select de Natureza de Operação */}
        <div className="painel-filtros__grupo painel-filtros__grupo--multi">
          <label className="painel-filtros__label">Natureza de Operação</label>
          <div className="dropdown-multi">
            <button
              type="button"
              className="dropdown-multi__botao"
              onClick={() => definirNaturezasDropdownAberto(!naturezasDropdownAberto)}
            >
              <span className="dropdown-multi__selecionados">
                {naturezasSelecionadas.length === 0
                  ? 'Todas as Naturezas'
                  : naturezasSelecionadas.length === 1
                  ? naturezasCadastradas.find((n) => String(n.id) === naturezasSelecionadas[0])?.nome_customizado ||
                    naturezasCadastradas.find((n) => String(n.id) === naturezasSelecionadas[0])?.descricao ||
                    '1 Selecionada'
                  : `${naturezasSelecionadas.length} selecionadas`}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`dropdown-multi__seta ${naturezasDropdownAberto ? 'dropdown-multi__seta--aberta' : ''}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {naturezasDropdownAberto && (
              <>
                <div className="dropdown-multi__backdrop" onClick={() => definirNaturezasDropdownAberto(false)} />
                <div className="dropdown-multi__conteudo">
                  <button
                    type="button"
                    className="dropdown-multi__opcao-limpar"
                    onClick={() => definirNaturezasSelecionadas([])}
                  >
                    Limpar Seleção (Todas)
                  </button>
                  <div className="dropdown-multi__lista">
                    {naturezasComMovimentacao.length === 0 && !temNotasSemNatureza ? (
                      <div className="dropdown-multi__vazio">
                        Nenhuma natureza com movimentação.
                      </div>
                    ) : (
                      <>
                        {naturezasComMovimentacao.map((nat) => {
                          const idStr = String(nat.id)
                          const selecionado = naturezasSelecionadas.includes(idStr)
                          return (
                            <label key={nat.id} className="dropdown-multi__opcao">
                              <input
                                type="checkbox"
                                className="dropdown-multi__checkbox"
                                checked={selecionado}
                                onChange={() => alternarNatureza(idStr)}
                              />
                              <span className="dropdown-multi__texto">
                                {nat.nome_customizado || nat.descricao}
                              </span>
                            </label>
                          )
                        })}
                        {/* Opção para Notas sem Natureza mapeada, exibida apenas se houver notas sem natureza */}
                        {temNotasSemNatureza && (
                          <label className="dropdown-multi__opcao">
                            <input
                              type="checkbox"
                              className="dropdown-multi__checkbox"
                              checked={naturezasSelecionadas.includes('sem-natureza')}
                              onChange={() => alternarNatureza('sem-natureza')}
                            />
                            <span className="dropdown-multi__texto">Sem Natureza Cadastrada</span>
                          </label>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {erro && (
        <div className="dashboard-comercial__alerta-erro">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="alerta-erro__icone">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{erro}</span>
        </div>
      )}

      {/* Skeletons de Carregamento */}
      {carregando ? (
        <div className="dashboard-comercial__carregamento">
          <div className="carregamento__kpis">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card-metrica card-metrica--skeleton">
                <div className="skeleton__linha skeleton__linha--titulo" />
                <div className="skeleton__linha skeleton__linha--valor" />
                <div className="skeleton__linha skeleton__linha--subtitulo" />
              </div>
            ))}
          </div>
          <div className="carregamento__graficos">
            <div className="bloco-visualizacao bloco-visualizacao--skeleton">
              <div className="skeleton__linha skeleton__linha--titulo" />
              <div className="skeleton__grafico-barras" />
            </div>
            <div className="bloco-visualizacao bloco-visualizacao--skeleton">
              <div className="skeleton__linha skeleton__linha--titulo" />
              <div className="skeleton__grafico-barras" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Grid de Métricas (KPI Cards) */}
          <section className="dashboard-comercial__grid-metricas">
            {/* Card NF-e */}
            <div className="card-metrica">
              <div className="card-metrica__cabecalho">
                <span className="card-metrica__titulo">NF-e Emitidas</span>
                <div className="card-metrica__icone-wrapper card-metrica__icone-wrapper--azul">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
              </div>
              <p className="card-metrica__valor">{formatarMoeda(totalNFeValor)}</p>
              <div className="card-metrica__subtitulo-grupo">
                <span className="card-metrica__badge card-metrica__badge--azul">{totalNFeQuantidade} notas</span>
                <span className="card-metrica__diferenca-texto">NF-e eletrônicas</span>
              </div>
            </div>

            {/* Card NFC-e */}
            <div className="card-metrica">
              <div className="card-metrica__cabecalho">
                <span className="card-metrica__titulo">NFC-e Emitidas</span>
                <div className="card-metrica__icone-wrapper card-metrica__icone-wrapper--esmeralda">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                </div>
              </div>
              <p className="card-metrica__valor">{formatarMoeda(totalNFCeValor)}</p>
              <div className="card-metrica__subtitulo-grupo">
                <span className="card-metrica__badge card-metrica__badge--esmeralda">{totalNFCeQuantidade} notas</span>
                <span className="card-metrica__diferenca-texto">Nota do Consumidor</span>
              </div>
            </div>

            {/* Card Frete */}
            <div className="card-metrica">
              <div className="card-metrica__cabecalho">
                <span className="card-metrica__titulo">Total de Frete</span>
                <div className="card-metrica__icone-wrapper card-metrica__icone-wrapper--amarelo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
              </div>
              <p className="card-metrica__valor">{formatarMoeda(valorTotalFrete)}</p>
              <div className="card-metrica__subtitulo-grupo">
                <span className="card-metrica__diferenca-texto">Valor acumulado pago em fretes</span>
              </div>
            </div>

            {/* Card Faturamento Consolidado */}
            <div className="card-metrica">
              <div className="card-metrica__cabecalho">
                <span className="card-metrica__titulo">Faturamento Consolidado</span>
                <div className="card-metrica__icone-wrapper card-metrica__icone-wrapper--indigo">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
              <p className="card-metrica__valor">{formatarMoeda(faturamentoConsolidado)}</p>
              <div className="card-metrica__subtitulo-grupo">
                <span className="card-metrica__badge card-metrica__badge--indigo">{notasFiltradas.length} notas no total</span>
                <span className="card-metrica__diferenca-texto">NF-e + NFC-e</span>
              </div>
            </div>
          </section>

          {/* Seção Central de Gráficos */}
          <div className="dashboard-comercial__secao-graficos">
            {/* Gráfico 1: Faturamento por Natureza de Operação */}
            <section className="bloco-visualizacao">
              <div className="bloco-visualizacao__topo">
                <h2 className="bloco-visualizacao__titulo">Faturamento por Natureza de Operação</h2>
              </div>
              <div className="dashboard-grafico__container">
                {faturamentoPorNatureza.length === 0 ? (
                  <div className="dashboard-grafico__vazio">
                    Nenhuma nota fiscal emitida no período para gerar a análise.
                  </div>
                ) : (
                  <div className="grafico-barras-horizontais">
                    {faturamentoPorNatureza.map((item, index) => {
                      const porcentagem = (item.valor / maiorFaturamentoNatureza) * 100
                      return (
                        <div key={index} className="grafico-barras-horizontais__item">
                          <div className="grafico-barras-horizontais__legenda">
                            <span className="grafico-barras-horizontais__nome">{item.nome}</span>
                            <span className="grafico-barras-horizontais__valor">{formatarMoeda(item.valor)}</span>
                          </div>
                          <div className="grafico-barras-horizontais__barra-fundo">
                            <div
                              className="grafico-barras-horizontais__barra-preenchimento"
                              style={{ width: `${porcentagem}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Gráfico 2: Distribuição por Tamanho de Produto Vendido */}
            <section className="bloco-visualizacao">
              <div className="bloco-visualizacao__topo">
                <h2 className="bloco-visualizacao__titulo">Distribuição por Tamanho Vendido</h2>
              </div>
              <div className="dashboard-grafico__container">
                {distribuicaoTamanhos.length === 0 ? (
                  <div className="dashboard-grafico__vazio">
                    Nenhum item vendido no período com tamanho cadastrado.
                  </div>
                ) : (
                  <div className="grafico-barras-verticais">
                    <div className="grafico-barras-verticais__plot">
                      {distribuicaoTamanhos.map((item, index) => {
                        const porcentagem = (item.quantidade / maiorQuantidadeTamanho) * 100
                        return (
                          <div key={index} className="grafico-barras-verticais__coluna">
                            <div className="grafico-barras-verticais__barra-container">
                              <span className="grafico-barras-verticais__rotulo">{item.quantidade} un</span>
                              <div
                                className="grafico-barras-verticais__barra"
                                style={{ height: `${porcentagem}%` }}
                                data-valor={`${item.quantidade} un`}
                              />
                            </div>
                            <span className="grafico-barras-verticais__legenda">{item.tamanho}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Bloco Inferior: Produtos Mais Vendidos */}
          <section className="bloco-visualizacao dashboard-comercial__produtos-bloco">
            <div className="bloco-visualizacao__cabecalho-produtos">
              <div className="bloco-visualizacao__topo">
                <h2 className="bloco-visualizacao__titulo">Produtos Mais Vendidos</h2>
              </div>
            </div>

            <div className="dashboard-comercial__tabela-container">
              {produtosMaisVendidos.length === 0 ? (
                <div className="dashboard-comercial__tabela-vazia">
                  Nenhum produto vendido nesta natureza de operação para o período selecionado.
                </div>
              ) : (
                <table className="tabela-comercial">
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>Código/SKU</th>
                      <th>Descrição do Produto</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Tamanho</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>Quant. Vendida</th>
                      <th style={{ width: '160px', textAlign: 'right' }}>Faturamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {produtosMaisVendidos.map((prod, index) => (
                      <tr key={index}>
                        <td className="tabela-comercial__sku">{prod.codigo}</td>
                        <td className="tabela-comercial__descricao">{prod.descricao}</td>
                        <td className="tabela-comercial__tamanho">
                          <span className={`badge-tamanho badge-tamanho--${prod.tamanho.toLowerCase()}`}>
                            {prod.tamanho}
                          </span>
                        </td>
                        <td className="tabela-comercial__quantidade">{prod.quantidade.toLocaleString('pt-BR')} un</td>
                        <td className="tabela-comercial__faturamento">{formatarMoeda(prod.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
