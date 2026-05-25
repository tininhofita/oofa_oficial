"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { PERMISSIONS } from "@/constants/permissions";
import type { UserRole, Profile } from "@/types";

interface EstadoAcao {
  sucesso: boolean;
  erro: string | null;
}

/**
 * Verifica se o usuário que está executando a ação é de fato um Administrador.
 * Garante uma camada extra de segurança do lado do servidor.
 */
async function verificarSeEhAdmin(): Promise<boolean> {
  const clienteSupabase = (await createClient()) as any;
  const {
    data: { user },
  } = await clienteSupabase.auth.getUser();

  if (!user) return false;

  const resultadoPerfil = await clienteSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = resultadoPerfil.data?.role as UserRole;
  return role === "admin";
}

/**
 * Server Action para obter todos os usuários cadastrados na base.
 * Para contornar problemas de recursão infinita em RLS no Supabase ao fazer buscas coletivas,
 * usamos o cliente administrativo do lado do servidor de forma 100% segura.
 */
export async function obterTodosUsuarios(): Promise<Profile[]> {
  const clienteAdmin = criarClienteAdmin();

  const { data: perfis, error } = await clienteAdmin
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("[Oofa] Erro ao obter lista de usuários:", error);
    return [];
  }

  return (perfis || []) as Profile[];
}

/**
 * Server Action para obter os dados de um usuário específico a partir do seu ID.
 */
export async function obterUsuarioPorId(id: string): Promise<Profile | null> {
  const clienteAdmin = criarClienteAdmin();

  const { data: perfil, error } = await clienteAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(`[Oofa] Erro ao buscar usuário ${id}:`, error);
    return null;
  }

  return perfil as Profile;
}

/**
 * Server Action para alternar o status de ativação (ativo/inativo) de um usuário.
 */
export async function alternarStatusUsuario(
  id: string,
  novoStatusAtivo: boolean
): Promise<EstadoAcao> {
  try {
    const ehAdmin = await verificarSeEhAdmin();
    if (!ehAdmin) {
      return { sucesso: false, erro: "Ação não autorizada. Apenas administradores podem gerenciar usuários." };
    }

    const clienteAdmin = criarClienteAdmin();

    const { error } = await clienteAdmin
      .from("profiles")
      .update({
        is_active: novoStatusAtivo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("[Oofa] Erro ao alternar status do usuário:", error);
      return { sucesso: false, erro: "Não foi possível atualizar o status do usuário no banco." };
    }

    revalidatePath("/usuarios");
    return { sucesso: true, erro: null };
  } catch (erro) {
    console.error("[Oofa] Erro inesperado ao alternar status:", erro);
    return { sucesso: false, erro: "Ocorreu um erro inesperado do lado do servidor." };
  }
}

/**
 * Server Action para criar um novo usuário no sistema Oofa ERP.
 * Cria a conta no Supabase Auth usando a Admin API e a trigger de banco cria o profile.
 */
export async function criarUsuario(
  _estadoAnterior: EstadoAcao,
  dadosFormulario: FormData
): Promise<EstadoAcao> {
  try {
    const ehAdmin = await verificarSeEhAdmin();
    if (!ehAdmin) {
      return { sucesso: false, erro: "Ação não autorizada. Apenas administradores podem cadastrar usuários." };
    }

    const nomeCompleto = (dadosFormulario.get("nomeCompleto") as string)?.trim();
    const email = (dadosFormulario.get("email") as string)?.trim().toLowerCase();
    const senha = dadosFormulario.get("senha") as string;
    const role = dadosFormulario.get("role") as UserRole;

    // Validações básicas
    if (!nomeCompleto || !email || !senha || !role) {
      return { sucesso: false, erro: "Todos os campos do formulário são obrigatórios." };
    }

    if (nomeCompleto.length < 3) {
      return { sucesso: false, erro: "O nome do usuário deve ter pelo menos 3 caracteres." };
    }

    if (senha.length < 6) {
      return { sucesso: false, erro: "A senha de acesso deve ter pelo menos 6 caracteres." };
    }

    const clienteAdmin = criarClienteAdmin();

    // Cria o usuário na base de dados de autenticação com bypass de RLS via Admin API
    const { data: dadosCriados, error: erroCriacao } = await clienteAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        full_name: nomeCompleto,
        role: role,
      },
    });

    if (erroCriacao || !dadosCriados.user) {
      console.error("[Oofa] Erro da Admin API ao criar usuário:", erroCriacao);
      if (erroCriacao?.message.includes("already registered")) {
        return { sucesso: false, erro: "Este endereço de e-mail já está cadastrado no sistema." };
      }
      return { sucesso: false, erro: erroCriacao?.message || "Ocorreu um erro ao criar a conta do usuário." };
    }

    revalidatePath("/usuarios");
    return { sucesso: true, erro: null };
  } catch (erro) {
    console.error("[Oofa] Erro inesperado ao criar usuário:", erro);
    return { sucesso: false, erro: "Erro inesperado do lado do servidor." };
  }
}

