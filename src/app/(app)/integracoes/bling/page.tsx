'use client'

import Link from 'next/link'
import { ROUTES } from '@/constants/routes'
import '../integracoes.css'

/**
 * Página de Integração com o Bling ERP.
 * Apresenta um layout premium informando que a funcionalidade está em construção.
 * Segue estritamente as regras de nomenclatura em Português do Brasil.
 */
export default function PaginaIntegracaoBling() {
  return (
    <div className="pagina-integracao">
      <div className="pagina-integracao__painel">
        <div className="pagina-integracao__distintivo">
          <span className="pagina-integracao__distintivo-ponto" />
          Em Construção
        </div>

        <div className="pagina-integracao__vetor-container">
          <svg
            className="pagina-integracao__vetor"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M4.93 4.93l1.41 1.41" />
            <path d="M17.66 17.66l1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 4.93l-1.41 1.41" />
            <path d="M22 22L2 2" />
          </svg>
        </div>

        <h2 className="pagina-integracao__titulo">Integração Externa</h2>
        <div className="pagina-integracao__marca">Bling ERP</div>

        <p className="pagina-integracao__descricao">
          Estamos preparando a melhor experiência de sincronização para os seus produtos, estoque e pedidos vindos do Bling. Em breve estará disponível!
        </p>

        <Link href={ROUTES.INTEGRACOES} className="pagina-integracao__botao-voltar">
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
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Voltar para Integrações
        </Link>
      </div>
    </div>
  )
}
