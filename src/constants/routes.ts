/**
 * Rotas da aplicação — use sempre estas constantes.
 * Nunca use strings hardcoded para navegação.
 *
 * @example
 * import { ROUTES } from '@/constants/routes'
 * redirect(ROUTES.DASHBOARD)
 * <Link href={ROUTES.USUARIOS}>Usuários</Link>
 */
export const ROUTES = {
  // Autenticação
  LOGIN: '/login',

  // App
  DASHBOARD:     '/dashboard',
  USUARIOS:      '/usuarios',
  PRODUTOS:      '/produtos',
  PEDIDOS:       '/pedidos',
  FINANCEIRO:    '/financeiro',
  CONTAS_PAGAR:  '/financeiro/contas-pagar',
  CONTAS_RECEBER:'/financeiro/contas-receber',
  ESTOQUE:       '/estoque',
  MOVIMENTACOES: '/estoque/movimentacoes',
  CLIENTES:      '/clientes',
  RELATORIOS:    '/relatorios',
  INTEGRACOES:   '/integracoes',
  CONFIGURACOES: '/configuracoes',
  PERFIL:        '/perfil',

  // API
  API: {
    BLING_SYNC:         '/api/bling/sync',
    BLING_WEBHOOK:      '/api/bling/webhook',
    NUVEMSHOP_SYNC:     '/api/nuvemshop/sync',
    NUVEMSHOP_WEBHOOK:  '/api/nuvemshop/webhook',
    CRON_SYNC:          '/api/cron/sync',
  },
} as const

/** Rotas dinâmicas */
export const ROUTE_PARAMS = {
  usuario:  (id: string) => `/usuarios/${id}`,
  produto:  (id: string) => `/produtos/${id}`,
  pedido:   (id: string) => `/pedidos/${id}`,
  cliente:  (id: string) => `/clientes/${id}`,
} as const
