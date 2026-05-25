-- ============================================================
-- Schema de referência — tabelas custos e compras (Planejado vs. Realizado)
-- Consulte este arquivo antes de qualquer trabalho com custos e compras.
-- Migration original: supabase/migrations/002_custos.sql
-- ============================================================

-- 1. Tabela de Compras (Esqueleto Inicial)
-- Esta tabela será integrada futuramente com produtos do Bling ERP.
CREATE TABLE compras (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID           NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor    TEXT,
  total         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  data_compra   DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- 2. Tabela de Custos (Planejado vs. Realizado)
CREATE TABLE custos (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID           NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo                   TEXT           NOT NULL,
  sub_grupo               TEXT,
  tipo                    TEXT           NOT NULL,
  descricao               TEXT           NOT NULL,
  canal                   TEXT           DEFAULT 'Geral',
  quantidade_prevista      NUMERIC(12, 2) NOT NULL DEFAULT 1,
  quantidade_real          NUMERIC(12, 2) NOT NULL DEFAULT 1,
  valor_unitario_previsto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_unitario_real     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  nao_ocorreu             BOOLEAN        NOT NULL DEFAULT FALSE,
  data_custo              DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  compra_id               UUID           REFERENCES compras(id) ON DELETE CASCADE,
  
  CONSTRAINT custos_tipo_check CHECK (
    tipo = ANY (ARRAY['Fixo'::text, 'Variável'::text, 'Investimento'::text])
  )
) TABLESPACE pg_default;

-- Campos da tabela custos:
--   id                      → Identificador único UUID do lançamento
--   user_id                 → Referência ao usuário do Supabase Auth que registrou o custo
--   grupo                   → Grupo de despesas (Administrativo, Logística, Pessoal, etc.)
--   sub_grupo               → Subgrupo de despesa (Salário, Benefícios, Marketing, etc.)
--   tipo                    → Tipo de despesa ('Fixo' | 'Variável' | 'Investimento')
--   descricao               → Descrição detalhada do lançamento
--   canal                   → Canal associado ao custo ('Geral' | 'E-commerce' | 'Shows')
--   quantidade_prevista     → Quantidade orçada (planejada) do lançamento
--   quantidade_real         → Quantidade comprada (efetivamente ocorrida) do lançamento
--   valor_unitario_previsto → Valor unitário planejado (orçado) do lançamento
--   valor_unitario_real     → Valor unitário acontecido (realizado) do lançamento
--   nao_ocorreu             → Sinaliza se a despesa prevista não ocorreu/foi cancelada
--   data_custo              → Data de ocorrência/vencimento do custo
--   created_at              → Registro de auditoria do momento da inserção
--   compra_id               → UUID opcional relacionando este custo a uma compra de mercadoria

-- Políticas de RLS recomendadas:
--   ALTER TABLE custos ENABLE ROW LEVEL SECURITY;
--   CREATE POLICY "custos_todos_proprios" ON custos TO authenticated USING (auth.uid() = user_id);
