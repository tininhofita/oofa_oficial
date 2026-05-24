'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface EstadoPerfil {
  sucesso: boolean
  erro: string | null
}

/**
 * Server Action para atualizar as informações de perfil do usuário.
 * Segue estritamente a convenção de nomenclatura em Português do Brasil.
 */
export async function atualizarPerfil(
  _estadoAnterior: EstadoPerfil,
  dadosFormulario: FormData
): Promise<EstadoPerfil> {
  try {
    const nomeCompleto = (dadosFormulario.get('nomeCompleto') as string)?.trim()
    const urlAvatar = (dadosFormulario.get('urlAvatar') as string)?.trim()

    // Validações básicas do lado do servidor
    if (!nomeCompleto) {
      return { sucesso: false, erro: 'O nome completo é obrigatório.' }
    }

    if (nomeCompleto.length < 3) {
      return { sucesso: false, erro: 'O nome completo deve conter pelo menos 3 caracteres.' }
    }

    const clienteSupabase = await createClient()

    // Obtém o usuário ativo na sessão
    const {
      data: { user },
    } = await clienteSupabase.auth.getUser()

    if (!user) {
      return { sucesso: false, erro: 'Sessão expirada. Faça login novamente.' }
    }

    // Atualiza a tabela profiles e solicita os dados atualizados de volta.
    // O select() permite validar se a linha foi de fato modificada (evitando sucessos falsos por RLS).
    const { data: dadosRetornados, error: erroAtualizacao } = await clienteSupabase
      .from('profiles')
      .update({
        full_name: nomeCompleto,
        avatar_url: urlAvatar || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()

    if (erroAtualizacao || !dadosRetornados || dadosRetornados.length === 0) {
      console.error('Erro ou bloqueio na atualização do perfil:', erroAtualizacao || 'Nenhuma linha foi alterada (RLS de UPDATE pendente?)')
      return { 
        sucesso: false, 
        erro: 'Não foi possível salvar as alterações. Verifique as permissões de escrita do seu usuário.' 
      }
    }

    // Força a revalidação para atualizar o Header e a Sidebar imediatamente
    revalidatePath('/perfil')
    revalidatePath('/', 'layout')

    return { sucesso: true, erro: null }
  } catch (erro) {
    console.error('Erro inesperado no servidor ao tentar atualizar o perfil:', erro)
    return { 
      sucesso: false, 
      erro: 'Ocorreu um erro inesperado. Por favor, tente novamente.' 
    }
  }
}
