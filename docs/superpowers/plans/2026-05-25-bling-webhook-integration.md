# Bling Webhook Integration — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a integração de webhooks do Bling no ERP Oofa, recebendo e persistindo eventos de estoque, pedidos de vendas, NFe e NFC-e em tabelas dedicadas, e exibindo uma página de configuração e monitoramento em `/integracoes/bling`.

**Architecture:** O Bling envia eventos via HTTP POST para `/api/bling/webhook`; o handler valida o token via header `Authorization: Bearer <secret>`, salva o evento bruto em `bling_eventos` e extrai os dados estruturados para a tabela específica do recurso (`bling_estoques`, `bling_pedidos_vendas`, `bling_notas_fiscais`, `bling_notas_fiscais_consumidor`). A página `/integracoes/bling` é um Server Component que exibe a URL do webhook, status das credenciais e o log de eventos.

**Tech Stack:** Next.js 15 App Router · TypeScript · Supabase (PostgreSQL + RLS) · CSS próprio (BEM/PT-BR)

---

## Estrutura Real do Webhook Bling V3

```
POST /api/bling/webhook
Authorization: Bearer <BLING_WEBHOOK_SECRET>
Content-Type: application/json
```

**Envelope (todos os eventos):**
```json
{
  "eventId": "abc-123",
  "date": "2026-05-25T10:00:00Z",
  "version": 1,
  "event": "stock.updated",
  "companyId": 12345,
  "data": { }
}
```

O campo `event` é uma string no formato `recurso.acao`:

| `event` (string)            | Recurso                   | Tabela de destino                    |
|-----------------------------|---------------------------|--------------------------------------|
| `stock.*`                   | Estoque físico            | `bling_estoques`                     |
| `order.*`                   | Pedido de venda           | `bling_pedidos_vendas`               |
| `invoice.*`                 | Nota Fiscal Eletrônica    | `bling_notas_fiscais`                |
| `consumer_invoice.*`        | NFC-e                     | `bling_notas_fiscais_consumidor`     |

**Payload de estoque (`stock.*`):**
```json
{
  "data": {
    "produto": { "id": 123456 },
    "saldoFisicoTotal": 42,
    "saldoVirtualTotal": 38
  }
}
```

**Payload de pedido de venda (`order.*`):**
```json
{
  "data": {
    "id": 999, "numero": "12345", "numeroLoja": "LOJA-001",
    "data": "2026-05-25", "dataSaida": "2026-05-26", "dataPrevista": "2026-05-27",
    "totalProdutos": 1400.00, "total": 1500.00,
    "situacao": { "id": 9, "valor": "Em aberto" },
    "contato": { "id": 1, "nome": "João Silva", "tipoPessoa": "F", "numeroDocumento": "123.456.789-00" },
    "loja": { "id": 1 }, "vendedor": { "id": 2 },
    "observacoes": "...", "numeroPedidoCompra": "PO-001",
    "itens": [ { "id": 1, "codigo": "PROD-01", "descricao": "Produto X", "quantidade": 2, "valor": 700.00, "unidade": "UN", "desconto": 0, "aliquotaIPI": 0, "produto": { "id": 456 } } ],
    "parcelas": [ { "id": 1, "dataVencimento": "2026-06-25", "valor": 1500.00, "formaPagamento": { "id": 1 } } ],
    "transporte": { "fretePorConta": 0, "frete": 50.00, "etiqueta": { "endereco": "Rua X", "municipio": "SP", "uf": "SP", "cep": "01000-000" } }
  }
}
```

**Payload de NFe (`invoice.*`):**
```json
{
  "data": {
    "id": 777, "tipo": "S", "situacao": "A",
    "numero": "000042", "serie": 1,
    "dataEmissao": "2026-05-25", "dataOperacao": "2026-05-25",
    "chaveAcesso": "35260512345678...",
    "linkDanfe": "https://...", "linkPDF": "https://...",
    "contato": { "id": 1, "nome": "João Silva", "numeroDocumento": "123.456.789-00" },
    "loja": { "id": 1 }
  }
}
```

**Payload de NFC-e (`consumer_invoice.*`):**
```json
{
  "data": {
    "id": 888, "tipo": "S", "situacao": "A",
    "numero": "000001", "serie": 1, "valorNota": 350.00,
    "dataEmissao": "2026-05-25",
    "chaveAcesso": "35260512345678...",
    "linkDanfe": "https://...", "linkPDF": "https://...",
    "contato": { "id": 1, "nome": "João Silva", "numeroDocumento": "123.456.789-00" },
    "loja": { "id": 1 }
  }
}
```

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|------|---------|-----------------|
| Criar | `src/components/ui/Badge/Badge.tsx` | Componente de status (sucesso, erro, aviso, inativo) |
| Criar | `src/components/ui/Badge/Badge.css` | Estilos do Badge |
| Criar | `src/components/ui/Badge/index.ts` | Re-export do Badge |
| Criar | `src/components/layout/PageContainer/PageContainer.tsx` | Wrapper de página com padding e título |
| Criar | `src/components/layout/PageContainer/PageContainer.css` | Estilos do PageContainer |
| Criar | `src/components/layout/PageContainer/index.ts` | Re-export do PageContainer |
| Criar | `src/lib/bling/types.ts` | Tipos TypeScript para envelope e dados de cada evento |
| Criar | `src/lib/bling/webhook.ts` | Verificação de token e parse do envelope |
| Criar | `src/lib/bling/processadores.ts` | Extração e persistência dos dados por tipo de recurso |
| Criar | `supabase/schemas/bling_eventos.sql` | Documentação da tabela de log de eventos |
| Criar | `supabase/schemas/bling_estoques.sql` | Documentação da tabela de estoques |
| Criar | `supabase/schemas/bling_pedidos_vendas.sql` | Documentação da tabela de pedidos de vendas |
| Criar | `supabase/schemas/bling_notas_fiscais.sql` | Documentação da tabela de NFe |
| Criar | `supabase/schemas/bling_notas_fiscais_consumidor.sql` | Documentação da tabela de NFC-e |
| Criar | `supabase/migrations/005_bling_eventos.sql` | Migração: tabela de log de eventos |
| Criar | `supabase/migrations/006_bling_dados.sql` | Migração: 4 tabelas de dados estruturados |
| Modificar | `src/types/supabase.ts` | Adicionar tipos das 5 tabelas novas |
| Modificar | `src/lib/env.ts` | Adicionar `NEXT_PUBLIC_APP_URL` |
| Modificar | `.env.example` | Documentar variáveis do Bling e APP_URL |
| Modificar | `src/app/api/bling/webhook/route.ts` | Handler real (substitui stub) |
| Criar | `src/app/(app)/integracoes/bling/BlingUrlCopiar.tsx` | Client Component para copiar URL |
| Modificar | `src/app/(app)/integracoes/bling/page.tsx` | Página real (substitui placeholder) |
| Criar | `src/app/(app)/integracoes/bling/integracoes-bling.css` | Estilos da página |

