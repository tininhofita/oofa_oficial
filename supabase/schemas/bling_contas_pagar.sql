-- Estrutura de Contas a Pagar do Bling ERP unificada para o ERP Oofa.
-- Suporta atualizações em tempo real via Webhook e importações históricas via API do Bling.

CREATE TABLE IF NOT EXISTS public.bling_contas_pagar (
    id                           BIGINT NOT NULL,                    -- ID único da Conta a Pagar no Bling (Primary Key)
    bling_evento_id              UUID REFERENCES public.bling_eventos(id) ON DELETE SET NULL, -- FK opcional para log do webhook
    situacao                     SMALLINT,                           -- 1 (Em aberto), 2 (Pago), 3 (Parcialmente pago), 4 (Devolvido), 5 (Cancelado)
    vencimento                   DATE,
    valor                        NUMERIC(15, 4),
    contato_id                   BIGINT,                             -- ID do contato no Bling
    forma_pagamento_id           BIGINT,                             -- ID da forma de pagamento no Bling
    saldo                        NUMERIC(15, 4),
    data_emissao                 DATE,
    vencimento_original          DATE,
    numero_documento             VARCHAR(100),
    competencia                  DATE,
    historico                    TEXT,
    numero_banco                 VARCHAR(100),
    portador_id                  BIGINT,
    categoria_id                 BIGINT,
    ocorrencia_tipo              SMALLINT,
    criado_em                    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    atualizado_em                TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT bling_contas_pagar_pkey PRIMARY KEY (id)
);

-- Índices de performance para relatórios financeiros e buscas
CREATE INDEX IF NOT EXISTS idx_bling_contas_pagar_situacao ON public.bling_contas_pagar USING btree (situacao);
CREATE INDEX IF NOT EXISTS idx_bling_contas_pagar_vencimento ON public.bling_contas_pagar USING btree (vencimento);
CREATE INDEX IF NOT EXISTS idx_bling_contas_pagar_contato ON public.bling_contas_pagar USING btree (contato_id);
CREATE INDEX IF NOT EXISTS idx_bling_contas_pagar_data_emissao ON public.bling_contas_pagar USING btree (data_emissao);

-- Criação dinâmica de Constraints de Chave Estrangeira se a tabela contatos existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contatos') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bling_contas_pagar_contato_id_fkey') THEN
            ALTER TABLE public.bling_contas_pagar 
            ADD CONSTRAINT bling_contas_pagar_contato_id_fkey FOREIGN KEY (contato_id) REFERENCES public.contatos(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- Desativa o RLS para que a API interna e o webhook consigam ler e gravar livremente na tabela
ALTER TABLE public.bling_contas_pagar DISABLE ROW LEVEL SECURITY;
