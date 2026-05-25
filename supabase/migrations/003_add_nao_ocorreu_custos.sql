-- ============================================================
-- Migration 003 — Adiciona coluna nao_ocorreu à tabela public.custos
-- Permite que custos planejados que não aconteceram ou foram cancelados
-- sejam marcados de forma diferenciada, sem poluir a lista como "Pendente".
-- ============================================================

ALTER TABLE public.custos 
ADD COLUMN IF NOT EXISTS nao_ocorreu BOOLEAN NOT NULL DEFAULT FALSE;
