-- Tabela para log de todos os eventos brutos recebidos via webhook do Bling.
-- Armazena o payload completo para auditoria, reprocessamento e rastreabilidade.

-- Criação do tipo ENUM se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_evento_bling') THEN
        CREATE TYPE status_evento_bling AS ENUM ('recebido', 'processado', 'erro');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS bling_eventos (
    id            UUID                DEFAULT gen_random_uuid() PRIMARY KEY,
    recurso       VARCHAR(30)         NOT NULL, -- ex: 'stock', 'order', 'invoice', 'consumer_invoice'
    acao          VARCHAR(20)         NOT NULL, -- ex: 'created', 'updated', 'deleted', 'issued'
    event_id      VARCHAR(100),                 -- ID do evento enviado pelo Bling
    bling_id      BIGINT,                       -- ID do recurso correspondente no Bling
    payload       JSONB               NOT NULL, -- JSON bruto do evento
    status        status_evento_bling NOT NULL DEFAULT 'recebido',
    erro_mensagem TEXT,                         -- Mensagem de erro caso ocorra falha no processamento
    created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);
