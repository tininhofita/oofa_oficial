# Design de Banco de Dados

> Princípios de modelagem de dados, otimização e integridade.
> **Pensado para PostgreSQL/Supabase e alta performance.**

---

## 1. Princípios de Modelagem (PostgreSQL)

### Tipagem Correta

- **Financeiro:** USE `numeric` ou `bigint` (centavos). NUNCA use `float` ou `double`.
- **Identificadores:** USE `uuid` (v4/v7) para chaves primárias.
- **Datas:** USE `timestamptz` para garantir consistência de fuso horário.
- **Dados Flexíveis:** USE `jsonb` para metadados, mas evite para campos de busca frequente.

### Normalização vs Performance

1. **1NF-3NF:** O padrão para evitar duplicidade.
2. **Desnormalização estratégica:** Use apenas se o volume de leitura for massivo e os JOINs se tornarem lentos (verifique com EXPLAIN primeiro).

---

## 2. Índices e Performance

### Regras de Ouro

- **Índice B-Tree:** Padrão para `=, <, <=, >, >=`.
- **Índice GIN:** Essencial para colunas `jsonb` ou busca `full-text`.
- **Índices Compostos:** A ordem das colunas importa! Coloque a coluna mais filtrada primeiro.
- **Índices Parciais:** `CREATE INDEX ... WHERE active = true`. Ótimo para tabelas grandes com muitos dados inativos.

### O Auditor EXPLAIN

Sempre rode `EXPLAIN ANALYZE` em queries lentas.

- Procure por `Seq Scan` em tabelas grandes → Falta de índice.
- Procure por `Index Scan` com filtros extras → Índice não está otimizado.

---

## 3. Segurança (Supabase RLS)

O **Row Level Security (RLS)** é obrigatório para projetos financeiros.

1. **Política de Seleção:** `auth.uid() = user_id`.
2. **Segurança por Padrão:** Sempre comece com `ALTER TABLE x ENABLE ROW LEVEL SECURITY;`.
3. **Service Role:** Use apenas no backend em tarefas administrativas.

---

## 4. Migrações Seguras

1. **Adição de Coluna:** Adicione como `nullable` primeiro.
2. **Índices:** Use `CONCURRENTLY` em bancos de produção para não travar escritas.
3. **Rollback:** Cada migração deve ter um plano de retorno.

---

## 5. Checklist de Banco de Dados

- [ ] **Tipagem:** Valores monetários usam `numeric` ou `bigint`?
- [ ] **PKs/FKs:** Todas as tabelas têm chaves e relacionamentos protegidos?
- [ ] **RLS:** A segurança de linha está ativada e testada?
- [ ] **Performance:** O `EXPLAIN ANALYZE` foi executado para as queries principais?
- [ ] **Índices:** Existem índices para os campos usados no `WHERE` e `ORDER BY`?
