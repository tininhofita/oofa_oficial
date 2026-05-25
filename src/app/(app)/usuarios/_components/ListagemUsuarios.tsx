"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTE_PARAMS, ROUTES } from "@/constants/routes";
import { ROLE_LABELS } from "@/constants/permissions";
import type { Profile, UserRole } from "@/types";
import { alternarStatusUsuario, excluirUsuario } from "../acoes";
import "../usuarios.css";

interface PropriedadesListagemUsuarios {
  usuariosIniciais: Profile[];
}

/**
 * Componente cliente para visualização interativa e gestão de usuários.
 * Implementa buscas em tempo real, filtros por status, ativação e exclusão.
 */
export function ListagemUsuarios({ usuariosIniciais }: PropriedadesListagemUsuarios) {
  const navegador = useRouter();
  const [usuarios, definirUsuarios] = useState<Profile[]>(usuariosIniciais);
  const [busca, definirBusca] = useState("");
  const [filtroStatus, definirFiltroStatus] = useState<"todos" | "ativos" | "inativos">("todos");
  const [estaPendente, iniciarTransicao] = useTransition();

  // Filtragem em tempo real (Nome / Email) e por status de ativação
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const correspondeBusca =
      usuario.full_name.toLowerCase().includes(busca.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busca.toLowerCase());

    const correspondeStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && usuario.is_active) ||
      (filtroStatus === "inativos" && !usuario.is_active);

    return correspondeBusca && correspondeStatus;
  });

  // Ação rápida para Ativar ou Inativar
  async function lidarComAlternarStatus(id: string, statusAtual: boolean) {
    const novoStatus = !statusAtual;

    // Atualização otimista local
    definirUsuarios((anteriores) =>
      anteriores.map((u) => (u.id === id ? { ...u, is_active: novoStatus } : u))
    );

    const resultado = await alternarStatusUsuario(id, novoStatus);

    if (!resultado.sucesso) {
      alert(resultado.erro || "Ocorreu um erro ao atualizar o status do usuário.");
      // Reverte em caso de falha
      definirUsuarios((anteriores) =>
        anteriores.map((u) => (u.id === id ? { ...u, is_active: statusAtual } : u))
      );
    }
  }

  // Ação de exclusão permanente com confirmação em português
  async function lidarComExclusao(id: string, nome: string) {
    const confirmou = window.confirm(
      `Deseja realmente EXCLUIR permanentemente o usuário "${nome}"?\n\nEsta ação é irreversível e apagará o cadastro de autenticação correspondente.`
    );

    if (!confirmou) return;

    // Remove localmente antes
    const listaOriginal = [...usuarios];
    definirUsuarios((anteriores) => anteriores.filter((u) => u.id !== id));

    const resultado = await excluirUsuario(id);

    if (resultado.sucesso) {
      navegador.refresh();
    } else {
      alert(resultado.erro || "Não foi possível excluir o usuário.");
      // Reverte em caso de falha
      definirUsuarios(listaOriginal);
    }
  }

  return (
    <div className="pagina-usuarios">
      {/* Topo da página */}
      <div className="pagina-usuarios__topo">
        <div className="pagina-usuarios__titulo-container">
          <h2 className="pagina-usuarios__titulo">Colaboradores e Acessos</h2>
          <p className="pagina-usuarios__subtitulo">
            Gerencie os usuários do sistema, suas credenciais e respectivos níveis de permissão.
          </p>
        </div>

        <Link href={ROUTES.USUARIOS + "/novo"} className="btn btn--primary">
          {/* Ícone de adicionar */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: "18px", height: "18px" }}
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Adicionar Usuário
        </Link>
      </div>

      {/* Painel de Filtros e Busca */}
      <div className="pagina-usuarios__filtros-painel">
        <div className="pagina-usuarios__grupo-busca">
          <div className="pagina-usuarios__busca-wrapper">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pagina-usuarios__icone-busca"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Buscar colaborador por nome ou e-mail..."
              className="form-input pagina-usuarios__input-busca"
              value={busca}
              onChange={(e) => definirBusca(e.target.value)}
            />
          </div>
        </div>

        <select
          className="form-select pagina-usuarios__select-status"
          value={filtroStatus}
          onChange={(e) => definirFiltroStatus(e.target.value as any)}
          aria-label="Filtrar por status"
        >
          <option value="todos">Todos os Status</option>
          <option value="ativos">Apenas Ativos</option>
          <option value="inativos">Apenas Inativos</option>
        </select>
      </div>

      {/* Tabela de Usuários */}
      <div className="tabela-container">
        {usuariosFiltrados.length === 0 ? (
          <div className="carregando-alerta">
            Nenhum usuário encontrado com os filtros aplicados.
          </div>
        ) : (
          <table className="tabela-usuarios">
            <thead className="tabela-usuarios__cabecalho">
              <tr>
                <th className="tabela-usuarios__cabecalho-th">Colaborador</th>
                <th className="tabela-usuarios__cabecalho-th">Função / Nível</th>
                <th className="tabela-usuarios__cabecalho-th">Status</th>
                <th className="tabela-usuarios__cabecalho-th" style={{ textAlign: "right" }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((usuario) => {
                const iniciais = usuario.full_name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n.charAt(0).toUpperCase())
                  .join("");

                return (
                  <tr key={usuario.id} className="tabela-usuarios__linha">
                    {/* Informações Básicas */}
                    <td className="tabela-usuarios__celula">
                      <div className="usuario-perfil-cel">
                        <div className="usuario-perfil-cel__avatar">
                          {usuario.avatar_url ? (
                            <img
                              src={usuario.avatar_url}
                              alt={usuario.full_name}
                              className="usuario-perfil-cel__avatar-img"
                            />
                          ) : (
                            iniciais
                          )}
                        </div>
                        <div className="usuario-perfil-cel__info">
                          <span className="usuario-perfil-cel__nome">{usuario.full_name}</span>
                          <span className="usuario-perfil-cel__email">{usuario.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role / Nível de Acesso */}
                    <td className="tabela-usuarios__celula">
                      <span className={`badge-role badge-role--${usuario.role}`}>
                        {ROLE_LABELS[usuario.role as UserRole] || usuario.role}
                      </span>
                    </td>

                    {/* Status de Ativação */}
                    <td className="tabela-usuarios__celula">
                      <span
                        className={`badge-status badge-status--${
                          usuario.is_active ? "ativo" : "inativo"
                        }`}
                      >
                        {usuario.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="tabela-usuarios__celula" style={{ textAlign: "right" }}>
                      <div
                        className="pagina-usuarios__acoes-grupo"
                        style={{ justifyContent: "flex-end" }}
                      >
                        {/* Botão de rápido Alternar Status */}
                        <button
                          type="button"
                          className="botao-acao"
                          title={usuario.is_active ? "Inativar Usuário" : "Ativar Usuário"}
                          onClick={() => lidarComAlternarStatus(usuario.id, usuario.is_active)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: "15px", height: "15px" }}
                            aria-hidden="true"
                          >
                            <rect width="20" height="12" x="2" y="6" rx="6" ry="6" />
                            <circle
                              cx={usuario.is_active ? "16" : "8"}
                              cy="12"
                              r="4"
                              fill="currentColor"
                            />
                          </svg>
                        </button>

                        {/* Botão de Edição */}
                        <Link
                          href={ROUTE_PARAMS.usuario(usuario.id)}
                          className="botao-acao"
                          title="Editar Usuário"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: "15px", height: "15px" }}
                            aria-hidden="true"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                        </Link>

                        {/* Botão de Excluir */}
                        <button
                          type="button"
                          className="botao-acao botao-acao--excluir"
                          title="Excluir Usuário"
                          onClick={() => lidarComExclusao(usuario.id, usuario.full_name)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: "15px", height: "15px" }}
                            aria-hidden="true"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
