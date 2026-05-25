-- Estrutura de Notas Fiscais Eletrônicas (NFe e NFC-e) unificada para o ERP Oofa.
-- Suporta atualizações em tempo real via Webhook e importações históricas via API do Bling.

CREATE TABLE IF NOT EXISTS public.nfe (
    id                           BIGINT NOT NULL,                    -- ID único da NFe no Bling (Primary Key)
    bling_evento_id              UUID REFERENCES public.bling_eventos(id) ON DELETE SET NULL, -- FK opcional para log do webhook
    tipo                         SMALLINT,                           -- ex: 0 (Entrada) ou 1 (Saída)
    situacao                     SMALLINT,                           -- ex: 1 (Pendente), 2 (Emitida/Autorizada), 3 (Cancelada), etc.
    numero                       VARCHAR(20),
    serie                        SMALLINT,
    data_emissao                 TIMESTAMP WITHOUT TIME ZONE,
    data_operacao                TIMESTAMP WITHOUT TIME ZONE,
    chave_acesso                 TEXT,
    valor_nota                   NUMERIC(15, 4),
    valor_frete                  NUMERIC(15, 4),
    valor_desconto               NUMERIC(15, 4),
    finalidade                   SMALLINT,
    tipo_nota                    VARCHAR(5),                         -- ex: 'NFe' ou 'NFCe'
    xml                          TEXT,
    link_danfe                   TEXT,
    link_pdf                     TEXT,
    optante_simples_nacional     BOOLEAN DEFAULT FALSE,
    numero_pedido_loja           TEXT,
    contato_id                   BIGINT,                             -- ID do contato no Bling
    natureza_operacao_id         BIGINT,
    canal_venda_id               BIGINT,
    vendedor_id                  BIGINT,
    frete_por_conta              SMALLINT,
    transportador_nome           TEXT,
    transportador_documento      TEXT,
    etiqueta_nome                TEXT,
    etiqueta_endereco            TEXT,
    etiqueta_numero              TEXT,
    etiqueta_complemento         TEXT,
    etiqueta_municipio           TEXT,
    etiqueta_uf                  CHARACTER(2),
    etiqueta_cep                 TEXT,
    etiqueta_bairro              TEXT,
    criado_em                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT nfe_pkey PRIMARY KEY (id)
);

-- Índices de performance na tabela principal de NFe
CREATE INDEX IF NOT EXISTS idx_nfe_situacao ON public.nfe USING btree (situacao);
CREATE INDEX IF NOT EXISTS idx_nfe_data_emissao ON public.nfe USING btree (data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfe_contato ON public.nfe USING btree (contato_id);

-- Tabela para os Itens da Nota Fiscal
CREATE TABLE IF NOT EXISTS public.nfe_itens (
    id                           BIGSERIAL PRIMARY KEY,
    nfe_id                       BIGINT NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
    codigo                       TEXT,
    descricao                    TEXT,
    unidade                      VARCHAR(10),
    quantidade                   NUMERIC(15, 4),
    valor                        NUMERIC(15, 4),
    valor_total                  NUMERIC(15, 4),
    tipo                         CHARACTER(1),
    peso_bruto                   NUMERIC(15, 4),
    peso_liquido                 NUMERIC(15, 4),
    numero_pedido_compra         TEXT,
    classificacao_fiscal         TEXT,
    cest                         TEXT,
    codigo_servico               TEXT,
    origem                       SMALLINT,
    informacoes_adicionais       TEXT,
    gtin                         VARCHAR(20),
    cfop                         VARCHAR(10),
    valor_aprox_total_tributos   NUMERIC(15, 4),
    icms_st                      SMALLINT,
    icms_origem                  SMALLINT,
    icms_modalidade              SMALLINT,
    icms_aliquota                NUMERIC(10, 4),
    icms_valor                   NUMERIC(15, 4)
);

CREATE INDEX IF NOT EXISTS idx_nfe_itens_nfe ON public.nfe_itens USING btree (nfe_id);

-- Tabela para as Parcelas da Nota Fiscal
CREATE TABLE IF NOT EXISTS public.nfe_parcelas (
    id                           BIGSERIAL PRIMARY KEY,
    nfe_id                       BIGINT NOT NULL REFERENCES public.nfe(id) ON DELETE CASCADE,
    data                         DATE,
    valor                        NUMERIC(15, 4),
    observacoes                  TEXT,
    caut                         TEXT,
    forma_pagamento_id           BIGINT
);

CREATE INDEX IF NOT EXISTS idx_nfe_parcelas_nfe ON public.nfe_parcelas USING btree (nfe_id);

-- Criação dinâmica de Constraints de Chave Estrangeira se as tabelas relacionadas existirem
DO $$
BEGIN
    -- Relacionamento com contatos
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contatos') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nfe_contato_id_fkey') THEN
            ALTER TABLE public.nfe 
            ADD CONSTRAINT nfe_contato_id_fkey FOREIGN KEY (contato_id) REFERENCES public.contatos(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Relacionamento com canais_venda
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'canais_venda') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nfe_canal_venda_id_fkey') THEN
            ALTER TABLE public.nfe 
            ADD CONSTRAINT nfe_canal_venda_id_fkey FOREIGN KEY (canal_venda_id) REFERENCES public.canais_venda(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Relacionamento com naturezas_operacao
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'naturezas_operacao') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nfe_natureza_operacao_id_fkey') THEN
            ALTER TABLE public.nfe 
            ADD CONSTRAINT nfe_natureza_operacao_id_fkey FOREIGN KEY (natureza_operacao_id) REFERENCES public.naturezas_operacao(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Desativa o RLS para que a API interna e o webhook consigam ler e gravar livremente nas tabelas
ALTER TABLE public.nfe DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_itens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_parcelas DISABLE ROW LEVEL SECURITY;
