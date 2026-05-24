---
name: clean-code
description: Padrões pragmáticos de codificação - conciso, direto, sem sobre-engenharia e sem comentários desnecessários.
allowed-tools: Read, Write, Edit
version: 2.0
priority: CRITICAL
---

# Código Limpo - Padrões Pragmáticos de Codificação (IA)

> **SKILL CRÍTICA** - Seja **conciso, direto e focado na solução**.

---

## Princípios Core

| Princípio     | Regra                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------- |
| **SRP**       | Responsabilidade Única - cada função/classe faz APENAS UMA coisa.                           |
| **DRY**       | Não se repita (Don't Repeat Yourself) - extraia duplicatas, reutilize.                      |
| **KISS**      | Mantenha o Simples (Keep It Simple) - a solução mais simples que funciona.                  |
| **YAGNI**     | Você não vai precisar disso (You Aren't Gonna Need It) - não construa o que não será usado. |
| **Escoteiro** | Deixe o código mais limpo do que você o encontrou.                                          |

---

## Regras de Nomenclatura

| Elemento       | Convenção                                                  |
| -------------- | ---------------------------------------------------------- |
| **Variáveis**  | Revelar intenção: `userCount` em vez de `n`.               |
| **Funções**    | Verbo + Substantivo: `getUserById()` em vez de `user()`.   |
| **Booleanos**  | Forma de pergunta: `isActive`, `hasPermission`, `canEdit`. |
| **Constantes** | SCREAMING_SNAKE: `MAX_RETRY_COUNT`.                        |

> **Regra:** Se você precisa de um comentário para explicar um nome, renomeie o elemento.

---

## Regras para Funções

| Regra                      | Descrição                            |
| -------------------------- | ------------------------------------ |
| **Pequena**                | Máximo 20 linhas, idealmente 5-10.   |
| **Uma Coisa**              | Faz uma coisa e faz bem feita.       |
| **Um Nível**               | Um nível de abstração por função.    |
| **Poucos Args**            | Máximo 3 argumentos, prefira 0-2.    |
| **Sem Efeitos Colaterais** | Não mude inputs de forma inesperada. |

---

## Estrutura de Código

| Padrão                  | Aplicação                                                 |
| ----------------------- | --------------------------------------------------------- |
| **Cláusulas de Guarda** | Retornos antecipados (early returns) para casos de borda. |
| **Flat > Nested**       | Evite aninhamento profundo (máximo 2 níveis).             |
| **Composição**          | Pequenas funções compostas logicamente.                   |
| **Colocação**           | Mantenha código relacionado próximo um do outro.          |

---

## Estilo de Codificação IA

| Situação                    | Ação                             |
| --------------------------- | -------------------------------- |
| Usuário pede funcionalidade | Escreva-a diretamente.           |
| Usuário relata bug          | Corrija-o, não explique o óbvio. |
| Sem requisito claro         | Pergunte em vez de assumir.      |

---

## Anti-Padrões (NÃO FAÇA)

| ❌ Padrão                    | ✅ Correção                        |
| ---------------------------- | ---------------------------------- |
| Comentar cada linha          | Delete comentários óbvios.         |
| Helper para uma linha        | Use o código inline.               |
| Factory para 2 objetos       | Instanciação direta.               |
| utils.ts com 1 função        | Coloque o código onde ele é usado. |
| "Primeiro vamos importar..." | Apenas escreva o código.           |
| Aninhamento profundo         | Use cláusulas de guarda.           |
| Números mágicos              | Use constantes nomeadas.           |
| Funções "Deus"               | Divida por responsabilidade.       |

---

## 🔴 Antes de Editar QUALQUER Arquivo (PENSE PRIMEIRO!)

**Antes de mudar um arquivo, pergunte-se:**

1. **O que importa este arquivo?** Eles podem quebrar.
2. **O que este arquivo importa?** Mudanças de interface.
3. **Quais testes cobrem isso?** Os testes podem falhar.
4. **Isso é um componente compartilhado?** Múltiplos lugares podem ser afetados.

> 🔴 **Regra:** Edite o arquivo + todos os arquivos dependentes na MESMA tarefa.
> 🔴 **Nunca deixe imports quebrados ou atualizações pendentes.**

---

## Resumo Técnico

| Faça                             | Não Faça                        |
| -------------------------------- | ------------------------------- |
| Escreva código diretamente       | Escreva tutoriais.              |
| Deixe o código se autodocumentar | Adicione comentários óbvios.    |
| Corrija bugs imediatamente       | Explique a correção primeiro.   |
| Use inline para coisas pequenas  | Crie arquivos desnecessários.   |
| Nomeie com clareza               | Use abreviações.                |
| Mantenha funções pequenas        | Escreva funções de 100+ linhas. |

---

## 🔴 Verificação Final (OBRIGATÓRIO)

**Antes de dizer "tarefa completa", verifique:**

- [ ] **Objetivo atingido?** Fiz exatamente o que foi pedido?
- [ ] **Arquivos editados?** Modifiquei todos os arquivos necessários (incluindo dependências)?
- [ ] **O código funciona?** Verifiquei a lógica?
- [ ] **Sem erros?** Lint e TypeScript passam?
- [ ] **Nada esquecido?** Algum caso de borda passou batido?

---

## Scripts de Verificação (MANDATORY)

> 🔴 **CRITICAL:** Cada agente roda APENAS os scripts da sua própria skill após completar o trabalho.

### Mapeamento Agente → Script

| Agente                    | Script / Comando                                                          |
| ------------------------- | ------------------------------------------------------------------------- |
| **arquiteto-frontend**    | `python .agent/skills/frontend-design/scripts/ux_audit.py .`              |
| **arquiteto-frontend**    | `python .agent/skills/frontend-design/scripts/accessibility_checker.py .` |
| **arquiteto-banco-dados** | `python .agent/skills/database-design/scripts/schema_validator.py .`      |
| **desenvolvedor-mobile**  | `python .agent/skills/mobile-design/scripts/mobile_audit.py .`            |
| **auditor-seguranca**     | `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .`   |
| **especialista-seo**      | `python .agent/skills/seo-fundamentals/scripts/seo_checker.py .`          |

> ❌ **ERRADO:** `gestor-produto` rodando `ux_audit.py`.
> ✅ **CORRETO:** `arquiteto-frontend` rodando `ux_audit.py`.

---

### 🔴 Tratamento de Saída de Script (LER → RESUMIR → PERGUNTAR)

**Ao rodar um script de validação, você DEVE:**

1. **Rodar o script** e capturar toda a saída.
2. **Analisar a saída** - identificar erros, avisos e sucessos.
3. **Resumir para o usuário** seguindo este formato:

```markdown
## Resultados do Script: [nome_do_script.py]

### ❌ Erros Encontrados (X itens)

- [Arquivo:Linha] Descrição do erro

### ⚠️ Avisos (Y itens)

- [Arquivo:Linha] Descrição do aviso

### ✅ Passou (Z itens)

- Verificação tal passou

**Devo corrigir os X erros encontrados?**
```

4. **Esperar confirmação do usuário** antes de aplicar correções.
5. **Após corrigir** → Rodar o script novamente para confirmar.

> 🔴 **VIOLAÇÃO:** Rodar script e ignorar a saíba ou auto-corrigir sem perguntar.
