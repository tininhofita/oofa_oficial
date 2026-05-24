# Design e Desenvolvimento Mobile

> Princípios de UX para o toque, performance em dispositivos móveis e padrões cross-platform.

---

## 1. UX para Dispositivos Móveis (Touch-first)

### Zona do Polegar (Thumb Zone)

- Coloque os elementos interativos mais importantes na parte inferior da tela.
- O topo da tela deve ser usado para exibição de informações, não para ações críticas frequentes.

### Alvos de Toque

- **Tamanho Mínimo:** 44x44px (iOS) ou 48x48dp (Android).
- **Espaçamento:** Garanta que botões próximos não causem cliques acidentais.

---

## 2. Performance e Bateria

### Listas Otimizadas

- NUNCA renderize listas longas em `ScrollView`.
- USE `FlatList`, `FlashList` (React Native) ou `ListView.builder` (Flutter).
- Implemente carregamento sob demanda (Infinite Scroll).

### Consumo de Recursos

- **Imagens:** Use versões otimizadas e redimensionadas para mobile (WebP).
- **Animações:** Use `useNativeDriver` no React Native ou animações implícitas no Flutter para garantir 60fps.

---

## 3. Capacidade Offline e Rede

- **Cache-First:** Mostre dados locais enquanto busca na rede.
- **Feedback de Conexão:** Informe o usuário se ele estiver offline.
- **Sincronização:** Garanta que ações feitas offline sejam enfileiradas e enviadas quando a rede retornar.

---

## 4. Checklist Mobile

- [ ] **Alvos de Toque:** Todos os botões têm pelo menos 44px de altura/largura?
- [ ] **Performance:** As listas estão usando componentes de virtualização?
- [ ] **Acessibilidade:** Os componentes têm `accessibilityLabel` ou `semantics`?
- [ ] **Feedback:** O app fornece feedback visual/háptico para ações?
- [ ] **Offline:** O app lida graciosamente com a falta de internet?
