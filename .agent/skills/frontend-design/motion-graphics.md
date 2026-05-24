# Referência de Motion Graphics

> Técnicas avançadas de animação para experiências web premium - Lottie, GSAP, SVG, 3D, Partículas.

---

## 1. Lottie Animations

Animações vetoriais baseadas em JSON (After Effects).

- **Leves:** Menor que GIF/vídeo.
- **Escaláveis:** Sem perda de qualidade.
- **Interativas:** Podem reagir ao scroll ou cliques.
- **Uso:** Skeletons complexos, feedbacks de sucesso, ícones animados.

---

## 2. GSAP (GreenSock)

Ferramenta profissional para animações baseadas em linha do tempo (timeline).

- **ScrollTrigger:** Animações disparadas pelo scroll.
- **Sequenciamento:** Controle total sobre a ordem dos movimentos.
- **Uso:** Seções Heros complexas, revelações de página.

---

## 3. Animações SVG

- **Line Drawing:** Efeito de escrita/desenho usando `stroke-dashoffset`.
- **Morphing:** Transição suave entre formas de ícones (ex: hambúrguer ↔ X).

---

## 4. Transformações 3D (CSS)

Use `perspective` e `rotateX/Y` para criar profundidade.

- **Card Flip:** Revelação de informações no verso.
- **Tilt on Hover:** Cards que inclinam seguindo o mouse.

---

## 5. Checklist de Motion

- [ ] **Mobile:** O efeito funciona bem em dispositivos móveis?
- [ ] **Acessibilidade:** Oferece fallback para `prefers-reduced-motion`?
- [ ] **Performance:** As animações não bloqueiam a thread principal?
- [ ] **Contexto:** O efeito adiciona valor ou é apenas distração?
