# Referência do Sistema de Tipografia

> Princípios de tipografia e tomada de decisão - aprenda a pensar, não a memorizar.
> **Sem nomes de fontes fixos ou tamanhos - entenda o sistema.**

---

## 1. Escala Modular

### O que é uma escala modular?

É um relacionamento matemático entre os tamanhos de fonte.
**Base × Razão^n**

| Razão comuns       | Valor | Clima       | Melhor para                              |
| ------------------ | ----- | ----------- | ---------------------------------------- |
| **Major Second**   | 1.125 | Sutil       | Interfaces compactas (Dashboards)        |
| **Major Third**    | 1.25  | Equilibrado | Sites institucionais, blogs (Mais comum) |
| **Perfect Fourth** | 1.333 | Notável     | Editorial, Revistas                      |
| **Golden Ratio**   | 1.618 | Impacto     | Seções de Hero, Marketing premium        |

---

## 2. Princípios de Legibilidade

### Largura de Linha (Line Length)

O "ponto doce" da leitura é entre **45-75 caracteres por linha**.

- **< 45:** Muito picotado, quebra o fluxo.
- **> 75:** Gera cansaço visual ao rastrear a próxima linha.

### Altura de Linha (Line Height)

- **Cabeçalhos:** 1.1 - 1.3 (Linhas curtas pedem menos espaço).
- **Texto Principal:** 1.4 - 1.6 (Espaçamento confortável para ler).
- **Long-form:** 1.6 - 1.8 (Máxima leitura).

---

## 3. Emparelhamento de Fontes (Pairing)

- **Estratégia de Contraste:** Seriadas para títulos + Sem-serifa para o corpo (Clássico/Editorial).
- **Mesma Família:** Use uma fonte variável com diferentes pesos (Moderno/Coeso).
- **Evite:** Duas fontes decorativas juntas, ou duas fontes muito parecidas que conflitem levemente.

---

## 4. Tipografia Responsiva (fluid)

Use `clamp()` para evitar saltos bruscos entre breakpoints:

```css
font-size: clamp(1rem, 2vw + 1rem, 2.5rem);
```

---

## 5. Checklist Tipográfico

- [ ] **Escala:** Os tamanhos seguem uma razão matemática?
- [ ] **Contraste:** Há diferença clara de peso entre h1, h2 e corpo?
- [ ] **Legibilidade:** O texto principal tem no máximo 75 caracteres por linha?
- [ ] **Acessibilidade:** O contraste de cor do texto atende ao WCAG?
