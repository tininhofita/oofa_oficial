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
      bling_eventos: {
        Row: {
          id: string
          recurso: string
          acao: string
          event_id: string | null
          bling_id: number | null
          payload: Json
          status: 'recebido' | 'processado' | 'erro'
          erro_mensagem: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recurso: string
          acao: string
          event_id?: string | null
          bling_id?: number | null
          payload: Json
          status?: 'recebido' | 'processado' | 'erro'
          erro_mensagem?: string | null
          created_at?: string
        }
        Update: {
          status?: 'recebido' | 'processado' | 'erro'
          erro_mensagem?: string | null
        }
        Relationships: []
      }
      bling_estoques: {
        Row: {
          id: string
          bling_evento_id: string | null
          produto_id: number
          saldo_fisico_total: number | null
          saldo_virtual_total: number | null
          created_at: string
        }
        Insert: {
          id?: string
          bling_evento_id?: string | null
          produto_id: number
          saldo_fisico_total?: number | null
          saldo_virtual_total?: number | null
          created_at?: string
        }
        Update: {
          saldo_fisico_total?: number | null
          saldo_virtual_total?: number | null
        }
        Relationships: []
      }
      bling_pedidos_vendas: {
        Row: {
          id: string
          bling_evento_id: string | null
          bling_id: number
          acao: string
          numero: string | null
          numero_loja: string | null
          data: string | null
          data_saida: string | null
          data_prevista: string | null
          total_produtos: number | null
          total: number | null
          situacao_id: number | null
          situacao_valor: string | null
          contato_id: number | null
          contato_nome: string | null
          contato_tipo_pessoa: string | null
          contato_documento: string | null
          loja_id: number | null
          vendedor_id: number | null
          observacoes: string | null
          numero_pedido_compra: string | null
          itens: Json | null
          parcelas: Json | null
          transporte: Json | null
          payload_completo: Json
          created_at: string
        }
        Insert: {
          id?: string
          bling_evento_id?: string | null
          bling_id: number
          acao: string
          numero?: string | null
          numero_loja?: string | null
          data?: string | null
          data_saida?: string | null
          data_prevista?: string | null
          total_produtos?: number | null
          total?: number | null
          situacao_id?: number | null
          situacao_valor?: string | null
          contato_id?: number | null
          contato_nome?: string | null
          contato_tipo_pessoa?: string | null
          contato_documento?: string | null
          loja_id?: number | null
          vendedor_id?: number | null
          observacoes?: string | null
          numero_pedido_compra?: string | null
          itens?: Json | null
          parcelas?: Json | null
          transporte?: Json | null
          payload_completo: Json
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      bling_notas_fiscais: {
        Row: {
          id: string
          bling_evento_id: string | null
          bling_id: number
          acao: string
          tipo: string | null
          situacao: string | null
          numero: string | null
          serie: number | null
          data_emissao: string | null
          data_operacao: string | null
          contato_id: number | null
          contato_nome: string | null
          contato_documento: string | null
          loja_id: number | null
          chave_acesso: string | null
          link_danfe: string | null
          link_pdf: string | null
          payload_completo: Json
          created_at: string
        }
        Insert: {
          id?: string
          bling_evento_id?: string | null
          bling_id: number
          acao: string
          tipo?: string | null
          situacao?: string | null
          numero?: string | null
          serie?: number | null
          data_emissao?: string | null
          data_operacao?: string | null
          contato_id?: number | null
          contato_nome?: string | null
          contato_documento?: string | null
          loja_id?: number | null
          chave_acesso?: string | null
          link_danfe?: string | null
          link_pdf?: string | null
          payload_completo: Json
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      bling_notas_fiscais_consumidor: {
        Row: {
          id: string
          bling_evento_id: string | null
          bling_id: number
          acao: string
          tipo: string | null
          situacao: string | null
          numero: string | null
          serie: number | null
          valor_nota: number | null
          data_emissao: string | null
          data_operacao: string | null
          contato_id: number | null
          contato_nome: string | null
          contato_documento: string | null
          loja_id: number | null
          chave_acesso: string | null
          link_danfe: string | null
          link_pdf: string | null
          payload_completo: Json
          created_at: string
        }
        Insert: {
          id?: string
          bling_evento_id?: string | null
          bling_id: number
          acao: string
          tipo?: string | null
          situacao?: string | null
          numero?: string | null
          serie?: number | null
          valor_nota?: number | null
          data_emissao?: string | null
          data_operacao?: string | null
          contato_id?: number | null
          contato_nome?: string | null
          contato_documento?: string | null
          loja_id?: number | null
          chave_acesso?: string | null
          link_danfe?: string | null
          link_pdf?: string | null
          payload_completo: Json
          created_at?: string
        }
        Update: Record<string, never>
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
