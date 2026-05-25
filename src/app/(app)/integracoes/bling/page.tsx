import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { MAPEAMENTO_RECURSO_BLING } from '@/lib/bling/types'
import type { RecursoBling } from '@/lib/bling/types'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/Badge'
import { BlingUrlCopiar } from './BlingUrlCopiar'
import MapeamentoNaturezas from './MapeamentoNaturezas'
import './integracoes-bling.css'

interface BlingEvento {
  id: string
  recurso: string
  acao: string
  bling_id: number | null
  status: 'recebido' | 'processado' | 'erro'
  created_at: string
}

interface PageProps {
  searchParams: Promise<{ success?: string; error?: string }>
}

export default async function IntegracaoBlingPage({ searchParams }: PageProps) {
  const { success, error } = await searchParams
  const supabase = (await createClient()) as any

  // 1. Busca os últimos eventos recebidos via webhook
  const { data: eventos } = (await supabase
    .from('bling_eventos')
    .select('id, recurso, acao, bling_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(20)) as unknown as { data: BlingEvento[] | null }

  // 2. Busca o status atual da conexão OAuth no banco
  const { data: config, error: errConfig } = await supabase
    .from('integracao_bling')
    .select('access_token, expires_at')
    .limit(1)
    .maybeSingle()

  if (errConfig) {
    console.error('[Bling Config Page] Erro ao ler integracao_bling:', errConfig)
  }

  const apiConectada = Boolean(config?.access_token)

  const urlWebhook = env.BLING_WEBHOOK_SECRET
    ? `${env.NEXT_PUBLIC_APP_URL}/api/bling/webhook?token=${env.BLING_WEBHOOK_SECRET}`
    : `${env.NEXT_PUBLIC_APP_URL}/api/bling/webhook`

  const credenciais = {
    webhookSecret: Boolean(env.BLING_WEBHOOK_SECRET),
    clientId: Boolean(env.BLING_CLIENT_ID),
    clientSecret: Boolean(env.BLING_CLIENT_SECRET),
  }

  // 3. Busca todas as naturezas de operação cadastradas no banco
  const { data: naturezas, error: errNaturezas } = await supabase
    .from('naturezas_operacao')
    .select('id, descricao, nome_customizado, situacao, padrao')
    .order('descricao', { ascending: true })

  if (errNaturezas) {
    console.error('[Bling Config Page] Erro ao buscar naturezas_operacao:', errNaturezas)
  }

  return (
    <PageContainer titulo="Integração Bling">
      <div className="bling-integracao">
        
        {success && (
          <div className="bling-integracao__alerta bling-integracao__alerta--sucesso">
            Conexão com a API do Bling estabelecida com sucesso!
          </div>
        )}
        
        {error && (
          <div className="bling-integracao__alerta bling-integracao__alerta--erro">
            Erro ao conectar com o Bling: {decodeURIComponent(error)}
          </div>
        )}

        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Conexão</h2>
          <div className="bling-integracao__conexao-status">
            <div className="bling-integracao__status-linha">
              <span>Status do Webhook</span>
              <Badge variante={credenciais.webhookSecret ? 'sucesso' : 'erro'}>
                {credenciais.webhookSecret ? 'Configurado' : 'Não configurado'}
              </Badge>
            </div>
            <div className="bling-integracao__status-linha">
              <span>Status da API (OAuth2)</span>
              <Badge variante={apiConectada ? 'sucesso' : 'erro'}>
                {apiConectada ? 'Conectado' : 'Desconectado'}
              </Badge>
            </div>
          </div>

          <div className="bling-integracao__acao-conexao">
            {credenciais.clientId && credenciais.clientSecret ? (
              <a
                href={`https://www.bling.com.br/Api/v3/oauth/authorize?response_type=code&client_id=${env.BLING_CLIENT_ID}&state=oofa_bling_integration&redirect_uri=${encodeURIComponent(env.NEXT_PUBLIC_APP_URL + '/api/bling/callback')}`}
                className="bling-integracao__botao-conectar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="bling-integracao__botao-icone"
                >
                  <path d="M18 12V4H6v8a6 6 0 0 0 12 0Z" />
                  <path d="M12 18v4" />
                  <path d="M9 2v2" />
                  <path d="M15 2v2" />
                </svg>
                {apiConectada ? 'Re-conectar ao Bling ERP' : 'Conectar ao Bling ERP'}
              </a>
            ) : (
              <p className="bling-integracao__aviso-credenciais">
                Cadastre as chaves <code>BLING_CLIENT_ID</code> e <code>BLING_CLIENT_SECRET</code> no seu <code>.env.local</code> para habilitar a conexão da API.
              </p>
            )}
          </div>
        </section>

        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">URL do Webhook</h2>
          <p className="bling-integracao__descricao">
            Configure esta URL no painel do Bling em{' '}
            <strong>Configurações → Webhooks → Configuração de servidores</strong>.
            O token configurado deve coincidir com a variável{' '}
            <code>BLING_WEBHOOK_SECRET</code>.
          </p>
          <BlingUrlCopiar url={urlWebhook} />
        </section>

        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Credenciais</h2>
          <p className="bling-integracao__descricao">
            Configure em <code>.env.local</code> e reinicie o servidor.
          </p>
          <ul className="bling-integracao__credenciais-lista">
            <li className="bling-integracao__credencial-item">
              <code className="bling-integracao__credencial-nome">BLING_WEBHOOK_SECRET</code>
              <Badge variante={credenciais.webhookSecret ? 'sucesso' : 'erro'}>
                {credenciais.webhookSecret ? 'Configurado' : 'Obrigatório'}
              </Badge>
            </li>
            <li className="bling-integracao__credencial-item">
              <code className="bling-integracao__credencial-nome">BLING_CLIENT_ID</code>
              <Badge variante={credenciais.clientId ? 'sucesso' : 'aviso'}>
                {credenciais.clientId ? 'Configurado' : 'Opcional'}
              </Badge>
            </li>
            <li className="bling-integracao__credencial-item">
              <code className="bling-integracao__credencial-nome">BLING_CLIENT_SECRET</code>
              <Badge variante={credenciais.clientSecret ? 'sucesso' : 'aviso'}>
                {credenciais.clientSecret ? 'Configurado' : 'Opcional'}
              </Badge>
            </li>
          </ul>
        </section>

        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Eventos Monitorados</h2>
          <ul className="bling-integracao__eventos-mapeados">
            <li>
              <Badge variante="info">stock.*</Badge>
              <span>Atualizações de saldo de estoque → <code>bling_estoques</code></span>
            </li>
            <li>
              <Badge variante="info">order.*</Badge>
              <span>Pedidos de vendas → <code>bling_pedidos_vendas</code></span>
            </li>
            <li>
              <Badge variante="info">invoice.*</Badge>
              <span>Notas Fiscais Eletrônicas e NFC-e → <code>public.nfe</code></span>
            </li>
          </ul>
        </section>

        <MapeamentoNaturezas naturezasIniciais={(naturezas || []) as any} />

        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Últimos Eventos</h2>
          {eventos && eventos.length > 0 ? (
            <table className="bling-integracao__tabela">
              <thead>
                <tr>
                  <th>Recurso</th>
                  <th>Ação</th>
                  <th>ID no Bling</th>
                  <th>Status</th>
                  <th>Recebido em</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((evento) => (
                  <tr key={evento.id}>
                    <td>
                      {MAPEAMENTO_RECURSO_BLING[evento.recurso as RecursoBling] ?? evento.recurso}
                    </td>
                    <td>{evento.acao}</td>
                    <td>{evento.bling_id ?? '—'}</td>
                    <td>
                      <Badge
                        variante={
                          evento.status === 'processado'
                            ? 'sucesso'
                            : evento.status === 'erro'
                            ? 'erro'
                            : 'inativo'
                        }
                      >
                        {evento.status}
                      </Badge>
                    </td>
                    <td>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(evento.created_at))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="bling-integracao__sem-eventos">
              Nenhum evento recebido ainda. Configure o webhook no Bling para começar.
            </p>
          )}
        </section>

      </div>
    </PageContainer>
  )
}
