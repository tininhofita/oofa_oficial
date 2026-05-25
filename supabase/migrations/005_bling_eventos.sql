CREATE TYPE status_evento_bling AS ENUM ('recebido', 'processado', 'erro');

CREATE TABLE IF NOT EXISTS bling_eventos (
  id            UUID                DEFAULT gen_random_uuid() PRIMARY KEY,
  recurso       VARCHAR(30)         NOT NULL,
  acao          VARCHAR(20)         NOT NULL,
  event_id      VARCHAR(100),
  bling_id      BIGINT,
  payload       JSONB               NOT NULL,
  status        status_evento_bling NOT NULL DEFAULT 'recebido',
  erro_mensagem TEXT,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bling_eventos_recurso    ON bling_eventos (recurso);
CREATE INDEX idx_bling_eventos_status     ON bling_eventos (status);
CREATE INDEX idx_bling_eventos_created_at ON bling_eventos (created_at DESC);
CREATE INDEX idx_bling_eventos_bling_id   ON bling_eventos (bling_id)
  WHERE bling_id IS NOT NULL;

ALTER TABLE bling_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_gerente_ver_bling_eventos"
  ON bling_eventos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'gerente')
        AND profiles.is_active = true
    )
  );
