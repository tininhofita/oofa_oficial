# Estratégia de SEO e Performance

> Guia para visibilidade orgânica, Core Web Vitals e indexação.

---

## 1. SEO Técnico (On-Page)

- **Semântica HTML:** Use `<h1>` único por página e hierarquia clara (`h2-h6`).
- **Meta Tags:** Títulos e descrições únicas e atraentes para cada página.
- **Open Graph:** Configure `og:image`, `og:title` e `og:description` para compartilhamento social.
- **URL Amigáveis:** Use slugs descritos e evite parâmetros excessivos.

---

## 2. Core Web Vitals (Performance)

- **LCP (Largest Contentful Paint):** Garanta que o conteúdo principal carregue em menos de 2.5s.
- **FID (First Input Delay):** Mantenha a interface interativa em menos de 100ms.
- **CLS (Cumulative Layout Shift):** Evite elementos saltando na tela (reserve espaço para imagens/anúncios).

---

## 3. SEO para Aplicações Modernas (Next.js)

- **SSR/SSG:** Renderize conteúdo crítico no servidor para melhor indexação.
- **JSON-LD:** Implemente Schema.org para resultados ricos (Rich Snippets).
- **Sitemap & Robots:** Mantenha um `sitemap.xml` dinâmico e `robots.txt` configurado.

---

## 4. Checklist SEO

- [ ] **Títulos:** Todas as páginas têm `<title>` e meta description?
- [ ] **Links:** Todos os links internos são funcionais e usam `<a>` semanticamente?
- [ ] **Imagens:** Todas as imagens têm atributo `alt` descritivo?
- [ ] **Performance:** O Lighthouse/PageSpeed está com pontuação acima de 90?
- [ ] **Mobile:** O site é 100% responsivo e passou no teste de mobile-friendly?
