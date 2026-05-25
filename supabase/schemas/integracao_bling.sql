-- Tabela para armazenar as credenciais dinâmicas do token de acesso do Bling V3 (OAuth2).
-- Os parâmetros estáticos client_id e client_secret permanecem nas variáveis de ambiente.

CREATE TABLE IF NOT EXISTS public.integracao_bling (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_token  TEXT,
    refresh_token TEXT,
    expires_at    TIMESTAMP WITH TIME ZONE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desativa RLS para permitir que o backend gerencie os tokens livremente
ALTER TABLE public.integracao_bling DISABLE ROW LEVEL SECURITY;
