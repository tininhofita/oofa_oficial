import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/constants/routes";
import { PERMISSIONS } from "@/constants/permissions";
import { AcessoRestrito } from "./_components/AcessoRestrito";
import type { UserRole } from "@/types";

interface PropriedadesLayoutUsuarios {
  children: React.ReactNode;
}

/**
 * Layout de segurança para a rota /usuarios e sub-rotas.
 * Valida dinamicamente no lado do servidor se o usuário possui acesso à gestão de usuários.
 * Caso contrário, renderiza a tela premium de bloqueio com redirecionamento de 5 segundos.
 */
export default async function LayoutUsuarios({ children }: PropriedadesLayoutUsuarios) {
  const clienteSupabase = (await createClient()) as any;

  // Obtém o usuário ativo na sessão
  const {
    data: { user },
  } = await clienteSupabase.auth.getUser();

  // Redireciona para o login caso não esteja logado
  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // Busca a role específica deste usuário no profiles
  const resultadoPerfil = await clienteSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const roleUsuario = (resultadoPerfil.data?.role || "operador") as UserRole;

  // Verifica as permissões associadas à role do usuário
  const podeAcessar = PERMISSIONS[roleUsuario]?.podeVerUsuarios || false;

  if (!podeAcessar) {
    return <AcessoRestrito />;
  }

  return <>{children}</>;
}
