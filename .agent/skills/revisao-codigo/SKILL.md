---
name: code-review-checklist
description: Diretrizes de revisão de código cobrindo qualidade, segurança e boas práticas.
allowed-tools: Read, Glob, Grep
---

# Checklist de Revisão de Código

## Checklist de Revisão Rápida

### Correção

- [ ] O código faz o que deveria fazer?
- [ ] Casos de borda (edge cases) foram tratados?
- [ ] Tratamento de erros implementado?
- [ ] Sem bugs óbvios.

### Segurança

- [ ] Entradas validadas e sanitizadas?
- [ ] Sem vulnerabilidades de injeção SQL/NoSQL?
- [ ] Sem vulnerabilidades XSS ou CSRF?
- [ ] Sem segredos ou credenciais sensíveis expostas no código?
- [ ] **Específico para IA:** Proteção contra Prompt Injection (se aplicável).
- [ ] **Específico para IA:** Saídas são sanitizadas antes de serem usadas em sinks críticos.

### Performance

- [ ] Sem queries N+1?
- [ ] Sem loops desnecessários?
- [ ] Cache apropriado sendo utilizado?
- [ ] Impacto no tamanho do bundle considerado?

### Qualidade do Código

- [ ] Nomenclatura clara e intuitiva?
- [ ] DRY (Don't Repeat Yourself) - sem código duplicado?
- [ ] Princípios SOLID seguidos?
- [ ] Nível de abstração apropriado?

### Testes

- [ ] Testes unitários para o novo código?
- [ ] Casos de borda testados?
- [ ] Testes legíveis e fáceis de manter?

### Documentação

- [ ] Lógica complexa comentada?
- [ ] APIs públicas documentadas?
- [ ] README atualizado se necessário.

## Padrões de Revisão IA & LLM (2025)

### Lógica & Alucinações

- [ ] **Chain of Thought:** A lógica segue um caminho verificável?
- [ ] **Casos de Borda:** A IA considerou estados vazios, timeouts e falhas parciais?
- [ ] **Estado Externo:** O código assume premissas seguras sobre sistemas de arquivos ou redes?

### Revisão de Prompt Engineering

```markdown
// ❌ Prompt vago no código
const response = await ai.generate(userInput);

// ✅ Prompt estruturado e seguro
const response = await ai.generate({
system: "Você é um parser especializado...",
input: sanitize(userInput),
schema: ResponseSchema
});
```

## Anti-Padrões para Sinalizar

```typescript
// ❌ Números mágicos
if (status === 3) { ... }

// ✅ Constantes nomeadas
if (status === Status.ACTIVE) { ... }

// ❌ Aninhamento profundo (Deep nesting)
if (a) { if (b) { if (c) { ... } } }

// ✅ Retornos antecipados (Early returns)
if (!a) return;
if (!b) return;
if (!c) return;
// faz o trabalho

// ❌ Funções longas (mais de 100 linhas)
// ✅ Funções pequenas e focadas

// ❌ Tipo 'any'
const data: any = ...

// ✅ Tipagem correta
const data: UserData = ...
```

## Guia de Comentários de Revisão

```
// Problemas bloqueantes usam 🔴
🔴 BLOQUEANTE: Vulnerabilidade de injeção SQL encontrada aqui.

// Sugestões importantes usam 🟡
🟡 SUGESTÃO: Considere usar useMemo para melhor performance.

// Pequenos detalhes (nits) usam 🟢
🟢 NIT: Prefira const em vez de let para variáveis imutáveis.

// Perguntas usam ❓
❓ PERGUNTA: O que acontece se o usuário for nulo aqui?
```