---

## Task 1: Componente Badge

**Files:**
- Create: `src/components/ui/Badge/Badge.tsx`
- Create: `src/components/ui/Badge/Badge.css`
- Create: `src/components/ui/Badge/index.ts`

- [ ] **Step 1: Criar `src/components/ui/Badge/Badge.tsx`**

```tsx
import './Badge.css'

type BadgeVariante = 'sucesso' | 'erro' | 'aviso' | 'inativo' | 'info'

interface BadgeProps {
  variante?: BadgeVariante
  children: React.ReactNode
}

export function Badge({ variante = 'inativo', children }: BadgeProps) {
  return (
    <span className={`badge badge--${variante}`}>
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Criar `src/components/ui/Badge/Badge.css`**

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: var(--fs-text-xs);
  font-weight: var(--fw-medium);
  line-height: var(--lh-tight);
  white-space: nowrap;
}

.badge--sucesso {
  background: var(--color-success-light);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}

.badge--erro {
  background: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid var(--color-danger-border);
}

.badge--aviso {
  background: var(--color-warning-light);
  color: var(--color-warning);
  border: 1px solid var(--color-warning-border);
}

.badge--inativo {
  background: var(--color-gray-100);
  color: var(--color-gray-600);
  border: 1px solid var(--color-gray-200);
}

.badge--info {
  background: var(--color-info-light);
  color: var(--color-info);
  border: 1px solid var(--color-info-border);
}
```

- [ ] **Step 3: Criar `src/components/ui/Badge/index.ts`**

```typescript
export { Badge } from './Badge'
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Badge/
git commit -m "feat(ui): implementar componente Badge com variantes de status"
```

---

## Task 2: Componente PageContainer

**Files:**
- Create: `src/components/layout/PageContainer/PageContainer.tsx`
- Create: `src/components/layout/PageContainer/PageContainer.css`
- Create: `src/components/layout/PageContainer/index.ts`

- [ ] **Step 1: Criar `src/components/layout/PageContainer/PageContainer.tsx`**

```tsx
import './PageContainer.css'

interface PageContainerProps {
  titulo: string
  children: React.ReactNode
}

export function PageContainer({ titulo, children }: PageContainerProps) {
  return (
    <div className="page-container">
      <header className="page-container__cabecalho">
        <h1 className="page-container__titulo">{titulo}</h1>
      </header>
      <main className="page-container__conteudo">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Criar `src/components/layout/PageContainer/PageContainer.css`**

```css
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-8);
  max-width: var(--content-max-width);
  width: 100%;
}

.page-container__cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-container__titulo {
  font-size: var(--fs-title-sm);
  font-weight: var(--fw-bold);
  color: var(--color-text-primary);
  margin: 0;
}

