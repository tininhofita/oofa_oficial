"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import "./AcessoRestrito.css";

/**
 * Componente que renderiza uma bela tela de acesso negado.
 * Oferece contagem regressiva animada de 5 segundos e redireciona ao painel principal (Dashboard).
 * Segue à risca a nomenclatura em Português BR e a proibição de emojis.
 */
export function AcessoRestrito() {
  const navegador = useRouter();
  const [segundosRestantes, definirSegundosRestantes] = useState(5);

  useEffect(() => {
    // Caso o contador zere, executa o redirecionamento
    if (segundosRestantes <= 0) {
      navegador.push(ROUTES.DASHBOARD);
      return;
    }

    // Declara timer de 1 segundo
    const cronometro = setTimeout(() => {
      definirSegundosRestantes((anterior) => anterior - 1);
    }, 1000);

    return () => clearTimeout(cronometro);
  }, [segundosRestantes, navegador]);

  function lidarComVoltarImediato() {
    navegador.push(ROUTES.DASHBOARD);
  }

  return (
    <div className="acesso-restrito">
      <div className="acesso-restrito__cartao">
        <div className="acesso-restrito__icone-container">
          {/* Ícone de escudo com sinalizador de bloqueio em SVG inline */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="acesso-restrito__icone"
            aria-hidden="true"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 className="acesso-restrito__titulo">Acesso Restrito</h2>
        <p className="acesso-restrito__descricao">
          Você não possui privilégios de acesso necessários para visualizar a área de gerenciamento de usuários.
        </p>

        <div className="acesso-restrito__contador-container">
          <span className="acesso-restrito__numero" aria-live="polite">
            {segundosRestantes}
          </span>
          <span className="acesso-restrito__contador-texto">
            Redirecionando você para o Dashboard...
          </span>
        </div>

        <button
          type="button"
          className="botao botao--primario acesso-restrito__botao"
          onClick={lidarComVoltarImediato}
        >
          {/* Ícone de seta de retorno */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "16px", height: "16px" }}
            aria-hidden="true"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Voltar ao Dashboard Agora
        </button>
      </div>
    </div>
  );
}
