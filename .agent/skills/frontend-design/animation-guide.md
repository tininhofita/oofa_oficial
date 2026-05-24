# Referência de Diretrizes de Animação

> Princípios de animação e psicologia do tempo - aprenda a decidir, não a copiar.
> **Sem durações fixas para memorizar - entenda o que afeta o tempo.**

---

## 1. Princípios de Duração

Fatores que determinam a velocidade:

- **Distância:** Maior viagem = maior duração.
- **Tamanho:** Elementos maiores = animações mais lentas.
- **Complexidade:** Mais complexo = mais tempo para processar.
- **Contexto:** Urgente = rápido; Luxuoso = lento e fluido.

---

## 2. Princípios de Easing (Suavização)

| Easing          | Melhor para        | Sensação                 |
| --------------- | ------------------ | ------------------------ |
| **Ease-out**    | Elementos entrando | Chegando, desacelerando. |
| **Ease-in**     | Elementos saindo   | Partindo, acelerando.    |
| **Ease-in-out** | Ênfase, loops      | Deliberado, suave.       |

---

## 3. Micro-interações

- **Feedback:** Confirme que a ação aconteceu (clique, hover).
- **Orientação:** Mostre o que é possível (hover nos cards).
- **Delight:** Pequenos momentos de alegria (sucesso ao enviar).

**Regra de Ouro:** Responda imediatamente (abaixo de 100ms para percepção).

---

## 4. Estados de Carregamento (Loading)

- **Skeletons:** Reduzem a percepção de espera ao mostrar o formato do layout.
- **Spinners:** Use apenas para operações curtas.
- **Progress Bars:** Essenciais para processos longos ou multi-etapas.

---

## 5. Checklist de Animação

- [ ] **Propósito:** Há um motivo (feedback/guia/alegria)?
- [ ] **Timing:** Não está muito lento/rápido?
- [ ] **Easing:** Usou ease-out para entrada e ease-in para saída?
- [ ] **Performance:** Anima apenas transform/opacity?
