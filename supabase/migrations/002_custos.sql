-- ============================================================
-- Migration 002 — Criação das tabelas de custos e compras (Planejado vs. Realizado)
-- Define tabelas, índices de busca e políticas de RLS.
--
-- Para aplicar: cole no SQL Editor do Supabase Studio
-- ou use: supabase db push
-- ============================================================

-- ----------------------------------------------------------
-- 1. Criação da Tabela de Compras (Esqueleto Inicial)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compras (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID           NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  fornecedor    TEXT,
  total         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  data_compra   DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------
-- 2. Criação da Tabela de Custos (Planejado vs. Realizado)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custos (
  id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID           NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo                   TEXT           NOT NULL,
  sub_grupo               TEXT,
  tipo                    TEXT           NOT NULL,
  descricao               TEXT           NOT NULL,
  canal                   TEXT           DEFAULT 'Geral',
  quantidade              NUMERIC(12, 2) NOT NULL DEFAULT 1,
  valor_unitario_previsto NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_unitario_real     NUMERIC(12, 2) NOT NULL DEFAULT 0,
  data_custo              DATE           NOT NULL DEFAULT CURRENT_DATE,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  compra_id               UUID           REFERENCES public.compras(id) ON DELETE CASCADE,
  
  CONSTRAINT custos_tipo_check CHECK (
    tipo = ANY (ARRAY['Fixo'::text, 'Variável'::text, 'Investimento'::text])
  )
) TABLESPACE pg_default;

-- ----------------------------------------------------------
-- 3. Índices de Performance
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_custos_user_id     ON public.custos(user_id);
CREATE INDEX IF NOT EXISTS idx_custos_grupo       ON public.custos(grupo);
CREATE INDEX IF NOT EXISTS idx_custos_sub_grupo   ON public.custos(sub_grupo);
CREATE INDEX IF NOT EXISTS idx_custos_tipo        ON public.custos(tipo);
CREATE INDEX IF NOT EXISTS idx_custos_data_custo   ON public.custos(data_custo);

CREATE INDEX IF NOT EXISTS idx_compras_user_id    ON public.compras(user_id);
CREATE INDEX IF NOT EXISTS idx_compras_data_compra ON public.compras(data_compra);

-- ----------------------------------------------------------
-- 4. RLS — Row Level Security
-- ----------------------------------------------------------
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;

-- Políticas para Compras
CREATE POLICY "compras_select_proprio" ON public.compras
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "compras_insert_proprio" ON public.compras
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "compras_update_proprio" ON public.compras
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "compras_delete_proprio" ON public.compras
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas para Custos
CREATE POLICY "custos_select_proprio" ON public.custos
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "custos_insert_proprio" ON public.custos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custos_update_proprio" ON public.custos
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custos_delete_proprio" ON public.custos
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
