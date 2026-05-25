-- ============================================================
-- Migration 004 — Desdobra coluna quantidade em quantidade_prevista e quantidade_real
-- Permite acompanhar divergências físicas de quantidades compradas vs. orçadas.
-- ============================================================

-- 1. Renomeia a coluna quantidade existente para quantidade_prevista
ALTER TABLE public.custos 
RENAME COLUMN quantidade TO quantidade_prevista;

-- 2. Adiciona a nova coluna quantidade_real com padrão 1.00
ALTER TABLE public.custos 
ADD COLUMN IF NOT EXISTS quantidade_real NUMERIC(12, 2) NOT NULL DEFAULT 1;

-- 3. Atualiza os dados legados copiando a quantidade orçada para a quantidade real
UPDATE public.custos 
SET quantidade_real = quantidade_prevista;
