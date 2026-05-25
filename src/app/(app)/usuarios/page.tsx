import { obterTodosUsuarios } from "./acoes";
import { ListagemUsuarios } from "./_components/ListagemUsuarios";

// Força a página a carregar de forma dinâmica a cada requisição (sem cache estático indesejado)
export const dynamic = "force-dynamic";

/**
 * Página principal de Usuários (/usuarios).
 * Componente do lado do servidor (Server Component) que carrega os dados
 * do banco e repassa para a interface interativa do cliente.
 */
export default async function PaginaUsuarios() {
  const usuarios = await obterTodosUsuarios();

  return <ListagemUsuarios usuariosIniciais={usuarios} />;
}
