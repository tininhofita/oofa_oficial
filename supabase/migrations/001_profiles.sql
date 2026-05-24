-- ============================================================
-- Migration 001 — Tabela de perfis de usuários
-- Estende o auth.users do Supabase com dados adicionais.
--
-- Para aplicar: cole no SQL Editor do Supabase Studio
-- ou use: supabase db push
-- ============================================================

-- ----------------------------------------------------------
-- 1. Enum de roles (perfis de acesso)
-- ----------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'gerente', 'operador');

-- ----------------------------------------------------------
-- 2. Tabela principal de perfis
-- ----------------------------------------------------------
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

-- ----------------------------------------------------------
-- 3. Índices para performance
-- ----------------------------------------------------------
CREATE INDEX idx_profiles_role      ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_email     ON profiles(email);

-- ----------------------------------------------------------
-- 4. RLS — Row Level Security (obrigatório por política do projeto)
-- ----------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuário vê seu próprio perfil
CREATE POLICY "perfis_select_proprio"
  ON profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admin vê todos os perfis
CREATE POLICY "perfis_select_admin"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin cria novos perfis
CREATE POLICY "perfis_insert_admin"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin atualiza qualquer perfil
CREATE POLICY "perfis_update_admin"
  ON profiles FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Usuário atualiza apenas seu próprio perfil (nome e avatar)
CREATE POLICY "perfis_update_proprio"
  ON profiles FOR UPDATE TO authenticated
  USING   (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin pode deletar (prefira is_active = false para soft delete)
CREATE POLICY "perfis_delete_admin"
  ON profiles FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ----------------------------------------------------------
-- 5. Trigger: atualiza updated_at automaticamente
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ----------------------------------------------------------
-- 6. Trigger: cria perfil automaticamente ao registrar usuário
--    A primeira letra do nome é capitalizada (regra do projeto).
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    INITCAP(COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')),
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'operador'
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
