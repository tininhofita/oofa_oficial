"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS, ROLE_LABELS } from "@/constants/permissions";
import type { Profile, UserRole } from "@/types";
import { atualizarUsuario } from "../acoes";
import "../usuarios.css";

interface PropriedadesFormularioEditar {
  usuario: Profile;
}

/**
 * Interface que traduz as chaves de permissões para títulos legíveis na prévia.
 */
const TITULOS_PERMISSOES: Record<string, string> = {
  podeVerUsuarios: "Ver Menu Usuários",
  podeCriarUsuarios: "Criar Novos Usuários",
  podeEditarUsuarios: "Editar Usuários Existentes",
  podeDeletarUsuarios: "Excluir Usuários",
  podeVerFinanceiro: "Acessar Financeiro",
  podeVerRelatorios: "Ver Relatórios",
  podeExportarRelatorios: "Exportar Relatórios (CSV/PDF)",
  podeVerConfiguracoes: "Configurações do Sistema",
  podeVerIntegracoes: "Gerenciar Integrações",
  podeCriarMovimentacao: "Movimentar Estoque",
};

/**
 * Componente cliente com formulário premium de edição de usuário.
 * Permite alterar Nome, E-mail, Cargo, Status de ativação e redefinir senha.
 */
export function FormularioEditarUsuario({ usuario }: PropriedadesFormularioEditar) {
  const navegador = useRouter();
  const [carregando, definirCarregando] = useState(false);
  const [erro, definirErro] = useState<string | null>(null);

  // Estados dos campos preenchidos com os dados originais do usuário
  const [nome, definirNome] = useState(usuario.full_name);
  const [email, definirEmail] = useState(usuario.email);
  const [senha, definirSenha] = useState(""); // Começa vazia (opcional)
  const [funcao, definirFuncao] = useState<UserRole>(usuario.role as UserRole);
  const [ativo, definirAtivo] = useState(usuario.is_active);

  // Obtém o mapa de permissões da role selecionada
  const permissoesAtivas = PERMISSIONS[funcao];

  async function lidarComSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    definirCarregando(true);
    definirErro(null);

    const dadosFormulario = new FormData();
    dadosFormulario.append("nomeCompleto", nome);
    dadosFormulario.append("email", email);
    dadosFormulario.append("senha", senha); // Caso preenchida, altera a senha no Auth
    dadosFormulario.append("role", funcao);
    dadosFormulario.append("ativo", String(ativo));

    try {
      const resultado = await atualizarUsuario(usuario.id, { sucesso: false, erro: null }, dadosFormulario);

      if (resultado.sucesso) {
        navegador.push(ROUTES.USUARIOS);
        navegador.refresh();
      } else {
        definirErro(resultado.erro || "Não foi possível atualizar as informações.");
      }
    } catch (err) {
      console.error(err);
      definirErro("Ocorreu um erro inesperado no processamento dos dados.");
    } finally {
      definirCarregando(false);
    }
  }

  return (
    <div className="pagina-usuarios">
      {/* Topo / Voltar */}
      <div className="pagina-usuarios__topo">
        <div className="pagina-usuarios__titulo-container">
          <h2 className="pagina-usuarios__titulo">Editar Cadastro: {usuario.full_name}</h2>
          <p className="pagina-usuarios__subtitulo">
            Altere as informações cadastrais, defina o status ativo ou redefina as credenciais deste colaborador.
          </p>
        </div>

        <Link href={ROUTES.USUARIOS} className="btn btn--secondary">
          {/* Ícone seta voltar */}
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
          Voltar à Lista
        </Link>
      </div>

      {/* Cartão de Formulário */}
      <div className="cartao-formulario">
        <form className="formulario-usuario" onSubmit={lidarComSubmit}>
          {/* Mensagem de Erro */}
          {erro && (
            <div className="alerta alerta--perigo" role="alert">
              <span className="alerta__texto">{erro}</span>
            </div>
          )}

          {/* Grid de inputs */}
          <div className="formulario-usuario__grid">
            <div className="form-field">
              <label htmlFor="nomeCompleto" className="form-label">
                Nome Completo
              </label>
              <input
                type="text"
                id="nomeCompleto"
                className="form-input"
                required
                value={nome}
                onChange={(e) => {
                  const valor = e.target.value;
                  // Máscara: Capitaliza a primeira letra de cada palavra em tempo real
                  const valorFormatado = valor.replace(/\b\w/g, (caractere) => caractere.toUpperCase());
                  definirNome(valorFormatado);
                }}
              />
            </div>

            <div className="form-field">
              <label htmlFor="email" className="form-label">
                Endereço de E-mail
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                required
                value={email}
                onChange={(e) => definirEmail(e.target.value)}
              />
            </div>

            <div className="formulario-usuario__grid formulario-usuario__grid--duplo" style={{ gap: "var(--space-4)" }}>
              <div className="form-field">
                <label htmlFor="senha" className="form-label">
                  Redefinir Senha de Acesso (Opcional)
                </label>
                <input
                  type="password"
                  id="senha"
                  placeholder="Deixe em branco para manter"
                  className="form-input"
                  value={senha}
                  onChange={(e) => definirSenha(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor="role" className="form-label">
                  Função / Cargo
                </label>
                <select
                  id="role"
                  className="form-select"
                  value={funcao}
                  onChange={(e) => definirFuncao(e.target.value as UserRole)}
                  aria-label="Selecionar função"
                >
                  {Object.entries(ROLE_LABELS).map(([chave, label]) => (
                    <option key={chave} value={chave}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alternar Status (Ativo / Inativo) */}
            <div className="form-field">
              <label htmlFor="ativo" className="form-label">
                Status do Usuário
              </label>
              <select
                id="ativo"
                className="form-select"
                value={String(ativo)}
                onChange={(e) => definirAtivo(e.target.value === "true")}
                aria-label="Definir status ativo ou inativo"
              >
                <option value="true">Ativo (Permitir acesso ao sistema)</option>
                <option value="false">Inativo (Bloquear todo acesso ao sistema)</option>
              </select>
            </div>
          </div>

          {/* Painel visual de visualização prévia de permissões */}
          <div className="painel-permissoes">
            <h3 className="painel-permissoes__titulo">
              {/* Ícone de escudo chave */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="painel-permissoes__titulo-icone"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Permissões Atuais do Cargo: {ROLE_LABELS[funcao]}
            </h3>
            <div className="painel-permissoes__grid">
              {Object.entries(TITULOS_PERMISSOES).map(([permissaoKey, tituloExibido]) => {
                const possuiPermissao = (permissoesAtivas as any)[permissaoKey] || false;

                return (
                  <div
                    key={permissaoKey}
                    className={`item-permissao ${
                      possuiPermissao ? "item-permissao--permitido" : "item-permissao--bloqueado"
                    }`}
                  >
                    {possuiPermissao ? (
                      /* Ícone check verde */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="item-permissao__icone"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      /* Ícone X vermelho/cinza */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="item-permissao__icone"
                        aria-hidden="true"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    )}
                    {tituloExibido}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botões do formulário */}
          <div className="formulario-usuario__botoes">
            <Link href={ROUTES.USUARIOS} className="btn btn--secondary">
              Cancelar
            </Link>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={carregando}
              style={{ minWidth: "120px" }}
            >
              {carregando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