.page-container__conteudo {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
```

- [ ] **Step 3: Criar `src/components/layout/PageContainer/index.ts`**

```typescript
export { PageContainer } from './PageContainer'
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/PageContainer/
git commit -m "feat(layout): implementar componente PageContainer com título de página"
```

---

## Task 3: Tipos TypeScript do Bling V3

**Files:**
- Create: `src/lib/bling/types.ts`

- [ ] **Step 1: Criar `src/lib/bling/types.ts`**

```typescript
// Envelope padrão de todos os webhooks Bling V3
// O campo `event` segue o formato "recurso.acao", ex: "stock.updated", "order.created"
export interface BlingWebhookEnvelope {
  eventId: string
  date: string
  version: number
  event: string        // "stock.updated" | "order.created" | "invoice.issued" | etc.
  companyId: number
  data: Record<string, unknown>
}

// Prefixos de recursos reconhecidos (parte antes do ".")
export const RECURSOS_BLING_VALIDOS = ['stock', 'order', 'invoice', 'consumer_invoice'] as const
export type RecursoBling = typeof RECURSOS_BLING_VALIDOS[number]

// Extrai o prefixo do recurso de uma string de evento
// "stock.updated" → "stock"
export function extrairRecurso(event: string): RecursoBling | null {
  const prefixo = event.split('.')[0]
  if (RECURSOS_BLING_VALIDOS.includes(prefixo as RecursoBling)) {
    return prefixo as RecursoBling
  }
  return null
}

// Mapeamento de recurso → label legível
export const MAPEAMENTO_RECURSO_BLING: Record<RecursoBling, string> = {
  stock: 'Estoque',
  order: 'Pedido de Venda',
  invoice: 'Nota Fiscal Eletrônica',
  consumer_invoice: 'NFC-e',
}

// --- Tipos de dados por recurso ---

export interface BlingEstoqueDados {
  produto: { id: number }
  saldoFisicoTotal: number
  saldoVirtualTotal: number
}

export interface BlingPedidoVendaDados {
  id: number
  numero?: string
  numeroLoja?: string
  data?: string
  dataSaida?: string
  dataPrevista?: string
  totalProdutos?: number
  total?: number
  situacao?: { id: number; valor: string }
  contato?: { id: number; nome: string; tipoPessoa?: string; numeroDocumento?: string }
  loja?: { id: number }
  vendedor?: { id: number }
  observacoes?: string
  numeroPedidoCompra?: string
  itens?: unknown[]
  parcelas?: unknown[]
  transporte?: unknown
}

export interface BlingNotaFiscalDados {
  id: number
  tipo?: string        // "E" (entrada) | "S" (saída)
  situacao?: string    // "A" (autorizada), "C" (cancelada), etc.
  numero?: string
  serie?: number
  dataEmissao?: string
  dataOperacao?: string
  chaveAcesso?: string
  linkDanfe?: string
  linkPDF?: string
  contato?: { id?: number; nome: string; numeroDocumento: string }
  loja?: { id: number }
}

export interface BlingNotaFiscalConsumidorDados {
  id: number
  tipo?: string
  situacao?: string
  numero?: string
  serie?: number
  valorNota?: number
  dataEmissao?: string
  dataOperacao?: string
  chaveAcesso?: string
  linkDanfe?: string
  linkPDF?: string
  contato?: { id?: number; nome: string; numeroDocumento?: string }
  loja?: { id: number }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/bling/types.ts
git commit -m "feat(bling): definir tipos TypeScript para envelope e dados de webhook V3"
```

---

## Task 4: Verificação de token e parse do envelope

**Files:**
- Create: `src/lib/bling/webhook.ts`

- [ ] **Step 1: Criar `src/lib/bling/webhook.ts`**

```typescript
import { env } from '@/lib/env'
import { extrairRecurso } from './types'
import type { BlingWebhookEnvelope, RecursoBling } from './types'

export function verificarTokenWebhook(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) return false

  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim()

  const secret = env.BLING_WEBHOOK_SECRET
  if (!secret) return false

  return token === secret
}

export interface EnvelopeParsed {
  envelope: BlingWebhookEnvelope
  recurso: RecursoBling
  acao: string   // "updated" | "created" | "deleted" | "issued"
}

export function parsearEnvelopeBling(body: unknown): EnvelopeParsed | null {
  if (typeof body !== 'object' || body === null) return null

  const b = body as Record<string, unknown>

  if (typeof b.event !== 'string' || typeof b.data !== 'object' || b.data === null) {
    return null
  }

  const recurso = extrairRecurso(b.event)
  if (!recurso) return null

  const partes = b.event.split('.')
  const acao = partes[1] ?? 'unknown'

  const envelope: BlingWebhookEnvelope = {
    eventId: typeof b.eventId === 'string' ? b.eventId : '',
    date: typeof b.date === 'string' ? b.date : new Date().toISOString(),
    version: typeof b.version === 'number' ? b.version : 1,
    event: b.event,
    companyId: typeof b.companyId === 'number' ? b.companyId : 0,
    data: b.data as Record<string, unknown>,
  }

  return { envelope, recurso, acao }
}
```

- [ ] **Step 2: Verificar type-check**

```bash
npm run type-check
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/lib/bling/webhook.ts
git commit -m "feat(bling): implementar verificação de token e parse do envelope V3"
```

---

## Task 5: Schemas de documentação — todas as tabelas

**Files:**
- Create: `supabase/schemas/bling_eventos.sql`
- Create: `supabase/schemas/bling_estoques.sql`
- Create: `supabase/schemas/bling_pedidos_vendas.sql`
- Create: `supabase/schemas/bling_notas_fiscais.sql`
- Create: `supabase/schemas/bling_notas_fiscais_consumidor.sql`

- [ ] **Step 1: Criar `supabase/schemas/bling_eventos.sql`**

```sql
-- Tabela: bling_eventos
-- Log de todos os eventos brutos recebidos via webhook do Bling.
-- Payload completo preservado para auditoria e reprocessamento.
--
-- Colunas principais:
--   recurso   → "stock" | "order" | "invoice" | "consumer_invoice"
--   acao      → "created" | "updated" | "deleted" | "issued"
--   event_id  → eventId do Bling (identificador único do evento)
--   bling_id  → ID da entidade no Bling (extraído de data.id ou data.produto.id)
--   status    → recebido | processado | erro
--
-- RLS: SELECT para admin e gerente; INSERT pelo service_role (bypass automático)
--
-- CREATE TABLE bling_eventos (
--   id            UUID                DEFAULT gen_random_uuid() PRIMARY KEY,
--   recurso       VARCHAR(30)         NOT NULL,
--   acao          VARCHAR(20)         NOT NULL,
--   event_id      VARCHAR(100),
--   bling_id      BIGINT,
--   payload       JSONB               NOT NULL,
--   status        status_evento_bling NOT NULL DEFAULT 'recebido',
--   erro_mensagem TEXT,
--   created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
-- );
```

- [ ] **Step 2: Criar `supabase/schemas/bling_estoques.sql`**

```sql
-- Tabela: bling_estoques
-- Saldos de estoque recebidos via webhook do Bling (stock.*).
-- Cada linha é um snapshot do saldo no momento do evento.
--
-- Colunas:
--   bling_evento_id → FK para bling_eventos (rastreabilidade)
--   produto_id      → ID do produto no Bling (data.produto.id)
--   saldo_fisico_total   → data.saldoFisicoTotal
--   saldo_virtual_total  → data.saldoVirtualTotal
--
-- RLS: SELECT para admin e gerente; INSERT pelo service_role
--
-- CREATE TABLE bling_estoques (
--   id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
--   bling_evento_id      UUID        REFERENCES bling_eventos(id),
--   produto_id           BIGINT      NOT NULL,
--   saldo_fisico_total   NUMERIC(15,4),
--   saldo_virtual_total  NUMERIC(15,4),
--   created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
```

- [ ] **Step 3: Criar `supabase/schemas/bling_pedidos_vendas.sql`**

```sql
-- Tabela: bling_pedidos_vendas
-- Pedidos de venda recebidos via webhook do Bling (order.*).
--
-- Campos estruturados extraídos do payload:
--   bling_id, numero, numero_loja, data, data_saida, data_prevista
--   total_produtos, total
--   situacao_id, situacao_valor
--   contato_id, contato_nome, contato_tipo_pessoa, contato_documento
--   loja_id, vendedor_id, observacoes, numero_pedido_compra
--
-- Campos JSONB (arrays variáveis):
--   itens, parcelas, transporte
--
-- payload_completo: JSON bruto completo para casos não mapeados
--
-- RLS: SELECT para admin e gerente; INSERT pelo service_role
--
-- CREATE TABLE bling_pedidos_vendas (
--   id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
--   bling_evento_id       UUID        REFERENCES bling_eventos(id),
--   bling_id              BIGINT      NOT NULL,
--   acao                  VARCHAR(20) NOT NULL,  -- "created" | "updated"
--   numero                VARCHAR(50),
--   numero_loja           VARCHAR(100),
--   data                  DATE,
--   data_saida            DATE,
--   data_prevista         DATE,
--   total_produtos        NUMERIC(15,2),
--   total                 NUMERIC(15,2),
--   situacao_id           INTEGER,
--   situacao_valor        VARCHAR(100),
--   contato_id            BIGINT,
--   contato_nome          VARCHAR(255),
--   contato_tipo_pessoa   CHAR(1),
--   contato_documento     VARCHAR(30),
--   loja_id               INTEGER,
--   vendedor_id           INTEGER,
--   observacoes           TEXT,
--   numero_pedido_compra  VARCHAR(100),
--   itens                 JSONB,
--   parcelas              JSONB,
--   transporte            JSONB,
--   payload_completo      JSONB       NOT NULL,
--   created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
```

- [ ] **Step 4: Criar `supabase/schemas/bling_notas_fiscais.sql`**

```sql
-- Tabela: bling_notas_fiscais
-- Notas Fiscais Eletrônicas (NFe) recebidas via webhook do Bling (invoice.*).
--
-- Colunas:
--   tipo      → "E" (entrada) | "S" (saída)
--   situacao  → "A" (autorizada), "C" (cancelada), "D" (denegada), etc.
--
-- RLS: SELECT para admin e gerente; INSERT pelo service_role
--
-- CREATE TABLE bling_notas_fiscais (
--   id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
--   bling_evento_id      UUID        REFERENCES bling_eventos(id),
--   bling_id             BIGINT      NOT NULL,
--   acao                 VARCHAR(20) NOT NULL,
--   tipo                 CHAR(1),
--   situacao             VARCHAR(5),
--   numero               VARCHAR(20),
--   serie                INTEGER,
--   data_emissao         DATE,
--   data_operacao        DATE,
--   contato_id           BIGINT,
--   contato_nome         VARCHAR(255),
--   contato_documento    VARCHAR(30),
--   loja_id              INTEGER,
--   chave_acesso         VARCHAR(50),
--   link_danfe           TEXT,
--   link_pdf             TEXT,
--   payload_completo     JSONB       NOT NULL,
--   created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
```

- [ ] **Step 5: Criar `supabase/schemas/bling_notas_fiscais_consumidor.sql`**

```sql
-- Tabela: bling_notas_fiscais_consumidor
-- NFC-e recebidas via webhook do Bling (consumer_invoice.*).
-- Estrutura similar à NFe, com adição de valor_nota.
--
-- CREATE TABLE bling_notas_fiscais_consumidor (
--   id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
--   bling_evento_id      UUID        REFERENCES bling_eventos(id),
--   bling_id             BIGINT      NOT NULL,
--   acao                 VARCHAR(20) NOT NULL,
--   tipo                 CHAR(1),
--   situacao             VARCHAR(5),
--   numero               VARCHAR(20),
--   serie                INTEGER,
--   valor_nota           NUMERIC(15,2),
--   data_emissao         DATE,
--   data_operacao        DATE,
--   contato_id           BIGINT,
--   contato_nome         VARCHAR(255),
--   contato_documento    VARCHAR(30),
--   loja_id              INTEGER,
--   chave_acesso         VARCHAR(50),
--   link_danfe           TEXT,
--   link_pdf             TEXT,
--   payload_completo     JSONB       NOT NULL,
--   created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );
```

- [ ] **Step 6: Commit**

```bash
git add supabase/schemas/
git commit -m "docs(supabase): adicionar schemas de documentação das tabelas Bling"
```

---

## Task 6: Migração 005 — bling_eventos

**Files:**
- Create: `supabase/migrations/005_bling_eventos.sql`

- [ ] **Step 1: Criar `supabase/migrations/005_bling_eventos.sql`**

```sql
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
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/005_bling_eventos.sql
git commit -m "feat(supabase): migração para tabela bling_eventos com RLS"
```

---

## Task 7: Migração 006 — 4 tabelas de dados estruturados

**Files:**
- Create: `supabase/migrations/006_bling_dados.sql`

- [ ] **Step 1: Criar `supabase/migrations/006_bling_dados.sql`**

```sql
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
```

- [ ] **Step 2: Aplicar as migrações**

**Opção A — Supabase CLI:**
```bash
npx supabase db push
```

**Opção B — Dashboard Supabase:**
Execute os dois arquivos de migração em sequência no SQL Editor.

- [ ] **Step 3: Confirmar no Dashboard**

Verifique que as 5 tabelas existem: `bling_eventos`, `bling_estoques`, `bling_pedidos_vendas`, `bling_notas_fiscais`, `bling_notas_fiscais_consumidor`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/006_bling_dados.sql
git commit -m "feat(supabase): migração para tabelas de dados estruturados do Bling"
```

---

## Task 8: Processadores — extração e persistência por tipo de evento

**Files:**
- Create: `src/lib/bling/processadores.ts`

Este módulo recebe o ID do evento já salvo, o recurso, a ação e os dados brutos, extrai os campos estruturados e salva na tabela correta.

- [ ] **Step 1: Criar `src/lib/bling/processadores.ts`**

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/supabase'
import type {
  RecursoBling,
  BlingEstoqueDados,
  BlingPedidoVendaDados,
  BlingNotaFiscalDados,
  BlingNotaFiscalConsumidorDados,
} from './types'

type ClienteSupabase = SupabaseClient<Database>

export async function processarEvento(
  supabase: ClienteSupabase,
  eventoId: string,
  recurso: RecursoBling,
  acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  switch (recurso) {
    case 'stock':
      return processarEstoque(supabase, eventoId, data)
    case 'order':
      return processarPedidoVenda(supabase, eventoId, acao, data)
    case 'invoice':
      return processarNotaFiscal(supabase, eventoId, acao, data)
    case 'consumer_invoice':
      return processarNFCe(supabase, eventoId, acao, data)
  }
}

async function processarEstoque(
  supabase: ClienteSupabase,
  eventoId: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as BlingEstoqueDados

  if (!d.produto?.id) {
    return { ok: false, erro: 'produto.id ausente no payload de estoque' }
  }

  const { error } = await supabase.from('bling_estoques').insert({
    bling_evento_id: eventoId,
    produto_id: d.produto.id,
    saldo_fisico_total: d.saldoFisicoTotal ?? null,
    saldo_virtual_total: d.saldoVirtualTotal ?? null,
  })

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

async function processarPedidoVenda(
  supabase: ClienteSupabase,
  eventoId: string,
  acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as BlingPedidoVendaDados

  if (!d.id) return { ok: false, erro: 'id ausente no payload de pedido de venda' }

  const { error } = await supabase.from('bling_pedidos_vendas').insert({
    bling_evento_id: eventoId,
    bling_id: d.id,
    acao,
    numero: d.numero ?? null,
    numero_loja: d.numeroLoja ?? null,
    data: d.data ?? null,
    data_saida: d.dataSaida ?? null,
    data_prevista: d.dataPrevista ?? null,
    total_produtos: d.totalProdutos ?? null,
    total: d.total ?? null,
    situacao_id: d.situacao?.id ?? null,
    situacao_valor: d.situacao?.valor ?? null,
    contato_id: d.contato?.id ?? null,
    contato_nome: d.contato?.nome ?? null,
    contato_tipo_pessoa: d.contato?.tipoPessoa ?? null,
    contato_documento: d.contato?.numeroDocumento ?? null,
    loja_id: d.loja?.id ?? null,
    vendedor_id: d.vendedor?.id ?? null,
    observacoes: d.observacoes ?? null,
    numero_pedido_compra: d.numeroPedidoCompra ?? null,
    itens: (d.itens ?? null) as Json,
    parcelas: (d.parcelas ?? null) as Json,
    transporte: (d.transporte ?? null) as Json,
    payload_completo: data as unknown as Json,
  })

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

async function processarNotaFiscal(
  supabase: ClienteSupabase,
  eventoId: string,
  acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as BlingNotaFiscalDados

  if (!d.id) return { ok: false, erro: 'id ausente no payload de nota fiscal' }

  const { error } = await supabase.from('bling_notas_fiscais').insert({
    bling_evento_id: eventoId,
    bling_id: d.id,
    acao,
    tipo: d.tipo ?? null,
    situacao: d.situacao ?? null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    data_emissao: d.dataEmissao ?? null,
    data_operacao: d.dataOperacao ?? null,
    contato_id: d.contato?.id ?? null,
    contato_nome: d.contato?.nome ?? null,
    contato_documento: d.contato?.numeroDocumento ?? null,
    loja_id: d.loja?.id ?? null,
    chave_acesso: d.chaveAcesso ?? null,
    link_danfe: d.linkDanfe ?? null,
    link_pdf: d.linkPDF ?? null,
    payload_completo: data as unknown as Json,
  })

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}

async function processarNFCe(
  supabase: ClienteSupabase,
  eventoId: string,
  acao: string,
  data: Record<string, unknown>
): Promise<{ ok: boolean; erro?: string }> {
  const d = data as BlingNotaFiscalConsumidorDados

  if (!d.id) return { ok: false, erro: 'id ausente no payload de NFC-e' }

  const { error } = await supabase.from('bling_notas_fiscais_consumidor').insert({
    bling_evento_id: eventoId,
    bling_id: d.id,
    acao,
    tipo: d.tipo ?? null,
    situacao: d.situacao ?? null,
    numero: d.numero ?? null,
    serie: d.serie ?? null,
    valor_nota: d.valorNota ?? null,
    data_emissao: d.dataEmissao ?? null,
    data_operacao: d.dataOperacao ?? null,
    contato_id: d.contato?.id ?? null,
    contato_nome: d.contato?.nome ?? null,
    contato_documento: d.contato?.numeroDocumento ?? null,
    loja_id: d.loja?.id ?? null,
    chave_acesso: d.chaveAcesso ?? null,
    link_danfe: d.linkDanfe ?? null,
    link_pdf: d.linkPDF ?? null,
    payload_completo: data as unknown as Json,
  })

  if (error) return { ok: false, erro: error.message }
  return { ok: true }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/bling/processadores.ts
git commit -m "feat(bling): implementar processadores para persistir dados por tipo de evento"
```

---

## Task 9: Atualizar tipos TypeScript do Supabase

**Files:**
- Modify: `src/types/supabase.ts`

- [ ] **Step 1: Tentar regenerar via CLI**

```bash
npx supabase gen types typescript --project-id <SEU_PROJECT_ID> > src/types/supabase.ts
```

Se não tiver o `project-id`, adicione manualmente no Step 2.

- [ ] **Step 2: Adicionar manualmente as 5 tabelas em `src/types/supabase.ts`**

Localize `Tables: {` dentro de `public:` e adicione após `profiles: { ... }`:

```typescript
bling_eventos: {
  Row: {
    id: string
    recurso: string
    acao: string
    event_id: string | null
    bling_id: number | null
    payload: Json
    status: 'recebido' | 'processado' | 'erro'
    erro_mensagem: string | null
    created_at: string
  }
  Insert: {
    id?: string
    recurso: string
    acao: string
    event_id?: string | null
    bling_id?: number | null
    payload: Json
    status?: 'recebido' | 'processado' | 'erro'
    erro_mensagem?: string | null
    created_at?: string
  }
  Update: {
    status?: 'recebido' | 'processado' | 'erro'
    erro_mensagem?: string | null
  }
  Relationships: []
}
bling_estoques: {
  Row: {
    id: string
    bling_evento_id: string | null
    produto_id: number
    saldo_fisico_total: number | null
    saldo_virtual_total: number | null
    created_at: string
  }
  Insert: {
    id?: string
    bling_evento_id?: string | null
    produto_id: number
    saldo_fisico_total?: number | null
    saldo_virtual_total?: number | null
    created_at?: string
  }
  Update: Partial<Pick<Database['public']['Tables']['bling_estoques']['Insert'], 'saldo_fisico_total' | 'saldo_virtual_total'>>
  Relationships: []
}
bling_pedidos_vendas: {
  Row: {
    id: string
    bling_evento_id: string | null
    bling_id: number
    acao: string
    numero: string | null
    numero_loja: string | null
    data: string | null
    data_saida: string | null
    data_prevista: string | null
    total_produtos: number | null
    total: number | null
    situacao_id: number | null
    situacao_valor: string | null
    contato_id: number | null
    contato_nome: string | null
    contato_tipo_pessoa: string | null
    contato_documento: string | null
    loja_id: number | null
    vendedor_id: number | null
    observacoes: string | null
    numero_pedido_compra: string | null
    itens: Json | null
    parcelas: Json | null
    transporte: Json | null
    payload_completo: Json
    created_at: string
  }
  Insert: {
    id?: string
    bling_evento_id?: string | null
    bling_id: number
    acao: string
    numero?: string | null
    numero_loja?: string | null
    data?: string | null
    data_saida?: string | null
    data_prevista?: string | null
    total_produtos?: number | null
    total?: number | null
    situacao_id?: number | null
    situacao_valor?: string | null
    contato_id?: number | null
    contato_nome?: string | null
    contato_tipo_pessoa?: string | null
    contato_documento?: string | null
    loja_id?: number | null
    vendedor_id?: number | null
    observacoes?: string | null
    numero_pedido_compra?: string | null
    itens?: Json | null
    parcelas?: Json | null
    transporte?: Json | null
    payload_completo: Json
    created_at?: string
  }
  Update: Record<string, never>
  Relationships: []
}
bling_notas_fiscais: {
  Row: {
    id: string
    bling_evento_id: string | null
    bling_id: number
    acao: string
    tipo: string | null
    situacao: string | null
    numero: string | null
    serie: number | null
    data_emissao: string | null
    data_operacao: string | null
    contato_id: number | null
    contato_nome: string | null
    contato_documento: string | null
    loja_id: number | null
    chave_acesso: string | null
    link_danfe: string | null
    link_pdf: string | null
    payload_completo: Json
    created_at: string
  }
  Insert: {
    id?: string
    bling_evento_id?: string | null
    bling_id: number
    acao: string
    tipo?: string | null
    situacao?: string | null
    numero?: string | null
    serie?: number | null
    data_emissao?: string | null
    data_operacao?: string | null
    contato_id?: number | null
    contato_nome?: string | null
    contato_documento?: string | null
    loja_id?: number | null
    chave_acesso?: string | null
    link_danfe?: string | null
    link_pdf?: string | null
    payload_completo: Json
    created_at?: string
  }
  Update: Record<string, never>
  Relationships: []
}
bling_notas_fiscais_consumidor: {
  Row: {
    id: string
    bling_evento_id: string | null
    bling_id: number
    acao: string
    tipo: string | null
    situacao: string | null
    numero: string | null
    serie: number | null
    valor_nota: number | null
    data_emissao: string | null
    data_operacao: string | null
    contato_id: number | null
    contato_nome: string | null
    contato_documento: string | null
    loja_id: number | null
    chave_acesso: string | null
    link_danfe: string | null
    link_pdf: string | null
    payload_completo: Json
    created_at: string
  }
  Insert: {
    id?: string
    bling_evento_id?: string | null
    bling_id: number
    acao: string
    tipo?: string | null
    situacao?: string | null
    numero?: string | null
    serie?: number | null
    valor_nota?: number | null
    data_emissao?: string | null
    data_operacao?: string | null
    contato_id?: number | null
    contato_nome?: string | null
    contato_documento?: string | null
    loja_id?: number | null
    chave_acesso?: string | null
    link_danfe?: string | null
    link_pdf?: string | null
    payload_completo: Json
    created_at?: string
  }
  Update: Record<string, never>
  Relationships: []
}
```

- [ ] **Step 3: Verificar type-check**

```bash
npm run type-check
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add src/types/supabase.ts
git commit -m "feat(types): adicionar tipos TypeScript para as 5 tabelas do Bling"
```

---

## Task 10: Variáveis de ambiente

**Files:**
- Modify: `src/lib/env.ts`
- Modify: `.env.example`

- [ ] **Step 1: Adicionar `NEXT_PUBLIC_APP_URL` em `src/lib/env.ts`**

Abra `src/lib/env.ts` e adicione ao final do objeto `env`:

```typescript
NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
```

Resultado final do objeto:
```typescript
export const env = {
  NEXT_PUBLIC_SUPABASE_URL:      getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY:     process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  CRON_SECRET:                   process.env.CRON_SECRET ?? '',
  BLING_CLIENT_ID:               process.env.BLING_CLIENT_ID ?? '',
  BLING_CLIENT_SECRET:           process.env.BLING_CLIENT_SECRET ?? '',
  BLING_WEBHOOK_SECRET:          process.env.BLING_WEBHOOK_SECRET ?? '',
  NUVEMSHOP_CLIENT_ID:           process.env.NUVEMSHOP_CLIENT_ID ?? '',
  NUVEMSHOP_CLIENT_SECRET:       process.env.NUVEMSHOP_CLIENT_SECRET ?? '',
  NUVEMSHOP_WEBHOOK_SECRET:      process.env.NUVEMSHOP_WEBHOOK_SECRET ?? '',
  NEXT_PUBLIC_APP_URL:           process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
} as const
```

- [ ] **Step 2: Atualizar `.env.example`**

```env
# Bling ERP
BLING_CLIENT_ID=
BLING_CLIENT_SECRET=
BLING_WEBHOOK_SECRET=

# URL pública da aplicação (exibida como URL do webhook no painel)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/env.ts .env.example
git commit -m "feat(env): adicionar NEXT_PUBLIC_APP_URL para URL do webhook Bling"
```

---

## Task 11: Handler do webhook

**Files:**
- Modify: `src/app/api/bling/webhook/route.ts`

Fluxo:
1. Verificar token → 401 se inválido
2. Parsear envelope → 200 ignorado se evento desconhecido
3. Salvar em `bling_eventos` com `status: 'recebido'`
4. Chamar processador específico para salvar na tabela certa
5. Atualizar `bling_eventos.status` para 'processado' ou 'erro'
6. Sempre retornar 200 após salvar o evento (evita reenvio do Bling)

- [ ] **Step 1: Substituir `src/app/api/bling/webhook/route.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import { verificarTokenWebhook, parsearEnvelopeBling } from '@/lib/bling/webhook'
import { processarEvento } from '@/lib/bling/processadores'
import type { Database, Json } from '@/types/supabase'

function criarClienteServiceRole() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function extrairBlingId(recurso: string, data: Record<string, unknown>): number | null {
  // estoque não tem id raiz — usa produto.id
  if (recurso === 'stock') {
    const produto = data.produto as Record<string, unknown> | undefined
    return typeof produto?.id === 'number' ? produto.id : null
  }
  return typeof data.id === 'number' ? data.id : null
}

export async function POST(request: Request) {
  if (!verificarTokenWebhook(request)) {
    return Response.json({ erro: 'Não autorizado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ erro: 'Payload inválido' }, { status: 400 })
  }

  const parsed = parsearEnvelopeBling(body)

  if (!parsed) {
    // Evento não reconhecido — 200 para evitar reenvio
    return Response.json({ ok: true, ignorado: true })
  }

  const { envelope, recurso, acao } = parsed
  const supabase = criarClienteServiceRole()

  // 1. Salvar evento bruto
  const { data: eventoSalvo, error: erroEvento } = await supabase
    .from('bling_eventos')
    .insert({
      recurso,
      acao,
      event_id: envelope.eventId || null,
      bling_id: extrairBlingId(recurso, envelope.data),
      payload: envelope as unknown as Json,
      status: 'recebido',
    })
    .select('id')
    .single()

  if (erroEvento || !eventoSalvo) {
    console.error('[Bling Webhook] Erro ao salvar evento bruto:', erroEvento?.message)
    return Response.json({ ok: false })
  }

  // 2. Processar na tabela específica
  const resultado = await processarEvento(
    supabase,
    eventoSalvo.id,
    recurso,
    acao,
    envelope.data
  )

  // 3. Atualizar status do evento
  const novoStatus = resultado.ok ? 'processado' : 'erro'
  await supabase
    .from('bling_eventos')
    .update({
      status: novoStatus,
      erro_mensagem: resultado.erro ?? null,
    })
    .eq('id', eventoSalvo.id)

  if (!resultado.ok) {
    console.error('[Bling Webhook] Erro ao processar evento:', resultado.erro)
  }

  return Response.json({ ok: true })
}
```

- [ ] **Step 2: Iniciar o servidor e testar evento de estoque**

```bash
npm run dev
```

```bash
curl -X POST http://localhost:3000/api/bling/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_BLING_WEBHOOK_SECRET" \
  -d '{
    "eventId": "test-001",
    "date": "2026-05-25T10:00:00Z",
    "version": 1,
    "event": "stock.updated",
    "companyId": 12345,
    "data": {
      "produto": { "id": 123456 },
      "saldoFisicoTotal": 42,
      "saldoVirtualTotal": 38
    }
  }'
```

Resposta esperada: `{"ok":true}`

- [ ] **Step 3: Verificar no Supabase**

Em `bling_eventos`: registro com `recurso: "stock"`, `acao: "updated"`, `status: "processado"`

Em `bling_estoques`: registro com `produto_id: 123456`, `saldo_fisico_total: 42`, `saldo_virtual_total: 38`

- [ ] **Step 4: Testar evento de pedido de venda**

```bash
curl -X POST http://localhost:3000/api/bling/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_BLING_WEBHOOK_SECRET" \
  -d '{
    "eventId": "test-002",
    "date": "2026-05-25T10:00:00Z",
    "version": 1,
    "event": "order.created",
    "companyId": 12345,
    "data": {
      "id": 999,
      "numero": "12345",
      "data": "2026-05-25",
      "total": 1500.00,
      "situacao": { "id": 9, "valor": "Em aberto" },
      "contato": { "id": 1, "nome": "João Silva", "tipoPessoa": "F", "numeroDocumento": "123.456.789-00" },
      "itens": [],
      "parcelas": [],
      "payload_completo": {}
    }
  }'
```

Em `bling_pedidos_vendas`: registro com `bling_id: 999`, `numero: "12345"`, `total: 1500`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/bling/webhook/route.ts
git commit -m "feat(bling): webhook handler com persistência em evento bruto e tabelas estruturadas"
```

---

## Task 12: Client Component — copiar URL

**Files:**
- Create: `src/app/(app)/integracoes/bling/BlingUrlCopiar.tsx`

- [ ] **Step 1: Criar `src/app/(app)/integracoes/bling/BlingUrlCopiar.tsx`**

```tsx
'use client'

import { useState } from 'react'

interface BlingUrlCopiarProps {
  url: string
}

export function BlingUrlCopiar({ url }: BlingUrlCopiarProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiarUrl() {
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bling-url-copiar">
      <code className="bling-url-copiar__valor">{url}</code>
      <button
        type="button"
        onClick={copiarUrl}
        className="btn btn--secondary btn--sm bling-url-copiar__botao"
      >
        {copiado ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/(app)/integracoes/bling/BlingUrlCopiar.tsx
git commit -m "feat(bling): componente cliente para copiar URL do webhook"
```

---

## Task 13: Página de integração Bling

**Files:**
- Modify: `src/app/(app)/integracoes/bling/page.tsx`

- [ ] **Step 1: Substituir `src/app/(app)/integracoes/bling/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { MAPEAMENTO_RECURSO_BLING } from '@/lib/bling/types'
import type { RecursoBling } from '@/lib/bling/types'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/Badge'
import { BlingUrlCopiar } from './BlingUrlCopiar'
import './integracoes-bling.css'

export default async function IntegracaoBlingPage() {
  const supabase = await createClient()

  const { data: eventos } = await supabase
    .from('bling_eventos')
    .select('id, recurso, acao, bling_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  const urlWebhook = `${env.NEXT_PUBLIC_APP_URL}/api/bling/webhook`

  const credenciais = {
    webhookSecret: Boolean(env.BLING_WEBHOOK_SECRET),
    clientId: Boolean(env.BLING_CLIENT_ID),
    clientSecret: Boolean(env.BLING_CLIENT_SECRET),
  }

  return (
    <PageContainer titulo="Integração Bling">
      <div className="bling-integracao">

        {/* Status geral */}
        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Conexão</h2>
          <div className="bling-integracao__status-linha">
            <span>Status da integração</span>
            <Badge variante={credenciais.webhookSecret ? 'sucesso' : 'erro'}>
              {credenciais.webhookSecret ? 'Configurado' : 'Não configurado'}
            </Badge>
          </div>
        </section>

        {/* URL do Webhook */}
        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">URL do Webhook</h2>
          <p className="bling-integracao__descricao">
            Configure esta URL no painel do Bling em{' '}
            <strong>Configurações → Webhooks → Configuração de servidores</strong>.
            O token configurado deve coincidir com a variável{' '}
            <code>BLING_WEBHOOK_SECRET</code>.
          </p>
          <BlingUrlCopiar url={urlWebhook} />
        </section>

        {/* Credenciais */}
        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Credenciais</h2>
          <p className="bling-integracao__descricao">
            Configure em <code>.env.local</code> e reinicie o servidor.
          </p>
          <ul className="bling-integracao__credenciais-lista">
            <li className="bling-integracao__credencial-item">
              <code className="bling-integracao__credencial-nome">BLING_WEBHOOK_SECRET</code>
              <Badge variante={credenciais.webhookSecret ? 'sucesso' : 'erro'}>
                {credenciais.webhookSecret ? 'Configurado' : 'Obrigatório'}
              </Badge>
            </li>
            <li className="bling-integracao__credencial-item">
              <code className="bling-integracao__credencial-nome">BLING_CLIENT_ID</code>
              <Badge variante={credenciais.clientId ? 'sucesso' : 'aviso'}>
                {credenciais.clientId ? 'Configurado' : 'Opcional'}
              </Badge>
            </li>
            <li className="bling-integracao__credencial-item">
              <code className="bling-integracao__credencial-nome">BLING_CLIENT_SECRET</code>
              <Badge variante={credenciais.clientSecret ? 'sucesso' : 'aviso'}>
                {credenciais.clientSecret ? 'Configurado' : 'Opcional'}
              </Badge>
            </li>
          </ul>
        </section>

        {/* Eventos monitorados */}
        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Eventos Monitorados</h2>
          <ul className="bling-integracao__eventos-mapeados">
            <li>
              <Badge variante="info">stock.*</Badge>
              <span>Atualizações de saldo de estoque → <code>bling_estoques</code></span>
            </li>
            <li>
              <Badge variante="info">order.*</Badge>
              <span>Pedidos de vendas → <code>bling_pedidos_vendas</code></span>
            </li>
            <li>
              <Badge variante="info">invoice.*</Badge>
              <span>Notas Fiscais Eletrônicas → <code>bling_notas_fiscais</code></span>
            </li>
            <li>
              <Badge variante="info">consumer_invoice.*</Badge>
              <span>NFC-e → <code>bling_notas_fiscais_consumidor</code></span>
            </li>
          </ul>
        </section>

        {/* Últimos eventos */}
        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Últimos Eventos</h2>
          {eventos && eventos.length > 0 ? (
            <table className="bling-integracao__tabela">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th>Ação</th>
                  <th>ID no Bling</th>
                  <th>Status</th>
                  <th>Recebido em</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>
                      {MAPEAMENTO_RECURSO_BLING[evento.recurso as RecursoBling] ?? evento.recurso}
                    </td>
                    <td>{evento.acao}</td>
                    <td>{evento.bling_id ?? '—'}</td>
                    <td>
                      <Badge
                        variante={
                          evento.status === 'processado'
                            ? 'sucesso'
                            : evento.status === 'erro'
                            ? 'erro'
                            : 'inativo'
                        }
                      >
                        {evento.status}
                      </Badge>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(evento.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="bling-integracao__sem-eventos">
              Nenhum evento recebido ainda. Configure o webhook no Bling para começar.
            </p>
          )}
        </section>

      </div>
    </PageContainer>
  )
}
```

- [ ] **Step 2: Verificar type-check**

```bash
npm run type-check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/integracoes/bling/page.tsx
git commit -m "feat(bling): página de integração com status, URL, credenciais e log de eventos"
```

---

## Task 14: CSS da página

**Files:**
- Create: `src/app/(app)/integracoes/bling/integracoes-bling.css`

- [ ] **Step 1: Criar `src/app/(app)/integracoes/bling/integracoes-bling.css`**

```css
.bling-integracao {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.bling-integracao__secao {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.bling-integracao__titulo-secao {
  font-size: var(--fs-text-md);
  font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
  margin: 0;
}

.bling-integracao__descricao {
  font-size: var(--fs-text-sm);
  color: var(--color-text-secondary);
  margin: 0;
  line-height: var(--lh-normal);
}

.bling-integracao__status-linha {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--fs-text-sm);
  color: var(--color-text-primary);
}

/* URL do webhook */
.bling-url-copiar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background: var(--color-gray-50);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
}

.bling-url-copiar__valor {
  flex: 1;
  font-size: var(--fs-text-sm);
  color: var(--color-text-primary);
  font-family: monospace;
  word-break: break-all;
}

.bling-url-copiar__botao {
  flex-shrink: 0;
}

/* Credenciais */
.bling-integracao__credenciais-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bling-integracao__credencial-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--color-gray-50);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.bling-integracao__credencial-nome {
  font-size: var(--fs-text-sm);
  color: var(--color-text-primary);
  font-family: monospace;
}

/* Eventos monitorados */
.bling-integracao__eventos-mapeados {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bling-integracao__eventos-mapeados li {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--fs-text-sm);
  color: var(--color-text-secondary);
}

/* Tabela de eventos */
.bling-integracao__tabela {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--fs-text-sm);
}

.bling-integracao__tabela th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  border-bottom: 2px solid var(--color-border);
  color: var(--color-text-secondary);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bling-integracao__tabela td {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.bling-integracao__tabela tr:last-child td {
  border-bottom: none;
}

.bling-integracao__sem-eventos {
  font-size: var(--fs-text-sm);
  color: var(--color-text-secondary);
  text-align: center;
  padding: var(--space-8) 0;
  margin: 0;
}
```

- [ ] **Step 2: Verificar visualmente em `http://localhost:3000/integracoes/bling`**

Confirme:
- Badge de status da conexão
- URL copiável do webhook
- Lista de credenciais com status
- 4 eventos monitorados listados com sua tabela de destino
- Tabela de eventos (ou mensagem "Nenhum evento")

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/integracoes/bling/integracoes-bling.css
git commit -m "feat(bling): estilos da página de integração Bling"
```

---

## Self-Review

**Cobertura do spec:**
- ✅ Receber e salvar eventos de estoque → `bling_estoques` (Tasks 6–8, 11)
- ✅ Receber e salvar pedidos de vendas → `bling_pedidos_vendas` (Tasks 6–8, 11)
- ✅ Receber e salvar NFe → `bling_notas_fiscais` (Tasks 6–8, 11)
- ✅ Receber e salvar NFC-e → `bling_notas_fiscais_consumidor` (Tasks 6–8, 11)
- ✅ Log de todos os eventos brutos → `bling_eventos` (Tasks 5–6)
- ✅ Página com credenciais e URL do webhook (Tasks 12–14)
- ✅ Componentes Badge e PageContainer (Tasks 1–2)
- ✅ Envelope correto Bling V3 (`event: "stock.updated"`) (Tasks 3–4)

**Consistência de tipos:**
- `BlingWebhookEnvelope` definido em Task 3, usado em Task 4 — ✅
- `RecursoBling` / `extrairRecurso` definidos em Task 3, usados em Tasks 4, 8, 11 — ✅
- `MAPEAMENTO_RECURSO_BLING` definido em Task 3, usado em Task 13 — ✅
- `parsearEnvelopeBling` definido em Task 4, usado em Task 11 — ✅
- `processarEvento` definido em Task 8, usado em Task 11 — ✅
- Tipos Supabase das 5 tabelas definidos em Task 9, usados em Tasks 8 e 11 — ✅
- `env.NEXT_PUBLIC_APP_URL` adicionado em Task 10, usado em Task 13 — ✅
