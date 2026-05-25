import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/constants/routes'
import { Cabecalho } from '@/components/layout/Header'
import { BarraLateral } from '@/components/layout/Sidebar'
import './layout.css'

interface PropriedadesLayout {
  children: React.ReactNode
}

interface PerfilUsuario {
  full_name: string
  email: string
  role: 'admin' | 'gerente' | 'operador'
  avatar_url: string | null
}

/**
 * Layout principal das rotas protegidas (área autenticada).
 * Carrega dinamicamente a sessão do usuário do lado do servidor e renderiza o Cabeçalho e Barra Lateral.
 * Segue estritamente a convenção de nomenclatura em Português do Brasil.
 */
export default async function LayoutAplicativo({ children }: PropriedadesLayout) {
  const clienteSupabase = await createClient()

  // Recupera o usuário autenticado da sessão atual
  const {
    data: { user },
  } = await clienteSupabase.auth.getUser()

  // Se por alguma eventualidade o middleware falhar e não houver usuário ativo, redireciona ao login
  if (!user) {
    redirect(ROUTES.LOGIN)
  }

  // Busca dados de perfil estendidos na tabela 'profiles' do banco de dados
  const resultadoPerfil = await clienteSupabase
    .from('profiles')
    .select('full_name, email, role, avatar_url')
    .eq('id', user.id)
    .single()

  const perfil = resultadoPerfil.data as PerfilUsuario | null

  // Define dados com fallbacks seguros para evitar quebras de interface
  const nomeUsuario = perfil?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário'
  const emailUsuario = perfil?.email || user.email || ''
  const cargoUsuario = perfil?.role || 'operador'
  const avatarUrl = perfil?.avatar_url || user.user_metadata?.avatar_url || null

  return (
    <div className="layout-app">
      <BarraLateral
        nomeUsuario={nomeUsuario}
        emailUsuario={emailUsuario}
        avatarUrl={avatarUrl}
        cargoUsuario={cargoUsuario}
      />
      
      <div className="layout-app__principal">
        <Cabecalho
          nomeUsuario={nomeUsuario}
          cargoUsuario={cargoUsuario}
          avatarUrl={avatarUrl}
        />
        
        <main className="layout-app__conteudo">
          {children}
        </main>
      </div>
    </div>
  )
}
