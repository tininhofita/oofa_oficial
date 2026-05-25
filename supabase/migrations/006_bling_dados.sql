-- ============================================================
-- bling_estoques
-- ============================================================
CREATE TABLE IF NOT EXISTS bling_estoques (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bling_evento_id     UUID        REFERENCES bling_eventos(id) ON DELETE SET NULL,
  produto_id          BIGINT      NOT NULL,
  saldo_fisico_total  NUMERIC(15,4),
  saldo_virtual_total NUMERIC(15,4),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bling_estoques_produto_id  ON bling_estoques (produto_id);
CREATE INDEX idx_bling_estoques_created_at  ON bling_estoques (created_at DESC);

ALTER TABLE bling_estoques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerente_ver_bling_estoques"
  ON bling_estoques FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'gerente')
        AND profiles.is_active = true
    )
  );

-- ============================================================
-- bling_pedidos_vendas
-- ============================================================
CREATE TABLE IF NOT EXISTS bling_pedidos_vendas (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bling_evento_id      UUID        REFERENCES bling_eventos(id) ON DELETE SET NULL,
  bling_id             BIGINT      NOT NULL,
  acao                 VARCHAR(20) NOT NULL,
  numero               VARCHAR(50),
  numero_loja          VARCHAR(100),
  data                 DATE,
  data_saida           DATE,
  data_prevista        DATE,
  total_produtos       NUMERIC(15,2),
  total                NUMERIC(15,2),
  situacao_id          INTEGER,
  situacao_valor       VARCHAR(100),
  contato_id           BIGINT,
  contato_nome         VARCHAR(255),
  contato_tipo_pessoa  CHAR(1),
  contato_documento    VARCHAR(30),
  loja_id              INTEGER,
  vendedor_id          INTEGER,
  observacoes          TEXT,
  numero_pedido_compra VARCHAR(100),
  itens                JSONB,
  parcelas             JSONB,
  transporte           JSONB,
  payload_completo     JSONB       NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bling_pedidos_bling_id   ON bling_pedidos_vendas (bling_id);
CREATE INDEX idx_bling_pedidos_contato_id ON bling_pedidos_vendas (contato_id)
  WHERE contato_id IS NOT NULL;
CREATE INDEX idx_bling_pedidos_data       ON bling_pedidos_vendas (data DESC)
  WHERE data IS NOT NULL;
CREATE INDEX idx_bling_pedidos_created_at ON bling_pedidos_vendas (created_at DESC);

ALTER TABLE bling_pedidos_vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerente_ver_bling_pedidos"
  ON bling_pedidos_vendas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'gerente')
        AND profiles.is_active = true
    )
  );

-- ============================================================
-- bling_notas_fiscais
-- ============================================================
CREATE TABLE IF NOT EXISTS bling_notas_fiscais (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bling_evento_id   UUID        REFERENCES bling_eventos(id) ON DELETE SET NULL,
  bling_id          BIGINT      NOT NULL,
  acao              VARCHAR(20) NOT NULL,
  tipo              CHAR(1),
  situacao          VARCHAR(5),
  numero            VARCHAR(20),
  serie             INTEGER,
  data_emissao      DATE,
  data_operacao     DATE,
  contato_id        BIGINT,
  contato_nome      VARCHAR(255),
  contato_documento VARCHAR(30),
  loja_id           INTEGER,
  chave_acesso      VARCHAR(50),
  link_danfe        TEXT,
  link_pdf          TEXT,
  payload_completo  JSONB       NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bling_nfe_bling_id    ON bling_notas_fiscais (bling_id);
CREATE INDEX idx_bling_nfe_created_at  ON bling_notas_fiscais (created_at DESC);

ALTER TABLE bling_notas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerente_ver_bling_nfe"
  ON bling_notas_fiscais FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'gerente')
        AND profiles.is_active = true
    )
  );

-- ============================================================
-- bling_notas_fiscais_consumidor
-- ============================================================
CREATE TABLE IF NOT EXISTS bling_notas_fiscais_consumidor (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bling_evento_id   UUID        REFERENCES bling_eventos(id) ON DELETE SET NULL,
  bling_id          BIGINT      NOT NULL,
  acao              VARCHAR(20) NOT NULL,
  tipo              CHAR(1),
  situacao          VARCHAR(5),
  numero            VARCHAR(20),
  serie             INTEGER,
  valor_nota        NUMERIC(15,2),
  data_emissao      DATE,
  data_operacao     DATE,
  contato_id        BIGINT,
  contato_nome      VARCHAR(255),
  contato_documento VARCHAR(30),
  loja_id           INTEGER,
  chave_acesso      VARCHAR(50),
  link_danfe        TEXT,
  link_pdf          TEXT,
  payload_completo  JSONB       NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bling_nfce_bling_id   ON bling_notas_fiscais_consumidor (bling_id);
CREATE INDEX idx_bling_nfce_created_at ON bling_notas_fiscais_consumidor (created_at DESC);

ALTER TABLE bling_notas_fiscais_consumidor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerente_ver_bling_nfce"
  ON bling_notas_fiscais_consumidor FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'gerente')
        AND profiles.is_active = true
    )
  );
