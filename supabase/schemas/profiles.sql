-- ============================================================
-- Schema de referência — tabela profiles
-- Consulte este arquivo antes de qualquer trabalho com usuários.
-- Migration original: supabase/migrations/001_profiles.sql
-- ============================================================

-- Enum
CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'operador');

-- Estrutura
CREATE TABLE profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  role        user_role   NOT NULL DEFAULT 'operador',
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campos:
--   id          → UUID do auth.users (mesmo ID)
--   full_name   → Nome completo, sempre com INITCAP
--   email       → E-mail único (sync com auth.users)
--   role        → 'admin' | 'gerente' | 'operador'
--   is_active   → false = conta desativada (soft delete preferido)
--   avatar_url  → URL pública de avatar (Storage do Supabase)
--   created_at  → Preenchido automaticamente
--   updated_at  → Atualizado por trigger a cada UPDATE

-- RLS ativa — políticas:
--   SELECT próprio: qualquer usuário autenticado
--   SELECT todos:   apenas admin
--   INSERT:         apenas admin
--   UPDATE todos:   apenas admin
--   UPDATE próprio: qualquer usuário (apenas full_name e avatar_url)
--   DELETE:         apenas admin (prefira is_active = false)

-- TypeScript → src/types/index.ts (interface Profile)
-- TypeScript → src/types/supabase.ts (tipos gerados)
-- Permissões → src/constants/permissions.ts
