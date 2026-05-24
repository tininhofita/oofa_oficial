# Oofa ERP — Guia para a IA

## O que é este sistema

Oofa é um ERP interno para gestão de e-commerce. Consome dados da **Bling** (ERP/financeiro) e da **NuvemShop** (loja virtual), armazena tudo no **Supabase** e oferece dashboards, relatórios e controles operacionais.

**Stack:** Next.js 15 (App Router) · TypeScript · CSS próprio · Supabase · Zustand

---

## Regras globais (sempre seguir)

- Idioma: **Português do Brasil** em todo o código, comentários e UI
- CSS: **nunca inline** — sempre arquivo `.css` separado junto ao componente
- Valores financeiros: sempre `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Formulários: primeira letra maiúscula ao salvar valores de texto
- Dados sensíveis: **nunca commitar** — usar `.env.local` e `.env.example`
- Toda nova tabela Supabase **obrigatoriamente** tem RLS configurado
- Priorizar **Server Components** — usar `'use client'` só quando necessário

---

## Arquitetura de rotas

```
src/app/
├── (auth)/         → páginas sem sidebar (login)
└── (app)/          → páginas protegidas com Sidebar + Header
    └── api/        → API Routes: sync, webhooks, cron
```

A proteção de rotas é feita via `middleware.ts` na raiz usando Supabase Auth.

---

## Onde ficam os schemas

Toda tabela criada no Supabase **deve ter seu schema salvo** em:

```
supabase/schemas/<nome-da-tabela>.sql
```

Ao trabalhar em qualquer funcionalidade que envolva banco de dados:
1. Consulte primeiro o schema em `supabase/schemas/`
2. Migrações ficam em `supabase/migrations/` com prefixo numérico (`001_`, `002_`...)
3. Os tipos TypeScript gerados pelo Supabase ficam em `src/types/supabase.ts`

---

## Componentes: qual usar em cada caso

### Alertas e feedback
- **Toast / mensagem de sucesso ou erro:** `src/components/ui/Alert/`
- **Confirmação antes de deletar:** `src/components/ui/ConfirmDialog/` — nunca usar Modal genérico para isso
- **Status de registro (ativo/inativo, pago/pendente):** `src/components/ui/Badge/`

### Dados tabulares
- **Toda listagem com colunas:** `src/components/ui/Table/`
- **Paginação de listagens:** `src/components/ui/Pagination/`
- **Ações por linha (editar, excluir, ver):** `src/components/ui/Dropdown/`
- **Lista sem resultados:** `src/components/ui/EmptyState/`

### Cards
- **Card de métrica no dashboard (KPI):** `src/components/features/dashboard/`
- **Card de conteúdo genérico:** `src/components/ui/Card/`

### Formulários
- **Campos individuais com label + input + erro:** `src/components/forms/FormField/`
- **Grupo de campos com título de seção:** `src/components/forms/FormSection/`
- **Botões de ação do formulário (salvar, cancelar):** `src/components/forms/FormActions/`
- **Input de texto:** `src/components/ui/Input/`
- **Select / dropdown de opções:** `src/components/ui/Select/`

### Layout
- **Wrapper de página com padding e título:** `src/components/layout/PageContainer/`
- **Modal genérico:** `src/components/ui/Modal/`
- **Abas dentro de uma página:** `src/components/ui/Tabs/`

### Navegação
- **Rotas tipadas:** use sempre as constantes em `src/constants/routes.ts` — nunca strings hardcoded
- **Permissões por perfil:** consulte `src/constants/permissions.ts`

---

## Estilos: onde estão os padrões visuais

```
src/styles/
├── variables.css     → tokens de cor, espaçamento e tipografia (fonte de verdade)
├── reset.css         → reset global
├── typography.css    → classes de texto
├── buttons.css       → variantes de botão (primary, secondary, danger, ghost)
├── forms.css         → inputs, selects, labels, estados de erro
├── cards.css         → card de página e card de dashboard
├── modals.css        → overlay, container, header/footer do modal
└── alerts.css        → toast, inline alert, variantes de cor
```

**Variáveis de tipografia disponíveis:**
```css
--fs-title-xl: 3.32rem   --fs-title-lg: 2.76rem
--fs-title-md: 2.3rem    --fs-title-sm: 1.92rem
--fs-text-lg: 1.92rem    --fs-text-md: 1.6rem
--fs-text-sm: 1.33rem    --fs-text-xs: 1.11rem
--fs-label: 0.92rem      --fs-button: 1.33rem
--fs-caption: 1.2rem     --fs-input: 1.6rem
```

---

## Integrações externas

### Bling
- Cliente HTTP: `src/lib/bling/client.ts`
- Funções de sync: `src/lib/bling/sync.ts`
- Tipos da API: `src/lib/bling/types.ts`
- Webhook recebido em: `src/app/api/bling/webhook/route.ts`
- Sync manual disparado em: `src/app/api/bling/sync/route.ts`

### NuvemShop
- Cliente HTTP: `src/lib/nuvemshop/client.ts`
- Funções de sync: `src/lib/nuvemshop/sync.ts`
- Tipos da API: `src/lib/nuvemshop/types.ts`
- Webhook recebido em: `src/app/api/nuvemshop/webhook/route.ts`
- Sync manual disparado em: `src/app/api/nuvemshop/sync/route.ts`

### Cron automático
- Endpoint chamado pelo agendador: `src/app/api/cron/sync/route.ts`

**Regra:** toda sincronização salva os dados no Supabase. O frontend sempre lê do Supabase, nunca direto das APIs externas.

---

## Supabase

- **Browser client:** `src/lib/supabase/client.ts` — usar em Client Components
- **Server client:** `src/lib/supabase/server.ts` — usar em Server Components e API Routes
- **Validação de env:** `src/lib/env.ts` — sempre importar de lá, nunca `process.env` direto

---

## Estado global (Zustand)

```
src/stores/
├── auth.store.ts    → usuário logado, perfil, permissões
├── ui.store.ts      → sidebar aberta/fechada, tema, loading global
└── sync.store.ts    → status da sincronização com Bling/NuvemShop
```

---

## Módulos do sistema

| Rota | Descrição |
|------|-----------|
| `/dashboard` | KPIs, gráficos resumidos, status das integrações |
| `/usuarios` | CRUD de usuários com roles (Admin, Gerente, Operador) |
| `/produtos` | Catálogo sincronizado do Bling/NuvemShop |
| `/pedidos` | Pedidos das plataformas com status e histórico |
| `/financeiro` | Contas a pagar e a receber via Bling |
| `/estoque` | Saldos e movimentações |
| `/clientes` | Base de clientes com histórico de compras |
| `/relatorios` | Exportação em .xlsx por módulo |
| `/integracoes` | Status e logs das sincronizações |
| `/configuracoes` | Credenciais Bling/NuvemShop, configurações gerais |
| `/perfil` | Dados do usuário logado |
