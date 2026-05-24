# Diretrizes de Desenvolvimento - Oofa

Este arquivo contém as instruções fundamentais que o agente IA deve seguir rigidamente.

## 🌍 Regras Globais e de Estilo

- **Idioma:** Sempre responder em **Português do Brasil**.
- **CSS:** Nunca usar CSS inline. Sempre criar arquivos `.css` separados (ex: `Componente.css`), exceto em templates de e-mail.
- **Commits:** Mandar o texto do commit no final do arquivo/conversa
- **Dados Sensíveis:** Jamais commitar chaves de API ou segredos. Usar exclusivamente variáveis de ambiente (`.env`).

## 💎 Identidade e UX

- **Moeda:** Valores financeiros devem ser sempre formatados para BRL usando `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
- **Acessibilidade:** Todo elemento interativo deve ter labels claros e suporte a teclado.

## 🛠️ Regras Técnicas (Next.js & Supabase)

- **Performance:** Priorizar **Server Components** para busca de dados. Usar `use client` apenas quando necessário.
- **Segurança (Supabase):** Toda nova tabela DEVE ter políticas de RLS (Row Level Security) configuradas.
- **Nunca abrir o navegador (browser) sem ser pedido**
- **Em formularios, vamos sempre salvar com a primeira letra maiuscula**

## 🎨 Design System (Tipografia)

Sempre utilizar as variáveis de escala abaixo para garantir consistência visual:

```css
/* Títulos */
--fs-title-xl: 3.32rem;
--fs-title-lg: 2.76rem;
--fs-title-md: 2.3rem;
--fs-title-sm: 1.92rem;

/* Textos */
--fs-text-lg: 1.92rem;
--fs-text-md: 1.6rem;
--fs-text-sm: 1.33rem;
--fs-text-xs: 1.11rem;

/* UI */
--fs-label: 0.92rem;
--fs-button: 1.33rem;
--fs-caption: 1.2rem;
--fs-input: 1.6rem;
```
