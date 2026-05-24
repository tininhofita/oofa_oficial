# Referência de Efeitos Visuais

> Princípios e técnicas modernas de efeitos CSS - entenda os conceitos, crie variações.
> **Sem valores fixos - entenda os padrões.**

---

## 1. Princípios do Glassmorphism

Propriedades Chave:

1. **Fundo Semitransparente:** Use `rgba` com opacidade baixa.
2. **Backdrop Blur:** O efeito de "vidro fosco" (`backdrop-filter: blur(12px)`).
3. **Borda Sutil:** Define os limites do vidro (ex: `1px solid rgba(255,255,255,0.1)`).

> ⚠️ **AVISO:** Glassmorphism azul/branco padrão é clichê. Use variações escuras ou coloridas.

---

## 2. Hierarquia de Sombras (Elevação)

Sombras indicam a distância da superfície:

- **Nível 1:** Sombra sutil (Cards leves, botões secundários).
- **Nível 2:** Sombra média (Cards principais, dropdowns).
- **Nível 3:** Sombra forte (Modais, elementos flutuantes).

**Regras para Sombras Naturais:**

- Offset Y maior que X (a luz geralmente vem de cima).
- Opacidade baixa (5-15% para sombras sutis).
- Múltiplas camadas criam realismo.

---

## 3. Princípios de Gradientes

- **Análogos:** Use cores adjacentes no círculo cromático para harmonia.
- **Mesh Gradients:** Múltiplos gradientes radiais sobrepostos para um efeito orgânico e colorido (ideal para Heros).
- **Cuidado:** Evite gradientes "sujos" (cinzas no meio). Adicione pontos de parada para suavizar.

---

## 4. Performance e Aceleração GPU

As propriedades "baratas" para animar são:

- **transform:** (translate, scale, rotate).
- **opacity:** 0 a 1.

Evite animar: width, height, margin, padding, top, left. Isso causa "reflow" e trava a interface.

---

## 5. Checklist de Efeitos

- [ ] **Propósito:** O efeito serve a um objetivo ou é apenas decorativo?
- [ ] **Legibilidade:** O brilho ou sombra atrapalha a leitura?
- [ ] **Performance:** Estou animando apenas `transform` e `opacity`?
- [ ] **Acessibilidade:** Respeita a preferência de `prefers-reduced-motion`?
