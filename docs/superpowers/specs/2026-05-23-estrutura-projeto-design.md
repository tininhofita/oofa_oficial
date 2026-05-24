# Design: Estrutura de Pastas — Oofa ERP

**Data:** 2026-05-23  
**Status:** Aprovado

## Contexto

ERP interno para gestão de e-commerce. Consome Bling e NuvemShop, armazena no Supabase, interface em Next.js com CSS próprio.

## Decisões arquiteturais

- **Next.js 15 (App Router)** — fullstack em um único projeto, API Routes como backend
- **Route Groups** — `(auth)` sem sidebar, `(app)` protegido com layout completo
- **Zustand** — estado global leve (auth, ui, sync)
- **CSS próprio** — sem bibliotecas de UI, arquivos `.css` por componente
- **Supabase Auth** — autenticação via middleware.ts
- **Sync triplo** — webhooks (real-time) + cron automático + manual

## Estrutura aprovada

```
oofa/
├── .github/workflows/ci.yml
├── .gitignore
├── .env.example
├── CLAUDE.md
├── middleware.ts
├── public/assets/
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── error.tsx / not-found.tsx
│   │   ├── (auth)/login/
│   │   ├── (app)/ [dashboard, usuarios, produtos, pedidos,
│   │   │          financeiro, estoque, clientes, relatorios,
│   │   │          integracoes, configuracoes, perfil]
│   │   └── api/ [bling, nuvemshop, cron]
│   ├── components/
│   │   ├── ui/ [Button, Input, Select, Table, Modal, Alert,
│   │   │       Badge, Card, Spinner, Pagination, Dropdown,
│   │   │       Tabs, EmptyState, ConfirmDialog]
│   │   ├── layout/ [Sidebar, Header, PageContainer]
│   │   ├── forms/ [FormField, FormSection, FormActions]
│   │   └── features/ [por módulo]
│   ├── lib/ [supabase, bling, nuvemshop, utils, env.ts]
│   ├── stores/ [auth, ui, sync]
│   ├── hooks/ [useAuth, useSync, usePagination]
│   ├── types/ [index.ts, supabase.ts]
│   ├── styles/ [variables, reset, typography, buttons,
│   │           forms, cards, modals, alerts]
│   └── constants/ [routes.ts, permissions.ts]
├── supabase/
│   ├── migrations/
│   └── schemas/
└── docs/api/ [bling.md, nuvemshop.md]
```

## Módulos

| Rota | Descrição |
|------|-----------|
| `/dashboard` | KPIs e status das integrações |
| `/usuarios` | CRUD com roles (Admin, Gerente, Operador) |
| `/produtos` | Catálogo sincronizado |
| `/pedidos` | Pedidos com status |
| `/financeiro` | Contas a pagar/receber |
| `/estoque` | Saldos e movimentações |
| `/clientes` | Base de clientes |
| `/relatorios` | Exportação .xlsx |
| `/integracoes` | Logs de sync |
| `/configuracoes` | Credenciais das plataformas |
| `/perfil` | Usuário logado |
