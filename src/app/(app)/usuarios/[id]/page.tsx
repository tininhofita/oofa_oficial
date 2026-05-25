import { notFound } from "next/navigation";
import { obterUsuarioPorId } from "../acoes";
import { FormularioEditarUsuario } from "../_components/FormularioEditarUsuario";

interface PropriedadesPaginaEditar {
  params: Promise<{
    id: string;
  }>;
}

// Força a página a carregar de forma dinâmica
export const dynamic = "force-dynamic";

/**
 * Rota dinâmica de Edição de Usuário (/usuarios/[id]).
 * Server Component que busca as informações no banco Supabase
 * e renderiza o formulário de edição interativo.
 */
export default async function PaginaEditarUsuario({ params }: PropriedadesPaginaEditar) {
  // Aguarda os parâmetros dinâmicos de rota
  const { id } = await params;

  // Busca as informações originais do usuário
  const usuario = await obterUsuarioPorId(id);

  // Se o usuário correspondente ao ID não for localizado, retorna 404 nativo do Next.js
  if (!usuario) {
    notFound();
  }

  return <FormularioEditarUsuario usuario={usuario} />;
}
