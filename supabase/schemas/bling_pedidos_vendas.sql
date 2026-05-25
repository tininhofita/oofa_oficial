-- Tabela para armazenar Pedidos de Venda recebidos via webhook do Bling.

CREATE TABLE IF NOT EXISTS bling_pedidos_vendas (
    id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    bling_evento_id       UUID        REFERENCES bling_eventos(id),
    bling_id              BIGINT      NOT NULL,                       -- ID do pedido no Bling
    acao                  VARCHAR(20) NOT NULL,                       -- Ação do evento (ex: 'created', 'updated')
    numero                VARCHAR(50),                                -- Número do pedido no Bling
    numero_loja           VARCHAR(100),                               -- Número do pedido na loja integrada
    data                  DATE,                                       -- Data do pedido
    data_saida            DATE,
    data_prevista         DATE,
    total_produtos        NUMERIC(15,2),
    total                 NUMERIC(15,2),                              -- Valor total do pedido
    situacao_id           INTEGER,                                    -- ID do status/situação
    situacao_valor        VARCHAR(100),                               -- Nome/descrição do status
    contato_id            BIGINT,                                     -- ID do contato/cliente no Bling
    contato_nome          VARCHAR(255),                               -- Nome do cliente
    contato_tipo_pessoa   CHAR(1),                                    -- ex: 'F' (Física) ou 'J' (Jurídica)
    contato_documento     VARCHAR(30),                                -- CPF ou CNPJ
    loja_id               INTEGER,                                    -- ID da loja integrada
    vendedor_id           INTEGER,                                    -- ID do vendedor
    observacoes           TEXT,
    numero_pedido_compra  VARCHAR(100),
    itens                 JSONB,                                      -- Array de itens do pedido
    parcelas              JSONB,                                      -- Array de parcelas/pagamentos
    transporte            JSONB,                                      -- Dados de frete/transporte
    payload_completo      JSONB       NOT NULL,                       -- JSON bruto completo para auditoria
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
