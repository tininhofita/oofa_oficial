'use client'

import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useInterfaceUsuario } from '@/stores/ui.store'
import { ROUTES } from '@/constants/routes'
import './Header.css'

interface PropriedadesCabecalho {
  nomeUsuario?: string | null
  cargoUsuario?: string | null
  avatarUrl?: string | null
}

/**
 * Traduz o caminho da rota do App Router para um título de página bonito em Português.
 */
function obterTituloDaPagina(caminho: string): string {
  if (caminho === ROUTES.DASHBOARD) return 'Dashboard'
  if (caminho === ROUTES.CLIENTES) return 'Clientes'
  if (caminho === ROUTES.PRODUTOS) return 'Produtos'
  if (caminho === ROUTES.PEDIDOS) return 'Pedidos'
  if (caminho === ROUTES.FINANCEIRO) return 'Financeiro'
  if (caminho === ROUTES.CONTAS_PAGAR) return 'Contas a Pagar'
  if (caminho === ROUTES.CONTAS_RECEBER) return 'Contas a Receber'
  if (caminho === ROUTES.ESTOQUE) return 'Estoque'
  if (caminho === ROUTES.MOVIMENTACOES) return 'Movimentações'
  if (caminho === ROUTES.RELATORIOS) return 'Relatórios'
  if (caminho === ROUTES.INTEGRACOES) return 'Integrações'
  if (caminho === ROUTES.CONFIGURACOES) return 'Configurações'
  if (caminho === ROUTES.PERFIL) return 'Meu Perfil'
  if (caminho === ROUTES.USUARIOS) return 'Usuários'

  // Caso seja uma rota dinâmica ou desconhecida, faz um tratamento básico
  const partes = caminho.split('/').filter(Boolean)
  if (partes.length > 0) {
    const ultimaParte = partes[partes.length - 1]
    // Se for UUID ou número, pega o penúltimo segmento
    if (ultimaParte.length > 15 && partes.length > 1) {
      const segmentoAnterior = partes[partes.length - 2]
      return segmentoAnterior.charAt(0).toUpperCase() + segmentoAnterior.slice(1)
    }
    return ultimaParte.charAt(0).toUpperCase() + ultimaParte.slice(1)
  }

  return 'Oofa ERP'
}

/**
 * Componente Cabecalho do sistema.
 * Segue estritamente as regras de nomenclatura em Português do Brasil.
 */
export function Cabecalho({ nomeUsuario, cargoUsuario, avatarUrl }: PropriedadesCabecalho) {
  const rotaAtual = usePathname()
  const navegador = useRouter()
  const clienteSupabase = createClient()
  
  const { alternarBarraLateral } = useInterfaceUsuario()

  const tituloPagina = obterTituloDaPagina(rotaAtual)

  // Obtém as iniciais do nome para o avatar quando não houver imagem
  const iniciaisNome = nomeUsuario
    ? nomeUsuario
        .split(' ')
        .slice(0, 2)
        .map((nome) => nome.charAt(0).toUpperCase())
        .join('')
    : 'U'

  // Tradução do cargo do usuário para o português
  const cargoTraduzido = cargoUsuario === 'admin'
    ? 'Administrador'
    : cargoUsuario === 'gerente'
    ? 'Gerente'
    : cargoUsuario === 'operador'
    ? 'Operador'
    : 'Colaborador'

  async function lidarComLogout() {
    try {
      await clienteSupabase.auth.signOut()
      navegador.push(ROUTES.LOGIN)
      navegador.refresh()
    } catch (erro) {
      console.error('Erro ao tentar sair do sistema:', erro)
    }
  }

  return (
    <header className="cabecalho">
      <div className="cabecalho__secao-esquerda">
        <button
          className="cabecalho__botao-alternar"
          onClick={alternarBarraLateral}
          title="Alternar barra lateral"
          aria-label="Alternar barra lateral"
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
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
        <h1 className="cabecalho__titulo-pagina">{tituloPagina}</h1>
      </div>

      <div className="cabecalho__secao-direita">
        <div className="cabecalho__perfil-usuario">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`Avatar de ${nomeUsuario}`}
              className="cabecalho__avatar-usuario"
            />
          ) : (
            <div className="cabecalho__avatar-usuario" aria-hidden="true">
              {iniciaisNome}
            </div>
          )}
          <div className="cabecalho__detalhes-usuario">
            <span className="cabecalho__nome-usuario">{nomeUsuario || 'Usuário'}</span>
            <span className="cabecalho__cargo-usuario">{cargoTraduzido}</span>
          </div>
        </div>

        <button
          className="cabecalho__botao-sair"
          onClick={lidarComLogout}
          title="Sair do sistema"
          aria-label="Sair do sistema"
        >
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" x2="9" y1="12" y2="12" />
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </header>
  )
}
