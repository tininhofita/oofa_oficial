---
name: frontend-design
description: Pensamento de design e tomada de decisão para UI web. Use ao projetar componentes, layouts, esquemas de cores, tipografia ou criar interfaces estéticas. Ensina princípios, não valores fixos.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Sistema de Design Frontend

> **Filosofia:** Cada pixel tem um propósito. Restrição é luxo. A psicologia do usuário impulsiona as decisões.
> **Princípio Core:** PENSE, não memorize. PERGUNTE, não assuma.

---

## 🎯 Regra de Leitura Seletiva (MANDATÓRIO)

**Leia os arquivos OBRIGATÓRIOS sempre, OPCIONAIS apenas quando necessário:**

| Arquivo                                      | Status             | Quando Ler                         |
| -------------------------------------------- | ------------------ | ---------------------------------- |
| [ux-psychology.md](ux-psychology.md)         | 🔴 **OBRIGATÓRIO** | Sempre leia primeiro!              |
| [color-system.md](color-system.md)           | ⚪ Opcional        | Decisões de cor/paleta             |
| [typography-system.md](typography-system.md) | ⚪ Opcional        | Seleção/combinação de fontes       |
| [visual-effects.md](visual-effects.md)       | ⚪ Opcional        | Glassmorphism, sombras, gradientes |
| [animation-guide.md](animation-guide.md)     | ⚪ Opcional        | Necessidade de animação            |
| [motion-graphics.md](motion-graphics.md)     | ⚪ Opcional        | Lottie, GSAP, 3D                   |
| [decision-trees.md](decision-trees.md)       | ⚪ Opcional        | Templates de contexto              |

---

## 🔧 Scripts de Runtime

**Execute estes para auditorias (não leia, apenas execute):**

| Script                             | Propósito                                   | Uso                                                      |
| ---------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| `scripts/ux_audit.py`              | Auditoria de Psicologia UX e Acessibilidade | `python scripts/ux_audit.py <project_path>`              |
| `scripts/accessibility_checker.py` | Auditoria de Conformidade WCAG              | `python scripts/accessibility_checker.py <project_path>` |

---

## ⚠️ CRÍTICO: PERGUNTE ANTES DE ASSUMIR (MANDATÓRIO)

> **PARE! Se o pedido do usuário for aberto, NÃO use seus padrões favoritos.**

### Quando o Prompt for Vago, PERGUNTE:

**Cor não especificada?** Pergunte:

> "Qual paleta de cores você prefere? (azul/verde/laranja/neutro/outro?)"

**Estilo não especificado?** Pergunte:

> "Qual estilo você deseja? (minimalista/ousado/retrô/futurista/orgânico?)"

**Layout não especificado?** Pergunte:

> "Você tem preferência de layout? (coluna única/grid/assimétrico/largura total?)"

### ⛔ TENDÊNCIAS A EVITAR (ANTI-PADRÃO IA):

| Tendência Padrão IA               | Por que é Ruim               | Pense Diferente                                   |
| --------------------------------- | ---------------------------- | ------------------------------------------------- |
| **Bento Grids (Clichê)**          | Usado em todo design de IA   | Por que este conteúdo PRECISA de um grid?         |
| **Hero Split (Esquerda/Direita)** | Previsível e chato           | Que tal Tipografia Massiva ou Narrativa Vertical? |
| **Gradients Aurora/Mesh**         | A "nova" preguiça visual     | Qual seria uma combinação de cores radical?       |
| **Glassmorphism Genérico**        | A ideia de IA para "premium" | Que tal um flat sólido de alto contraste?         |
| **Azul Fintech / Ciano**          | Porto seguro do Purple Ban   | Por que não Vermelho, Preto ou Verde Neon?        |

> 🔴 **"Cada estrutura 'segura' que você escolhe te aproxima de um template genérico. CORRA RISCOS."**
