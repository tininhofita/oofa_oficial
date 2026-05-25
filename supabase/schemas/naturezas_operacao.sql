-- Tabela para armazenar as Naturezas de Operacao importadas do Bling.
-- Permite mapear e nomear de forma customizada como cada natureza se chama no ERP Oofa.

CREATE TABLE IF NOT EXISTS public.naturezas_operacao (
    id                BIGINT PRIMARY KEY,                      -- ID da natureza de operacao no Bling
    descricao         TEXT NOT NULL,                           -- Descricao oficial no Bling
    nome_customizado  TEXT,                                    -- Nome amigavel em nosso ERP
    situacao          SMALLINT,                                -- ex: 1 (Ativa), 0 (Inativa)
    padrao            BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Desativa o RLS para que o backend consiga ler e gravar livremente as naturezas
ALTER TABLE public.naturezas_operacao DISABLE ROW LEVEL SECURITY;
