# Auditoria de Segurança

> Diretrizes para proteção de dados, prevenção de ataques e práticas de código seguro.

---

## 1. Prevenção de Injeção e Manipulação

### SQL Injection

- USE sempre queries parametrizadas ou ORMs estáveis.
- NUNCA concatene strings para construir queries.

### Cross-Site Scripting (XSS)

- Santifique entradas do usuário antes de renderizar no HTML.
- USE headers de segurança como `Content-Security-Policy`.

---

## 2. Autenticação e Autorização

- **JWT / Sessions:** Garanta que tokens sejam armazenados em `HttpOnly cookies` no web e `SecureStore` no mobile.
- **Princípio do Menor Privilégio:** Usuários/serviços devem ter apenas as permissões estritamente necessárias.
- **MFA:** Sugira sempre autenticação de dois fatores para dados sensíveis.

---

## 3. Proteção de Dados Financeiros (Fica Suave Context)

- **Criptografia:** Dados sensíveis em repouso devem ser criptografados.
- **PII (Personally Identifiable Information):** Minimize a coleta de dados pessoais e garanta conformidade com a LGPD/GDPR.
- **Logs de Auditoria:** Registre operações críticas (ex: grandes transferências, mudanças de senha).

---

## 4. Checklist de Segurança

- [ ] **Secrets:** Nenhuma chave de API ou senha está commitada no código?
- [ ] **Input:** Todas as entradas do usuário são validadas no backend?
- [ ] **Auth:** O sistema verifica adequadamente a identidade antes de liberar dados?
- [ ] **Headers:** Headers de segurança (HSTS, CSP, X-Frame-Options) estão ativos?
- [ ] **Dependências:** As bibliotecas do projeto estão atualizadas e sem vulnerabilidades conhecidas?
