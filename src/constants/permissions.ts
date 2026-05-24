import type { UserRole } from '@/types'

/**
 * Mapa de permissões por role.
 * Use este objeto para verificar acesso a funcionalidades.
 *
 * @example
 * import { PERMISSIONS } from '@/constants/permissions'
 * if (PERMISSIONS[user.role].podeVerFinanceiro) { ... }
 */

interface RolePermissions {
  // Usuários
  podeVerUsuarios:    boolean
  podeCriarUsuarios:  boolean
  podeEditarUsuarios: boolean
  podeDeletarUsuarios:boolean

  // Financeiro
  podeVerFinanceiro:  boolean

  // Relatórios
  podeVerRelatorios:     boolean
  podeExportarRelatorios:boolean

  // Sistema
  podeVerConfiguracoes:  boolean
  podeVerIntegracoes:    boolean

  // Estoque
  podeCriarMovimentacao: boolean
}

export const PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    podeVerUsuarios:       true,
    podeCriarUsuarios:     true,
    podeEditarUsuarios:    true,
    podeDeletarUsuarios:   true,
    podeVerFinanceiro:     true,
    podeVerRelatorios:     true,
    podeExportarRelatorios:true,
    podeVerConfiguracoes:  true,
    podeVerIntegracoes:    true,
    podeCriarMovimentacao: true,
  },
  gerente: {
    podeVerUsuarios:       true,
    podeCriarUsuarios:     false,
    podeEditarUsuarios:    false,
    podeDeletarUsuarios:   false,
    podeVerFinanceiro:     true,
    podeVerRelatorios:     true,
    podeExportarRelatorios:true,
    podeVerConfiguracoes:  false,
    podeVerIntegracoes:    true,
    podeCriarMovimentacao: true,
  },
  operador: {
    podeVerUsuarios:       false,
    podeCriarUsuarios:     false,
    podeEditarUsuarios:    false,
    podeDeletarUsuarios:   false,
    podeVerFinanceiro:     false,
    podeVerRelatorios:     true,
    podeExportarRelatorios:false,
    podeVerConfiguracoes:  false,
    podeVerIntegracoes:    false,
    podeCriarMovimentacao: false,
  },
}

/** Labels legíveis das roles para exibição na UI */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin:    'Administrador',
  gerente:  'Gerente',
  operador: 'Operador',
}
