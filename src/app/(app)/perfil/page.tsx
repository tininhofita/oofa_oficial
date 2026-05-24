import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'
import { FormularioPerfil } from './FormularioPerfil'
import './Perfil.css'

interface PerfilUsuario {
  full_name: string
  email: string
  role: 'admin' | 'gerente' | 'operador'
  avatar_url: string | null
}

/**
 * Página principal do Perfil do Usuário (Server Component).
 * Recupera os dados da tabela 'profiles' de forma segura no lado do servidor.
 * Segue estritamente a convenção de nomenclatura em Português do Brasil.
 */
export default async function PaginaPerfil() {
  const clienteSupabase = await createClient()

  // Recupera o usuário autenticado na sessão ativa do Supabase
  const {
    data: { user },
  } = await clienteSupabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Consulta dados estendidos de perfil do banco
  const { data: perfil } = (await clienteSupabase
    .from('profiles')
    .select('full_name, email, role, avatar_url')
    .eq('id', user.id)
    .single()) as unknown as { data: PerfilUsuario | null }

  // Estrutura dados consolidados com fallbacks seguros baseados na sessão de auth
  const dadosPerfil: PerfilUsuario = {
    full_name: perfil?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
    email: perfil?.email || user.email || '',
    role: perfil?.role || 'operador',
    avatar_url: perfil?.avatar_url || user.user_metadata?.avatar_url || null,
  }

  return (
    <div className="pagina-perfil">
      <header className="pagina-perfil__cabecalho">
        <h1 className="pagina-perfil__titulo">Meu Perfil</h1>
        <p className="pagina-perfil__subtitulo">
          Gerencie suas informações de acesso e dados cadastrais no sistema Oofa ERP.
        </p>
      </header>

      <FormularioPerfil perfilInicial={dadosPerfil} />
    </div>
  )
}
