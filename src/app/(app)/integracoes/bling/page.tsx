import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/env'
import { MAPEAMENTO_RECURSO_BLING } from '@/lib/bling/types'
import type { RecursoBling } from '@/lib/bling/types'
import { PageContainer } from '@/components/layout/PageContainer'
import { Badge } from '@/components/ui/Badge'
import { BlingUrlCopiar } from './BlingUrlCopiar'
import './integracoes-bling.css'

interface BlingEvento {
  id: string
  recurso: string
  acao: string
  bling_id: number | null
  status: 'recebido' | 'processado' | 'erro'
  created_at: string
}

export default async function IntegracaoBlingPage() {
  const supabase = await createClient()

  const { data: eventos } = (await supabase
    .from('bling_eventos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)) as unknown as { data: BlingEvento[] | null }

  const urlWebhook = `${env.NEXT_PUBLIC_APP_URL}/api/bling/webhook`

  const credenciais = {
    webhookSecret: Boolean(env.BLING_WEBHOOK_SECRET),
    clientId: Boolean(env.BLING_CLIENT_ID),
    clientSecret: Boolean(env.BLING_CLIENT_SECRET),
  }

  return (
    <PageContainer titulo="Integração Bling">
      <div className="bling-integracao">

        <section className="bling-integracao__secao">
          <h2 className="bling-integracao__titulo-secao">Conexão</h2>
          <div className="bling-integracao__status-linha">
            <span>Status da integração</span>
            <Badge variante={credenciais.webhookSecret ? 'sucesso' : 'erro'}>
              {credenciais.webhookSecret ? 'Configurado' : 'Não configurado'}
            </Badge>
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
              <span>Notas Fiscais Eletrônicas → <code>bling_notas_fiscais</code></span>
            </li>
            <li>
              <Badge variante="info">consumer_invoice.*</Badge>
              <span>NFC-e → <code>bling_notas_fiscais_consumidor</code></span>
            </li>
          </ul>
        </section>

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
