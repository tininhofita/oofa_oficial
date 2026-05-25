'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useInterfaceUsuario } from '@/stores/ui.store'
import { ROUTES } from '@/constants/routes'
import './Sidebar.css'

interface PropriedadesBarraLateral {
  nomeUsuario?: string | null
  emailUsuario?: string | null
  avatarUrl?: string | null
}

interface SubitemNavegacao {
  titulo: string
  link: string
}

interface ItemNavegacao {
  titulo: string
  link: string
  icone: React.ReactNode
  subitens?: SubitemNavegacao[]
}

/**
 * Componente BarraLateral (Sidebar) do sistema.
 * Apresenta o menu de navegação lateral com ícones SVG inline e suporte para recolhimento.
 */
export function BarraLateral({ nomeUsuario, emailUsuario, avatarUrl }: PropriedadesBarraLateral) {
  const rotaAtual = usePathname()
  const { barraLateralRecolhida } = useInterfaceUsuario()
  const [submenusAbertos, definirSubmenusAbertos] = useState<Record<string, boolean>>({})

  // Efeito para abrir automaticamente o submenu correspondente à rota atual
  useEffect(() => {
    itensMenu.forEach((item) => {
      if (item.subitens && item.subitens.some((subitem) => rotaAtual.startsWith(subitem.link))) {
        definirSubmenusAbertos((anterior) => ({ ...anterior, [item.link]: true }))
      }
    })
  }, [rotaAtual])

  // Função em Português para alternar a exibição do submenu
  const alternarSubmenu = (link: string) => {
    definirSubmenusAbertos((anterior) => ({
      ...anterior,
      [link]: !anterior[link]
    }))
  }

  // Função para verificar se a rota do link está ativa no momento
  const verificarAtivo = (link: string) => {
    if (link === ROUTES.DASHBOARD) {
      return rotaAtual === ROUTES.DASHBOARD
    }
    return rotaAtual.startsWith(link)
  }

  // Lista dos itens de menu da área de trabalho
  const itensMenu: ItemNavegacao[] = [
    {
      titulo: 'Dashboard',
      link: ROUTES.DASHBOARD,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      titulo: 'Pedidos',
      link: ROUTES.PEDIDOS,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </svg>
      )
    },
    {
      titulo: 'Clientes',
      link: ROUTES.CLIENTES,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      titulo: 'Produtos',
      link: ROUTES.PRODUTOS,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      )
    },
    {
      titulo: 'Estoque',
      link: ROUTES.ESTOQUE,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
        </svg>
      )
    },
    {
      titulo: 'Financeiro',
      link: ROUTES.FINANCEIRO,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      titulo: 'Previsões',
      link: ROUTES.PREVISOES,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
      subitens: [
        {
          titulo: 'Custos',
          link: ROUTES.PREVISOES_CUSTOS
        },
        {
          titulo: 'Faturamento',
          link: ROUTES.PREVISOES_FATURAMENTO
        }
      ]
    },
    {
      titulo: 'Relatórios',
      link: ROUTES.RELATORIOS,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )
    },
    {
      titulo: 'Integrações',
      link: ROUTES.INTEGRACOES,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          <rect x="16" y="16" width="6" height="6" rx="1" />
          <rect x="2" y="2" width="6" height="6" rx="1" />
        </svg>
      ),
      subitens: [
        {
          titulo: 'Bling ERP',
          link: ROUTES.INTEGRACOES_BLING
        },
        {
          titulo: 'Nuvemshop',
          link: ROUTES.INTEGRACOES_NUVEMSHOP
        }
      ]
    },
    {
      titulo: 'Usuários',
      link: ROUTES.USUARIOS,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      titulo: 'Configurações',
      link: ROUTES.CONFIGURACOES,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    },
    {
      titulo: 'Meu Perfil',
      link: ROUTES.PERFIL,
      icone: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    }
  ]

  // Iniciais para o avatar
  const iniciaisNome = nomeUsuario
    ? nomeUsuario
        .split(' ')
        .slice(0, 2)
        .map((nome) => nome.charAt(0).toUpperCase())
        .join('')
    : 'U'

  return (
    <aside className={`barra-lateral ${barraLateralRecolhida ? 'barra-lateral--recolhida' : ''}`}>
      <div className="barra-lateral__topo">
        <Link href={ROUTES.DASHBOARD} className="barra-lateral__logo-container" aria-label="Voltar ao início">
          <span className="barra-lateral__logo">OOfa</span>
        </Link>
      </div>

      <nav className="barra-lateral__navegacao">
        {itensMenu.map((item) => {
          const temSubmenu = !!item.subitens
          const ativo = verificarAtivo(item.link) || (item.subitens?.some((subitem) => verificarAtivo(subitem.link)) ?? false)
          const aberto = !!submenusAbertos[item.link]

          if (temSubmenu) {
            return (
              <div key={item.link} className="barra-lateral__item-grupo">
                <button
                  type="button"
                  onClick={() => alternarSubmenu(item.link)}
                  className={`barra-lateral__link barra-lateral__link--botao ${ativo ? 'barra-lateral__link--ativo' : ''}`}
                  data-titulo={item.titulo}
                  title={barraLateralRecolhida ? item.titulo : undefined}
                >
                  <span className="barra-lateral__icone">{item.icone}</span>
                  <span className="barra-lateral__texto">{item.titulo}</span>
                  {!barraLateralRecolhida && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`barra-lateral__seta ${aberto ? 'barra-lateral__seta--aberta' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>

                {/* Submenu visível quando expandido */}
                {!barraLateralRecolhida && aberto && (
                  <div className="barra-lateral__submenu">
                    {item.subitens?.map((subitem) => {
                      const subAtivo = verificarAtivo(subitem.link)
                      return (
                        <Link
                          key={subitem.link}
                          href={subitem.link}
                          className={`barra-lateral__sublink ${subAtivo ? 'barra-lateral__sublink--ativo' : ''}`}
                        >
                          {subitem.titulo}
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Submenu flutuante quando a Sidebar estiver recolhida */}
                {barraLateralRecolhida && (
                  <div className="barra-lateral__submenu-flutuante">
                    <div className="barra-lateral__submenu-titulo">{item.titulo}</div>
                    {item.subitens?.map((subitem) => {
                      const subAtivo = verificarAtivo(subitem.link)
                      return (
                        <Link
                          key={subitem.link}
                          href={subitem.link}
                          className={`barra-lateral__sublink ${subAtivo ? 'barra-lateral__sublink--ativo' : ''}`}
                        >
                          {subitem.titulo}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.link}
              href={item.link}
              className={`barra-lateral__link ${ativo ? 'barra-lateral__link--ativo' : ''}`}
              data-titulo={item.titulo}
              title={barraLateralRecolhida ? item.titulo : undefined}
            >
              <span className="barra-lateral__icone">{item.icone}</span>
              <span className="barra-lateral__texto">{item.titulo}</span>
            </Link>
          )
        })}
      </nav>

      <div className="barra-lateral__rodape">
        <div className="barra-lateral__mini-perfil">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Foto de ${nomeUsuario}`}
              className="barra-lateral__avatar"
            />
          ) : (
            <div className="barra-lateral__avatar" aria-hidden="true">
              {iniciaisNome}
            </div>
          )}
          <div className="barra-lateral__info-usuario">
            <span className="barra-lateral__nome-usuario" title={nomeUsuario || 'Usuário'}>
              {nomeUsuario || 'Usuário'}
            </span>
            <span className="barra-lateral__email-usuario" title={emailUsuario || 'usuario@oofa.com'}>
              {emailUsuario || 'usuario@oofa.com'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
