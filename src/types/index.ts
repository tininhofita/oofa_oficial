/**
 * Types globais do Oofa ERP.
 * Para tipos gerados automaticamente pelo Supabase, veja src/types/supabase.ts
 */

// ----------------------------------------------------------
// Usuários / Auth
// ----------------------------------------------------------

export type UserRole = 'admin' | 'gerente' | 'operador'

export interface Profile {
  id:          string
  full_name:   string
  email:       string
  role:        UserRole
  is_active:   boolean
  avatar_url:  string | null
  created_at:  string
  updated_at:  string
}

// ----------------------------------------------------------
// Paginação
// ----------------------------------------------------------

export interface PaginationMeta {
  page:        number
  per_page:    number
  total:       number
  total_pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// ----------------------------------------------------------
// Respostas de API
// ----------------------------------------------------------

export interface ApiSuccess<T = unknown> {
  ok:   true
  data: T
}

export interface ApiError {
  ok:      false
  message: string
  code?:   string
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ----------------------------------------------------------
// Sync de integrações
// ----------------------------------------------------------

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error'

export interface SyncResult {
  source:      'bling' | 'nuvemshop'
  status:      SyncStatus
  records:     number
  started_at:  string
  finished_at: string
  error?:      string
}
