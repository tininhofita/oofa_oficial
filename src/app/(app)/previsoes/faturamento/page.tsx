'use client'

import { useState } from 'react'
import '../previsoes.css'

interface CanalVenda {
  id: string
  canal: string
  previstoOriginal: number
  realizado: number
  crescimento: string
}

/**
 * Página de Previsão de Faturamento.
 * Permite simulações de vendas por canais e exibe gráficos e tabelas financeiras de altíssima fidelidade.
 * Desenvolvido seguindo as regras de Nomenclatura em Português BR.
 */
export default function PaginaPrevisoesFaturamento() {
  const [crescimentoSimulado, definirCrescimentoSimulado] = useState<number>(0)

  // Canais de vendas e faturamentos reais/previstos
  const [canais] = useState<CanalVenda[]>([
    { id: '1', canal: 'Integração Nuvemshop (E-commerce)', previstoOriginal: 120000, realizado: 124500, crescimento: '+12.4%' },
    { id: '2', canal: 'Integração Bling ERP (Marketplaces)', previstoOriginal: 85000, realizado: 81200, crescimento: '+8.1%' },
    { id: '3', canal: 'Vendas Diretas B2B', previstoOriginal: 95000, realizado: 102000, crescimento: '+15.2%' },
    { id: '4', canal: 'Televendas / WhatsApp Comercial', previstoOriginal: 30000, realizado: 31400, crescimento: '+4.3%' },
    { id: '5', canal: 'Assinaturas / Recorrência', previstoOriginal: 22000, realizado: 22500, crescimento: '+1.8%' }
  ])

  // Formatação de moeda BRL
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  // Cálculos dinâmicos baseados no crescimento simulado
  const calcularPrevistoAjustado = (valor: number) => {
    return valor * (1 + crescimentoSimulado / 100)
  }

  const totalPrevistoOriginal = canais.reduce((acumulado, item) => acumulado + item.previstoOriginal, 0)
  const totalPrevistoAjustado = canais.reduce((acumulado, item) => acumulado + calcularPrevistoAjustado(item.previstoOriginal), 0)
  const totalRealizado = canais.reduce((acumulado, item) => acumulado + item.realizado, 0)
  const desvioTotal = totalRealizado - totalPrevistoAjustado
  const porcentagemDesvio = (desvioTotal / totalPrevistoAjustado) * 100

  // Dados para o gráfico de faturamento
  const dadosMensais = [
    { mes: 'Jan', previsto: 310000, realizado: 315000 },
    { mes: 'Fev', previsto: 320000, realizado: 318000 },
    { mes: 'Mar', previsto: 330000, realizado: 342000 },
    { mes: 'Abr', previsto: 340000, realizado: 349000 },
    { mes: 'Mai (Atual)', previsto: totalPrevistoAjustado, realizado: totalRealizado }
  ]

  // Encontra o maior valor para normalizar o gráfico SVG
  const valorMaximo = Math.max(...dadosMensais.flatMap((d) => [d.previsto, d.realizado])) * 1.15

  const obterPorcentagemAltura = (valor: number) => {
    return `${(valor / valorMaximo) * 100}%`
  }

  return (
    <div className="pagina-previsoes">
      {/* Cabeçalho */}
      <header className="pagina-previsoes__cabecalho">
        <div className="pagina-previsoes__titulo-grupo">
          <h1 className="pagina-previsoes__titulo">Previsão de Faturamento</h1>
          <p className="pagina-previsoes__subtitulo">
            Acompanhe o desempenho comercial e projete o faturamento futuro da empresa por canal de vendas.
          </p>
        </div>
        <div className="pagina-previsoes__acoes">
          <button type="button" className="pagina-previsoes__botao" onClick={() => definirCrescimentoSimulado(0)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Resetar Projeção
          </button>
          <button type="button" className="pagina-previsoes__botao pagina-previsoes__botao--primario">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar Relatório
          </button>
        </div>
      </header>

      {/* Grid de Metricas */}
      <section className="pagina-previsoes__grid-metricas">
        <div className="card-metrica">
          <div className="card-metrica__cabecalho">
            <span className="card-metrica__titulo">Previsão de Faturamento</span>
            <div className="card-metrica__icone-wrapper card-metrica__icone-wrapper--verde">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <p className="card-metrica__valor">{formatarMoeda(totalPrevistoAjustado)}</p>
          <div className="card-metrica__diferenca">
            <span className="card-metrica__diferenca-texto">
              Original do Planejamento: {formatarMoeda(totalPrevistoOriginal)}
            </span>
          </div>
        </div>

        <div className="card-metrica">
          <div className="card-metrica__cabecalho">
            <span className="card-metrica__titulo">Faturamento Realizado</span>
            <div className="card-metrica__icone-wrapper card-metrica__icone-wrapper--verde">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <p className="card-metrica__valor">{formatarMoeda(totalRealizado)}</p>
          <div className="card-metrica__diferenca">
            <span className="card-metrica__diferenca-texto">
              Acompanhamento de vendas em tempo real
            </span>
          </div>
        </div>

        <div className="card-metrica">
          <div className="card-metrica__cabecalho">
            <span className="card-metrica__titulo">Status vs. Meta</span>
            <div className={`card-metrica__icone-wrapper ${desvioTotal >= 0 ? 'card-metrica__icone-wrapper--verde' : 'card-metrica__icone-wrapper--amarelo'}`}>
              {desvioTotal >= 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                  <polyline points="17 18 23 18 23 12" />
                </svg>
              )}
            </div>
          </div>
          <p className="card-metrica__valor">{formatarMoeda(Math.abs(desvioTotal))}</p>
          <div className="card-metrica__diferenca">
            <span className={`card-metrica__diferenca ${desvioTotal >= 0 ? 'card-metrica__diferenca--positiva' : 'card-metrica__diferenca--negativa'}`}>
              {porcentagemDesvio >= 0 ? '↑' : '↓'} {Math.abs(porcentagemDesvio).toFixed(1)}%
            </span>
            <span className="card-metrica__diferenca-texto">
              {desvioTotal >= 0 ? 'acima do planejado (superávit)' : 'abaixo do planejado (déficit)'}
            </span>
          </div>
        </div>
      </section>

      {/* Conteúdo Principal */}
      <div className="pagina-previsoes__conteudo-grid">
        {/* Gráfico de Faturamento */}
        <section className="bloco-visualizacao">
          <h2 className="bloco-visualizacao__titulo">Evolução Mensal do Faturamento</h2>
          
          <div className="grafico-previsoes">
            {dadosMensais.map((dado) => (
              <div key={dado.mes} className="grafico-previsoes__coluna-grupo">
                <div className="grafico-previsoes__barras-container">
                  <div
                    className="grafico-previsoes__barra grafico-previsoes__barra--previsto"
                    style={{ height: obterPorcentagemAltura(dado.previsto) }}
                    data-valor={`Projetado: ${formatarMoeda(dado.previsto)}`}
                  />
                  <div
                    className="grafico-previsoes__barra grafico-previsoes__barra--realizado-faturamento"
                    style={{ height: obterPorcentagemAltura(dado.realizado) }}
                    data-valor={`Faturado: ${formatarMoeda(dado.realizado)}`}
                  />
                </div>
                <span className="grafico-previsoes__legenda-mes">{dado.mes}</span>
              </div>
            ))}
          </div>

          <div className="grafico-previsoes__legendas">
            <div className="grafico-previsoes__legenda-item">
              <div className="grafico-previsoes__legenda-cor" style={{ backgroundColor: 'var(--color-primary)' }} />
              <span>Faturamento Planejado (Simulado)</span>
            </div>
            <div className="grafico-previsoes__legenda-item">
              <div className="grafico-previsoes__legenda-cor" style={{ backgroundColor: 'var(--color-success)' }} />
              <span>Faturamento Realizado</span>
            </div>
          </div>
        </section>

        {/* Simulador Interativo */}
        <section className="bloco-visualizacao">
          <h2 className="bloco-visualizacao__titulo">Simulador de Metas (Receita)</h2>
          <div className="simulador-form">
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Simule cenários de crescimento ou desaceleração comercial para reajustar as metas orçamentárias de faturamento do mês atual.
            </p>
            <div className="simulador-form__grupo">
              <label htmlFor="crescimento-vendas" className="simulador-form__label">
                Projeção de Crescimento (%): <span style={{ fontWeight: 'bold', color: crescimentoSimulado >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {crescimentoSimulado >= 0 ? '+' : ''}{crescimentoSimulado}%
                </span>
              </label>
              <input
                id="crescimento-vendas"
                type="range"
                min="-20"
                max="50"
                value={crescimentoSimulado}
                onChange={(e) => definirCrescimentoSimulado(Number(e.target.value))}
                className="simulador-form__input"
                style={{ cursor: 'pointer' }}
              />
            </div>
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Expectativa de Receita:</span>
                <span style={{ fontWeight: 'bold', color: totalPrevistoAjustado > totalPrevistoOriginal ? 'var(--color-success)' : totalPrevistoAjustado === totalPrevistoOriginal ? 'var(--color-text-secondary)' : 'var(--color-danger)' }}>
                  {totalPrevistoAjustado > totalPrevistoOriginal ? 'Otimista' : totalPrevistoAjustado === totalPrevistoOriginal ? 'Neutro' : 'Pessimista'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Acréscimo Estimado:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>
                  +{formatarMoeda(totalPrevistoAjustado - totalPrevistoOriginal)}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Tabela de Canais de Venda */}
      <section className="bloco-visualizacao">
        <h2 className="bloco-visualizacao__titulo">Análise de Receita por Canal de Vendas</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="tabela-previsoes">
            <thead>
              <tr>
                <th>Canal de Venda</th>
                <th>Faturamento Planejado</th>
                <th>Meta Projetada (Simulada)</th>
                <th>Faturamento Realizado</th>
                <th>Variação</th>
                <th>Meta Atingida</th>
              </tr>
            </thead>
            <tbody>
              {canais.map((item) => {
                const simulado = calcularPrevistoAjustado(item.previstoOriginal)
                const desvio = item.realizado - simulado
                const pctMeta = (item.realizado / simulado) * 100
                const atingida = pctMeta >= 100

                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 'var(--fw-semibold)' }}>{item.canal}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{formatarMoeda(item.previstoOriginal)}</td>
                    <td style={{ fontWeight: 'var(--fw-medium)', color: 'var(--color-primary)' }}>
                      {formatarMoeda(simulado)}
                    </td>
                    <td>{formatarMoeda(item.realizado)}</td>
                    <td style={{ fontWeight: 'var(--fw-bold)', color: desvio >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {desvio >= 0 ? '+' : ''}{formatarMoeda(desvio)} ({((item.realizado - simulado) / simulado * 100).toFixed(1)}%)
                    </td>
                    <td>
                      {atingida ? (
                        <span className="badge-status badge-status--verde">Concluída ({pctMeta.toFixed(0)}%)</span>
                      ) : (
                        <span className="badge-status badge-status--amarelo">Pendente ({pctMeta.toFixed(0)}%)</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
