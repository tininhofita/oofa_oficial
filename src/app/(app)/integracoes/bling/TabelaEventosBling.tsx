'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/Badge'
import { MAPEAMENTO_RECURSO_BLING } from '@/lib/bling/types'
import type { RecursoBling } from '@/lib/bling/types'

interface BlingEvento {
  id: string
  recurso: string
  acao: string
  bling_id: number | null
  status: 'recebido' | 'processado' | 'erro'
  payload: any
  erro_mensagem: string | null
  created_at: string
}

interface TabelaEventosBlingProps {
  eventos: BlingEvento[]
}

export default function TabelaEventosBling({ eventos }: TabelaEventosBlingProps) {
  const [selectedEvento, setSelectedEvento] = useState<BlingEvento | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Escuta a tecla ESC para fechar o modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEvento(null)
      }
    }
    if (selectedEvento) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEvento])

  const copiarPayload = async (json: any) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(json, null, 2))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar JSON:', err)
    }
  }

  return (
    <section className="bling-integracao__secao">
      <h2 className="bling-integracao__titulo-secao">Últimos Eventos</h2>
      
      {eventos && eventos.length > 0 ? (
        <div className="bling-naturezas__tabela-container">
          <table className="bling-integracao__tabela">
            <thead>
              <tr>
                <th>Recurso</th>
                <th>Ação</th>
                <th>ID no Bling</th>
                <th>Status</th>
                <th>Recebido em</th>
                <th style={{ textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id}>
                  <td>
                    {MAPEAMENTO_RECURSO_BLING[evento.recurso as RecursoBling] ?? evento.recurso}
                  </td>
                  <td>
                    <span className="bling-integracao__tabela-acao-badge">{evento.acao}</span>
                  </td>
                  <td className="bling-naturezas__id-col">{evento.bling_id ?? '—'}</td>
                  <td>
                    <Badge
                      variante={
                        evento.status === 'processado'
                          ? 'sucesso'
                          : evento.status === 'erro'
                          ? 'erro'
                          : 'inativo'
                      }
                    >
                      {evento.status}
                    </Badge>
                  </td>
                  <td>
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(evento.created_at))}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="bling-integracao__botao-tabela-detalhes"
                      onClick={() => setSelectedEvento(evento)}
                      title="Visualizar detalhes do evento"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>Detalhes</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="bling-integracao__sem-eventos">
          Nenhum evento recebido ainda. Configure o webhook no Bling para começar.
        </p>
      )}

      {/* Modal Premium de Detalhes do Evento */}
      {selectedEvento && (
        <div 
          className="bling-modal__overlay" 
          onClick={() => setSelectedEvento(null)}
        >
          <div 
            className="bling-modal__content" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            <div className="bling-modal__header">
              <div>
                <h3 className="bling-modal__title">Inspecionar Webhook</h3>
                <span className="bling-modal__subtitle">
                  {MAPEAMENTO_RECURSO_BLING[selectedEvento.recurso as RecursoBling] ?? selectedEvento.recurso} 
                  {' · '}
                  <span className="bling-modal__subtitle-acao">{selectedEvento.acao}</span>
                </span>
              </div>
              <button 
                type="button" 
                className="bling-modal__close-btn"
                onClick={() => setSelectedEvento(null)}
                title="Fechar modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="bling-modal__body">
              
              {/* Grid de Metadados rápidos */}
              <div className="bling-modal__meta-grid">
                <div className="bling-modal__meta-item">
                  <span className="bling-modal__meta-label">ID no Bling</span>
                  <span className="bling-modal__meta-value monospace">
                    {selectedEvento.bling_id ?? 'Nenhum'}
                  </span>
                </div>
                <div className="bling-modal__meta-item">
                  <span className="bling-modal__meta-label">Status</span>
                  <div>
                    <Badge
                      variante={
                        selectedEvento.status === 'processado'
                          ? 'sucesso'
                          : selectedEvento.status === 'erro'
                          ? 'erro'
                          : 'inativo'
                      }
                    >
                      {selectedEvento.status}
                    </Badge>
                  </div>
                </div>
                <div className="bling-modal__meta-item">
                  <span className="bling-modal__meta-label">Recebido em</span>
                  <span className="bling-modal__meta-value">
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'long',
                      timeStyle: 'medium',
                    }).format(new Date(selectedEvento.created_at))}
                  </span>
                </div>
              </div>

              {/* Destaque de Erro de Processamento */}
              {selectedEvento.status === 'erro' && selectedEvento.erro_mensagem && (
                <div className="bling-modal__erro-container">
                  <div className="bling-modal__erro-titulo">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Falha no Processamento Interno</span>
                  </div>
                  <p className="bling-modal__erro-texto">
                    {selectedEvento.erro_mensagem}
                  </p>
                </div>
              )}

              {/* JSON Bruto com Botão de Copiar */}
              <div className="bling-modal__json-section">
                <div className="bling-modal__json-header">
                  <span className="bling-modal__json-title">Payload Recebido (JSON)</span>
                  <button
                    type="button"
                    className={`bling-modal__btn-copiar ${copiado ? 'bling-modal__btn-copiar--sucesso' : ''}`}
                    onClick={() => copiarPayload(selectedEvento.payload)}
                  >
                    {copiado ? (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copiar JSON</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="bling-modal__json-wrapper">
                  <pre className="bling-modal__json-pre">
                    <code>
                      {JSON.stringify(selectedEvento.payload, null, 2)}
                    </code>
                  </pre>
                </div>
              </div>

            </div>

            {/* Rodapé do Modal */}
            <div className="bling-modal__footer">
              <button
                type="button"
                className="bling-modal__btn-fechar"
                onClick={() => setSelectedEvento(null)}
              >
                Fechar Painel
              </button>
            </div>

          </div>
        </div>
      )}
    </section>
  )
}
