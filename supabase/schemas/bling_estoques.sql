-- Tabela para registrar saldos de estoque (snapshots) recebidos via webhook do Bling.

CREATE TABLE IF NOT EXISTS bling_estoques (
    id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    bling_evento_id      UUID        REFERENCES bling_eventos(id),
    produto_id           BIGINT      NOT NULL,                       -- ID do produto no Bling
    saldo_fisico_total   NUMERIC(15,4),                              -- Saldo físico atual
    saldo_virtual_total  NUMERIC(15,4),                              -- Saldo virtual atual (considerando pedidos)
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
