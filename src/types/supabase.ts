/**
 * Tipos gerados pelo Supabase CLI.
 * Para regenerar: npx supabase gen types typescript --project-id <id> > src/types/supabase.ts
 *
 * Este arquivo será sobrescrito automaticamente — não edite manualmente.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string
          full_name:  string
          email:      string
          role:       'admin' | 'gerente' | 'operador'
          is_active:  boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id:          string
          full_name:   string
          email:       string
          role?:       'admin' | 'gerente' | 'operador'
          is_active?:  boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?:         string
          full_name?:  string
          email?:      string
          role?:       'admin' | 'gerente' | 'operador'
          is_active?:  boolean
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views:    Record<string, never>
    Functions:Record<string, never>
    Enums: {
      user_role: 'admin' | 'gerente' | 'operador'
    }
  }
}