/**
 * Server Action para atualizar as informações de um usuário existente.
 * Permite que o administrador altere o nome completo, a role, o status, o e-mail e redefina a senha.
 */
export async function atualizarUsuario(
  id: string,
  _estadoAnterior: EstadoAcao,
  dadosFormulario: FormData
): Promise<EstadoAcao> {
  try {
    const ehAdmin = await verificarSeEhAdmin();
    if (!ehAdmin) {
      return { sucesso: false, erro: "Ação não autorizada. Apenas administradores podem editar usuários." };
    }

    const nomeCompleto = (dadosFormulario.get("nomeCompleto") as string)?.trim();
    const email = (dadosFormulario.get("email") as string)?.trim().toLowerCase();
    const senhaOpcional = dadosFormulario.get("senha") as string;
    const role = dadosFormulario.get("role") as UserRole;
    const ativo = dadosFormulario.get("ativo") === "true";

    if (!nomeCompleto || !email || !role) {
      return { sucesso: false, erro: "Nome completo, e-mail e função são obrigatórios." };
    }

    if (nomeCompleto.length < 3) {
      return { sucesso: false, erro: "O nome do usuário deve ter pelo menos 3 caracteres." };
    }

    if (senhaOpcional && senhaOpcional.length < 6) {
      return { sucesso: false, erro: "A nova senha deve ter pelo menos 6 caracteres se preenchida." };
    }

    const clienteAdmin = criarClienteAdmin();

    // 1. Atualizar e-mail e/ou senha na autenticação via Admin API do Supabase
    const atualizacoesAuth: { email?: string; password?: string } = { email };
    if (senhaOpcional) {
      atualizacoesAuth.password = senhaOpcional;
    }

    const { error: erroAtualizacaoAuth } = await clienteAdmin.auth.admin.updateUserById(
      id,
      atualizacoesAuth
    );

    if (erroAtualizacaoAuth) {
      console.error(`[Oofa] Erro da Admin API ao atualizar usuário auth ${id}:`, erroAtualizacaoAuth);
      if (erroAtualizacaoAuth.message.includes("email already exists")) {
        return { sucesso: false, erro: "Este endereço de e-mail já está sendo usado por outro usuário." };
      }
      return { sucesso: false, erro: "Erro ao atualizar dados de autenticação do usuário." };
    }

    // 2. Atualizar perfil correspondente na tabela profiles usando o cliente admin para evitar restrições de RLS recursiva
    const { error: erroAtualizacaoPerfil } = await clienteAdmin
      .from("profiles")
      .update({
        full_name: nomeCompleto,
        email,
        role,
        is_active: ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (erroAtualizacaoPerfil) {
      console.error(`[Oofa] Erro ao atualizar tabela profiles para usuário ${id}:`, erroAtualizacaoPerfil);
      return { sucesso: false, erro: "Não foi possível atualizar as informações cadastrais do usuário." };
    }

    revalidatePath("/usuarios");
    revalidatePath(`/usuarios/${id}`);
    return { sucesso: true, erro: null };
  } catch (erro) {
    console.error("[Oofa] Erro inesperado ao atualizar usuário:", erro);
    return { sucesso: false, erro: "Erro inesperado do lado do servidor." };
  }
}

/**
 * Server Action para excluir permanentemente um usuário da base de dados e da autenticação.
 */
export async function excluirUsuario(id: string): Promise<EstadoAcao> {
  try {
    const ehAdmin = await verificarSeEhAdmin();
    if (!ehAdmin) {
      return { sucesso: false, erro: "Ação não autorizada. Apenas administradores podem excluir usuários." };
    }

    const clienteAdmin = criarClienteAdmin();

    // Remove do Auth do Supabase (por cascade na constraint FK da tabela profiles, removerá o profile)
    const { error } = await clienteAdmin.auth.admin.deleteUser(id);

    if (error) {
      console.error(`[Oofa] Erro ao excluir usuário ${id} via Admin API:`, error);
      return { sucesso: false, erro: "Erro do Supabase ao tentar deletar a conta de autenticação." };
    }

    revalidatePath("/usuarios");
    return { sucesso: true, erro: null };
  } catch (erro) {
    console.error("[Oofa] Erro inesperado ao excluir usuário:", erro);
    return { sucesso: false, erro: "Ocorreu um erro inesperado no processamento." };
  }
}
