'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageContainer } from '@/components/layout/PageContainer'
import './Produtos.css'

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

interface ProdutoAgrupado {
  skuBase: string
  descricaoLimpa: string
  quantidade: number
  valorTotal: number
  cor: string | null
  tamanhosVendidos: Record<string, number>
}

type TipoOrdenacao = 'quantidade' | 'valorTotal' | 'descricaoLimpa' | 'skuBase'
type DirecaoOrdenacao = 'asc' | 'desc'

/**
 * Página de Relatório Geral de Produtos Vendidos.
 * Apresenta a listagem dinâmica de produtos vendidos com agrupamento inteligente.
 * Reutiliza os filtros comerciais da dashboard e adiciona buscas locais e drilldown de tamanhos.
 * Desenvolvida em Português BR seguindo os padrões Clean Code e UX do projeto, sem dependências externas de ícones.
 */
export default function PaginaProdutosVendidos() {
  // Estados para filtros comerciais
  const [tipoPeriodo, definirTipoPeriodo] = useState<string>('mes-atual')
  const [dataInicio, definirDataInicio] = useState<string>('')
  const [dataFim, definirDataFim] = useState<string>('')
  const [situacaoFiltro, definirSituacaoFiltro] = useState<string>('autorizada') // Padrão: Autorizadas / Emitidas

  // Estado do filtro de busca textual local
  const [buscaTexto, definirBuscaTexto] = useState<string>('')

  // Estado do filtro global de Naturezas de Operação
  const [naturezasSelecionadas, definirNaturezasSelecionadas] = useState<string[]>([])
  const [naturezasDropdownAberto, definirNaturezasDropdownAberto] = useState<boolean>(false)

  // Estados de dados, carregamento e erros do Supabase
  const [notasFiscais, definirNotasFiscais] = useState<NotaFiscal[]>([])
  const [naturezasCadastradas, definirNaturezasCadastradas] = useState<NaturezaOperacao[]>([])
  const [carregando, definirCarregando] = useState<boolean>(true)
  const [erro, definirErro] = useState<string | null>(null)

  // Estados para controle de accordion (linhas abertas no drilldown)
  const [linhasAbertas, definirLinhasAbertas] = useState<Record<string, boolean>>({})

  // Estados de ordenação da tabela
  const [ordenarPor, definirOrdenarPor] = useState<TipoOrdenacao>('quantidade')
  const [direcaoOrdenacao, definirDirecaoOrdenacao] = useState<DirecaoOrdenacao>('desc')

  const clienteSupabase = createClient() as any

  // Função auxiliar para alternar a seleção de naturezas de operação
  const alternarNatureza = (id: string) => {
    definirNaturezasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Alterna o estado de expansão de uma linha de produto
  const alternarLinha = (chave: string) => {
    definirLinhasAbertas((prev) => ({
      ...prev,
      [chave]: !prev[chave]
    }))
  }

  // Altera a ordenação ao clicar nos cabeçalhos da tabela
  const alterarOrdenacao = (coluna: TipoOrdenacao) => {
    if (ordenarPor === coluna) {
      definirDirecaoOrdenacao((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      definirOrdenarPor(coluna)
      definirDirecaoOrdenacao('desc')
    }
  }

  // Exporta os dados agrupados e filtrados atuais para uma planilha Excel (.xlsx) altamente estilizada
  const exportarParaExcel = async () => {
    try {
      // Importação dinâmica do ExcelJS no momento do clique (melhor prática de Next.js/Web Vitals)
      const ExcelJS = await import('exceljs')
      
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Produtos Vendidos')

      // Definir cabeçalhos e chaves
      worksheet.columns = [
        { header: 'SKU Raiz', key: 'skuBase', width: 22 },
        { header: 'Descrição do Produto', key: 'descricaoLimpa', width: 48 },
        { header: 'Cor', key: 'cor', width: 16 },
        { header: 'Quantidade Vendida', key: 'quantidade', width: 22 },
        { header: 'Receita Total (R$)', key: 'valorTotal', width: 22 }
      ]

      // Adicionar dados da tabela filtrada e ordenada atual
      produtosOrdenados.forEach((prod) => {
        worksheet.addRow({
          skuBase: prod.skuBase,
          descricaoLimpa: prod.descricaoLimpa,
          cor: prod.cor || 'Sem Variação',
          quantidade: prod.quantidade,
          valorTotal: prod.valorTotal
        })
      })

      // Estilizar o cabeçalho (Cor Indigo-600 do design system do Oofa ERP)
      const linhaCabecalho = worksheet.getRow(1)
      linhaCabecalho.height = 26
      linhaCabecalho.eachCell((celula) => {
        celula.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } }
        celula.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4F46E5' } // Indigo 600 principal
        }
        celula.alignment = { vertical: 'middle', horizontal: 'center' }
        celula.border = {
          bottom: { style: 'medium', color: { argb: '3730A3' } }
        }
      })

      // Estilizar dados (formatar valores monetários, quantidade e alinhar)
      worksheet.eachRow((linha, numeroLinha) => {
        if (numeroLinha > 1) {
          linha.height = 22
          
          // Formatar coluna de Receita Total como moeda no Excel
          const celulaFaturamento = linha.getCell(5)
          celulaFaturamento.value = Number(celulaFaturamento.value) || 0
          celulaFaturamento.numFmt = '"R$"#,##0.00;("R$"#,##0.00);"-";@'
          celulaFaturamento.alignment = { vertical: 'middle', horizontal: 'right' }

          // Formatar quantidade vendida
          const celulaQuantidade = linha.getCell(4)
          celulaQuantidade.value = Number(celulaQuantidade.value) || 0
          celulaQuantidade.numFmt = '#,##0'
          celulaQuantidade.alignment = { vertical: 'middle', horizontal: 'right' }
          
          // Alinhar SKU, Descrição e Cor
          linha.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
          linha.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }
          linha.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' }

          // Bordas finas nos dados
          linha.eachCell((celula) => {
            celula.font = { name: 'Segoe UI', size: 10 }
            celula.border = {
              bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
            }
          })
        }
      })

      // Gerar o buffer
      const buffer = await workbook.xlsx.writeBuffer()
      
      // Criar o download
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const urlBlob = window.URL.createObjectURL(blob)
      const linkDownload = document.createElement('a')
      linkDownload.href = urlBlob
      
      // Nome formatado com a data atual (ex: 29_05_2026)
      const sufixoData = new Date().toISOString().slice(0, 10).split('-').reverse().join('_')
      linkDownload.download = `relatorio_produtos_vendidos_${sufixoData}.xlsx`
      
      linkDownload.click()
      window.URL.revokeObjectURL(urlBlob)
    } catch (erro) {
      console.error('Erro ao exportar planilha em Excel:', erro)
      alert('Não foi possível exportar a planilha. Por favor, tente novamente.')
    }
  }

  // Determinar datas com base no período selecionado
  useEffect(() => {
    const obterDatasPadrao = () => {
      const agora = new Date()
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
    }

    obterDatasPadrao()
  }, [tipoPeriodo])

  // Buscar dados no Supabase ao alterar filtros de datas ou situação
  useEffect(() => {
    async function carregarDadosProdutos() {
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
        definirLinhasAbertas({}) // Limpa as linhas expandidas ao mudar o filtro de dados
      } catch (err: any) {
        console.error('Erro ao carregar dados de produtos:', err)
        definirErro(`Não foi possível carregar as informações das notas: ${err?.message || 'Erro desconhecido'}`)
      } finally {
        definirCarregando(false)
      }
    }

    carregarDadosProdutos()
  }, [dataInicio, dataFim, situacaoFiltro])

  // Formatação em Moeda BRL
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  // --- FILTRAGEM GLOBAL POR NATUREZAS SELECIONADAS ---
  const notasFiltradas = useMemo(() => {
    return notasFiscais.filter((nota) => {
      if (naturezasSelecionadas.length === 0) return true
      const chave = nota.natureza_operacao_id ? String(nota.natureza_operacao_id) : 'sem-natureza'
      return naturezasSelecionadas.includes(chave)
    })
  }, [notasFiscais, naturezasSelecionadas])

  // --- ALGORITMO DE PROCESSAMENTO E AGRUPAMENTO DE PRODUTOS VENDIDOS ---
  const produtosAgrupados = useMemo(() => {
    const mapa: Record<string, ProdutoAgrupado> = {}

    notasFiltradas.forEach((nota) => {
      nota.nfe_itens?.forEach((item) => {
        const descricaoOriginal = item.descricao || ''
        const skuOriginal = item.codigo || ''
        const quantidade = Number(item.quantidade) || 0
        const valorTotal = Number(item.valor_total) || 0

        // 1. Extração da variação de Cor (ex: "Cor:Preto" ou "Cor: Branco")
        let cor: string | null = null
        const matchCor = descricaoOriginal.match(/Cor\s*:\s*([^;]+)/i)
        if (matchCor && matchCor[1]) {
          cor = matchCor[1].trim()
        }

        // 2. Extração da variação de Tamanho (ex: "Tamanho:G" ou "Tamanho: G")
        let tamanho = 'N/A'
        const matchTamanho = descricaoOriginal.match(/Tamanho\s*:\s*([^;]+)/i)
        if (matchTamanho && matchTamanho[1]) {
          tamanho = matchTamanho[1].trim().toUpperCase()
        }

        // 3. Limpeza do nome base descartando o tamanho e mantendo a cor
        let descricaoLimpa = descricaoOriginal
          .replace(/[;,\s]*Tamanho\s*:\s*[^;]+[;,\s]*/gi, '') // Remove a indicação de tamanho
          .replace(/[;,\s]+$/, '') // Limpa pontuações órfãs ou pontas de ponto e vírgula
          .trim()

        const chave = descricaoLimpa.toLowerCase().trim()

        if (!mapa[chave]) {
          mapa[chave] = {
            skuBase: skuOriginal.split('-')[0] || skuOriginal,
            descricaoLimpa,
            quantidade: 0,
            valorTotal: 0,
            cor,
            tamanhosVendidos: {}
          }
        }

        mapa[chave].quantidade += quantidade
        mapa[chave].valorTotal += valorTotal

        if (tamanho && tamanho !== 'N/A') {
          mapa[chave].tamanhosVendidos[tamanho] = (mapa[chave].tamanhosVendidos[tamanho] || 0) + quantidade
        }
      })
    })

    return Object.values(mapa)
  }, [notasFiltradas])

  // --- FILTRAGEM LOCAL POR BUSCA TEXTUAL (NOME / SKU) ---
  const produtosFiltradosEBusca = useMemo(() => {
    return produtosAgrupados.filter((produto) => {
      if (!buscaTexto) return true
      const termo = buscaTexto.toLowerCase().trim()
      return (
        produto.descricaoLimpa.toLowerCase().includes(termo) ||
        produto.skuBase.toLowerCase().includes(termo)
      )
    })
  }, [produtosAgrupados, buscaTexto])

  // --- ORDENAÇÃO DINÂMICA DOS PRODUTOS FILTRADOS ---
  const produtosOrdenados = useMemo(() => {
    return [...produtosFiltradosEBusca].sort((a, b) => {
      let valA = a[ordenarPor]
      let valB = b[ordenarPor]

      if (typeof valA === 'string' && typeof valB === 'string') {
        return direcaoOrdenacao === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA)
      }

      // Numéricos
      valA = valA || 0
      valB = valB || 0
      return direcaoOrdenacao === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number)
    })
  }, [produtosFiltradosEBusca, ordenarPor, direcaoOrdenacao])

  // --- CÁLCULO DE METRICAS E CARDS DE KPI SUPERIORES ---
  const metricasKPI = useMemo(() => {
    const faturamentoGeral = produtosAgrupados.reduce((total, p) => total + p.valorTotal, 0)
    const totalPecas = produtosAgrupados.reduce((total, p) => total + p.quantidade, 0)
    const ticketMedio = totalPecas > 0 ? faturamentoGeral / totalPecas : 0
    const faturamentoNotas = notasFiltradas.reduce((total, n) => total + (Number(n.valor_nota) || 0), 0)

    return {
      faturamentoGeral,
      faturamentoNotas,
      totalPecas,
      ticketMedio,
      totalProdutosUnicos: produtosAgrupados.length
    }
  }, [produtosAgrupados, notasFiltradas])

  // --- PRÉ-FILTRAGEM DE NATUREZAS DE OPERAÇÃO COM MOVIMENTAÇÃO NO PERÍODO ---
  const naturezasComMovimentacao = useMemo(() => {
    return naturezasCadastradas.filter((nat) => {
      return notasFiscais.some((nota) => String(nota.natureza_operacao_id) === String(nat.id))
    })
  }, [naturezasCadastradas, notasFiscais])

  const temNotasSemNatureza = useMemo(() => {
    return notasFiscais.some((nota) => !nota.natureza_operacao_id)
  }, [notasFiscais])

  // Função auxiliar para mapear a cor da bolinha indicadora na tabela
  const obterClasseCor = (corNome: string | null): string => {
    if (!corNome) return 'cor-cinza'
    const normalizado = corNome.toLowerCase().trim()
    if (normalizado.includes('preto') || normalizado.includes('preta')) return 'cor-preto'
    if (normalizado.includes('branco') || normalizado.includes('branca')) return 'cor-branco'
    if (normalizado.includes('cinza') || normalizado.includes('mescla')) return 'cor-cinza'
    if (normalizado.includes('vermelho') || normalizado.includes('vermelha')) return 'cor-vermelho'
    if (normalizado.includes('azul')) return 'cor-azul'
    if (normalizado.includes('verde')) return 'cor-verde'
    if (normalizado.includes('amarelo') || normalizado.includes('amarela')) return 'cor-amarelo'
    if (normalizado.includes('rosa')) return 'cor-rosa'
    if (normalizado.includes('roxo') || normalizado.includes('roxa')) return 'cor-roxo'
    if (normalizado.includes('laranja')) return 'cor-laranja'
    if (normalizado.includes('marrom')) return 'cor-marrom'
    return 'cor-cinza'
  }

  // Renderizador das colunas ordenáveis
  const renderizarCabecalhoOrdenavel = (coluna: TipoOrdenacao, texto: string) => {
    const ativo = ordenarPor === coluna
    return (
      <th onClick={() => alterarOrdenacao(coluna)} style={{ cursor: 'pointer' }}>
        <span className="tabela-produtos__coluna-ordenavel">
          {texto}
          {ativo && (
            direcaoOrdenacao === 'asc' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            )
          )}
        </span>
      </th>
    )
  }

  return (
    <PageContainer titulo="Relatório Geral de Produtos Vendidos">
      <div className="produtos-pagina">
        {/* Painel de Filtros Globais e Barra de Busca */}
        <section className="produtos-pagina__painel-filtros">
          {/* Barra de Pesquisa Local */}
          <div className="produtos-filtros__grupo produtos-filtros__grupo--busca">
            <label className="produtos-filtros__label">Pesquisar Produto</label>
            <div className="produtos-filtros__busca-container">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="produtos-filtros__busca-icone">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por descrição ou SKU do produto..."
                className="produtos-filtros__busca-input"
                value={buscaTexto}
                onChange={(e) => definirBuscaTexto(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro de Período */}
          <div className="produtos-filtros__grupo">
            <label className="produtos-filtros__label">Filtro de Período</label>
            <select
              className="produtos-filtros__input"
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

          {/* Filtro Customizado de Datas */}
          {tipoPeriodo === 'periodo-customizado' && (
            <>
              <div className="produtos-filtros__grupo">
                <label className="produtos-filtros__label">Data Início</label>
                <input
                  type="date"
                  className="produtos-filtros__input"
                  value={dataInicio}
                  onChange={(e) => definirDataInicio(e.target.value)}
                />
              </div>
              <div className="produtos-filtros__grupo">
                <label className="produtos-filtros__label">Data Fim</label>
                <input
                  type="date"
                  className="produtos-filtros__input"
                  value={dataFim}
                  onChange={(e) => definirDataFim(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Filtro de Situação da Nota */}
          <div className="produtos-filtros__grupo">
            <label className="produtos-filtros__label">Situação da Nota</label>
            <select
              className="produtos-filtros__input"
              value={situacaoFiltro}
              onChange={(e) => definirSituacaoFiltro(e.target.value)}
            >
              <option value="todas">Todas as Situações</option>
              <option value="autorizada">Autorizadas / Emitidas</option>
              <option value="pendente">Pendentes</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          {/* Filtro Múltiplo de Naturezas de Operação */}
          <div className="produtos-filtros__grupo">
            <label className="produtos-filtros__label">Natureza de Operação</label>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`dropdown-multi__seta ${naturezasDropdownAberto ? 'dropdown-multi__seta--aberta' : ''}`}>
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

        {/* Exibição de Alertas de Erro */}
        {erro && (
          <div className="produtos-pagina__alerta-erro">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{erro}</span>
          </div>
        )}

        {/* Esqueletos (Skeletons) de Carregamento */}
        {carregando ? (
          <div className="produtos-pagina__carregamento">
            <div className="produtos-pagina__carregamento-kpis">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="card-metrica-produto card-metrica--skeleton">
                  <div className="skeleton__linha skeleton__linha--titulo" />
                  <div className="skeleton__linha skeleton__linha--valor" />
                  <div className="skeleton__linha skeleton__linha--subtitulo" />
                </div>
              ))}
            </div>
            <div className="produtos-pagina__carregamento-tabela bloco-visualizacao--skeleton">
              <div className="skeleton__linha skeleton__linha--titulo" />
              <div className="skeleton__grafico-barras" />
            </div>
          </div>
        ) : (
          <>
            {/* Grid de Cards de Métricas (KPIs) */}
            <section className="produtos-pagina__grid-metricas">
              {/* Card 1: Faturamento Total (Notas) */}
              <div className="card-metrica-produto">
                <div className="card-metrica-produto__cabecalho">
                  <span className="card-metrica-produto__titulo">Faturamento Total (Notas)</span>
                  <div className="card-metrica-produto__icone-wrapper card-metrica-produto__icone-wrapper--indigo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                </div>
                <p className="card-metrica-produto__valor">{formatarMoeda(metricasKPI.faturamentoNotas)}</p>
                <span className="card-metrica-produto__subtitulo">Total consolidado das Notas Fiscais (baterá com a Dashboard)</span>
              </div>

              {/* Card 2: Faturamento de Produtos */}
              <div className="card-metrica-produto">
                <div className="card-metrica-produto__cabecalho">
                  <span className="card-metrica-produto__titulo">Receita de Produtos</span>
                  <div className="card-metrica-produto__icone-wrapper card-metrica-produto__icone-wrapper--azul">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                </div>
                <p className="card-metrica-produto__valor">{formatarMoeda(metricasKPI.faturamentoGeral)}</p>
                <span className="card-metrica-produto__subtitulo">Soma bruta de venda das peças físicas</span>
              </div>

              {/* Card 3: Peças Vendidas */}
              <div className="card-metrica-produto">
                <div className="card-metrica-produto__cabecalho">
                  <span className="card-metrica-produto__titulo">Total de Peças Vendidas</span>
                  <div className="card-metrica-produto__icone-wrapper card-metrica-produto__icone-wrapper--esmeralda">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <path d="M16 10a4 4 0 0 1-8 0" />
                    </svg>
                  </div>
                </div>
                <p className="card-metrica-produto__valor">{metricasKPI.totalPecas.toLocaleString('pt-BR')} un</p>
                <span className="card-metrica-produto__subtitulo">Unidades físicas movimentadas no período</span>
              </div>

              {/* Card 4: Ticket Médio por Peça */}
              <div className="card-metrica-produto">
                <div className="card-metrica-produto__cabecalho">
                  <span className="card-metrica-produto__titulo">Valor Médio por Peça</span>
                  <div className="card-metrica-produto__icone-wrapper card-metrica-produto__icone-wrapper--amarelo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  </div>
                </div>
                <p className="card-metrica-produto__valor">{formatarMoeda(metricasKPI.ticketMedio)}</p>
                <span className="card-metrica-produto__subtitulo">Preço médio ponderado de venda das peças</span>
              </div>

              {/* Card 5: Modelos Distintos */}
              <div className="card-metrica-produto">
                <div className="card-metrica-produto__cabecalho">
                  <span className="card-metrica-produto__titulo">Produtos Distintos</span>
                  <div className="card-metrica-produto__icone-wrapper card-metrica-produto__icone-wrapper--azul">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                  </div>
                </div>
                <p className="card-metrica-produto__valor">{metricasKPI.totalProdutosUnicos}</p>
                <span className="card-metrica-produto__subtitulo">Modelos únicos vendidos (agrupados)</span>
              </div>
            </section>

            {/* Bloco Central da Tabela de Itens Vendidos */}
            <section className="produtos-tabela-bloco">
              <div className="produtos-tabela-bloco__topo">
                <h2 className="produtos-tabela-bloco__titulo">Lista Geral de Produtos</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <span className="produtos-tabela-bloco__contador">
                    Exibindo {produtosFiltradosEBusca.length} de {produtosAgrupados.length} produtos
                  </span>
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={exportarParaExcel}
                    disabled={produtosFiltradosEBusca.length === 0}
                    title="Exportar listagem filtrada para planilha Excel (.xlsx)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Exportar Planilha
                  </button>
                </div>
              </div>

              <div className="produtos-tabela-container">
                {produtosOrdenados.length === 0 ? (
                  <div className="produtos-tabela__vazia">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="produtos-tabela__vazia-icone">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>Nenhum produto foi vendido com os critérios de busca e filtros selecionados.</span>
                  </div>
                ) : (
                  <table className="tabela-produtos">
                    <thead>
                      <tr>
                        {renderizarCabecalhoOrdenavel('skuBase', 'SKU Raiz')}
                        {renderizarCabecalhoOrdenavel('descricaoLimpa', 'Descrição do Produto')}
                        <th style={{ width: '120px' }}>Cor</th>
                        {renderizarCabecalhoOrdenavel('quantidade', 'Qtd. Vendida')}
                        {renderizarCabecalhoOrdenavel('valorTotal', 'Receita Total')}
                        <th style={{ width: '60px', textAlign: 'center' }}>Detalhes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {produtosOrdenados.map((prod) => {
                        const chave = prod.descricaoLimpa.toLowerCase().trim()
                        const aberta = !!linhasAbertas[chave]

                        return (
                          <Fragment key={chave}>
                            {/* Linha Principal do Produto */}
                            <tr
                              className={`linha-produto ${aberta ? 'linha-produto--aberta' : ''}`}
                              onClick={() => alternarLinha(chave)}
                            >
                              <td className="tabela-produtos__sku">{prod.skuBase}</td>
                              <td className="tabela-produtos__descricao">{prod.descricaoLimpa}</td>
                              <td>
                                <span className="tabela-produtos__cor">
                                  <div
                                    className={`tabela-produtos__cor-indicador ${obterClasseCor(prod.cor)}`}
                                  />
                                  {prod.cor || 'Sem Variação'}
                                </span>
                              </td>
                              <td className="tabela-produtos__quantidade">
                                {prod.quantidade.toLocaleString('pt-BR')} un
                              </td>
                              <td className="tabela-produtos__faturamento">
                                {formatarMoeda(prod.valorTotal)}
                              </td>
                              <td className="tabela-produtos__acao">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`tabela-produtos__seta-expandir ${aberta ? 'tabela-produtos__seta-expandir--aberta' : ''}`}>
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </td>
                            </tr>

                            {/* Linha Expansível para Accordion (Drilldown de Tamanhos) */}
                            {aberta && (
                              <tr className="tabela-produtos__linha-detalhe">
                                <td colSpan={6}>
                                  <div className="tabela-produtos__detalhe-conteudo">
                                    <div className="detalhe-tamanhos">
                                      <h4 className="detalhe-tamanhos__titulo">Vendas por Tamanho</h4>
                                      <div className="detalhe-tamanhos__grid">
                                        {Object.entries(prod.tamanhosVendidos).length === 0 ? (
                                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                                            Nenhum tamanho registrado.
                                          </span>
                                        ) : (
                                          Object.entries(prod.tamanhosVendidos)
                                            .sort((a, b) => {
                                              const ordem = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'EG']
                                              const idxA = ordem.indexOf(a[0])
                                              const idxB = ordem.indexOf(b[0])
                                              if (idxA !== -1 && idxB !== -1) return idxA - idxB
                                              return a[0].localeCompare(b[0])
                                            })
                                            .map(([tamanho, qtd]) => (
                                              <div key={tamanho} className="detalhe-tamanhos__item">
                                                <span className={`detalhe-tamanhos__badge badge-tamanho--${tamanho.toLowerCase()}`}>
                                                  Tamanho: {tamanho}
                                                </span>
                                                <span className="detalhe-tamanhos__quantidade">
                                                  {qtd.toLocaleString('pt-BR')} un
                                                </span>
                                              </div>
                                            ))
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </PageContainer>
  )
}
