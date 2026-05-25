'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface NaturezaOperacao {
  id: number
  descricao: string
  nome_customizado: string | null
  situacao: number | null
  padrao: boolean | null
}

interface MapeamentoNaturezasProps {
  naturezasIniciais: NaturezaOperacao[]
}

export default function MapeamentoNaturezas({ naturezasIniciais }: MapeamentoNaturezasProps) {
  const router = useRouter()
  const supabase = createClient() as any
  
  const [naturezas, setNaturezas] = useState<NaturezaOperacao[]>(naturezasIniciais)
  const [sincronizando, setSincronizando] = useState(false)
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null)
  const [tipoStatus, setTipoStatus] = useState<'sucesso' | 'erro' | null>(null)
  const [busca, setBusca] = useState('')
  const [idsSalvando, setIdsSalvando] = useState<Record<number, boolean>>({})

  // Sincroniza as naturezas de operacao puxando do Bling ERP
  const lidarComSincronizacao = async () => {
    setSincronizando(true)
    setMensagemStatus('Buscando naturezas de operacao ativas no Bling...')
    setTipoStatus(null)

    try {
      const resposta = await fetch('/api/bling/sync?tabela=naturezas', {
        method: 'POST',
      })

      const dados = await resposta.json()

      if (!resposta.ok) {
        throw new Error(dados.error || 'Falha inesperada ao sincronizar naturezas.')
      }

      const importados = dados.stats?.naturezas_importadas ?? 0
      setTipoStatus('sucesso')
      setMensagemStatus(`Sincronizacao concluida! ${importados} naturezas de operacao importadas/atualizadas.`)
      
      // Recarrega as naturezas atualizadas do banco do Supabase
      const { data: novasNaturezas, error: erroFetch } = await supabase
        .from('naturezas_operacao')
        .select('id, descricao, nome_customizado, situacao, padrao')
        .order('descricao', { ascending: true })

      if (!erroFetch && novasNaturezas) {
        setNaturezas(novasNaturezas as unknown as NaturezaOperacao[])
      }

      router.refresh()
    } catch (err: any) {
      console.error(err)
      setTipoStatus('erro')
      setMensagemStatus(`Erro ao sincronizar: ${err.message}`)
    } finally {
      setSincronizando(false)
    }
  }

  // Atualiza o nome customizado da natureza de operacao no Supabase
  const lidarComAlteracaoNome = async (id: number, novoNome: string) => {
    setIdsSalvando((anterior) => ({ ...anterior, [id]: true }))
    
    try {
      const { error } = await supabase
        .from('naturezas_operacao')
        .update({ nome_customizado: novoNome || null })
        .eq('id', id)

      if (error) throw error

      setNaturezas((anteriores) =>
        anteriores.map((n) => (n.id === id ? { ...n, nome_customizado: novoNome || null } : n))
      )
    } catch (err: any) {
      console.error('Erro ao atualizar nome customizado:', err)
      setTipoStatus('erro')
      setMensagemStatus(`Erro ao salvar nome da natureza ${id}: ${err.message}`)
    } finally {
      setIdsSalvando((anterior) => ({ ...anterior, [id]: false }))
    }
  }

  // Filtra as naturezas com base no termo de busca
  const naturezasFiltradas = naturezas.filter((n) => {
    const termo = busca.toLowerCase()
    return (
      n.id.toString().includes(termo) ||
      n.descricao.toLowerCase().includes(termo) ||
      (n.nome_customizado && n.nome_customizado.toLowerCase().includes(termo))
    )
  })

  return (
    <section className="bling-integracao__secao bling-naturezas">
      <div className="bling-naturezas__cabecalho">
        <div>
          <h2 className="bling-integracao__titulo-secao">Mapeamento de Naturezas de Operação</h2>
          <p className="bling-integracao__descricao">
            Mapeie o ID de cada natureza no Bling ERP com o nome amigável que deseja exibir em nosso ERP Oofa.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={lidarComSincronizacao}
          disabled={sincronizando}
          loading={sincronizando}
          className="bling-naturezas__botao-sinc"
        >
          Sincronizar do Bling
        </Button>
      </div>

      {mensagemStatus && (
        <div className={`bling-integracao__alerta ${tipoStatus === 'sucesso' ? 'bling-integracao__alerta--sucesso' : tipoStatus === 'erro' ? 'bling-integracao__alerta--erro' : 'bling-integracao__alerta--info'}`}>
          {mensagemStatus}
        </div>
      )}

      <div className="bling-naturezas__filtro">
        <input
          type="text"
          placeholder="Buscar por ID ou descrição da natureza..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="bling-naturezas__busca-input"
          disabled={sincronizando}
        />
      </div>

      {naturezasFiltradas.length > 0 ? (
        <div className="bling-naturezas__tabela-container">
          <table className="bling-integracao__tabela">
            <thead>
              <tr>
                <th>ID Bling</th>
                <th>Descrição Oficial Bling</th>
                <th>Nome Customizado no ERP Oofa</th>
                <th style={{ width: '120px' }}>Padrão</th>
              </tr>
            </thead>
            <tbody>
              {naturezasFiltradas.map((natureza) => (
                <tr key={natureza.id}>
                  <td className="bling-naturezas__id-col">{natureza.id}</td>
                  <td>
                    <div className="bling-naturezas__descricao-linha">
                      <span className="bling-naturezas__desc">{natureza.descricao}</span>
                    </div>
                  </td>
                  <td>
                    <div className="bling-naturezas__input-wrapper">
                      <input
                        type="text"
                        defaultValue={natureza.nome_customizado || ''}
                        placeholder={natureza.descricao}
                        onBlur={(e) => {
                          if (e.target.value !== (natureza.nome_customizado || '')) {
                            lidarComAlteracaoNome(natureza.id, e.target.value)
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement
                            target.blur()
                          }
                        }}
                        className="bling-naturezas__input"
                        disabled={sincronizando || idsSalvando[natureza.id]}
                      />
                      {idsSalvando[natureza.id] && (
                        <span className="bling-naturezas__input-loader"></span>
                      )}
                    </div>
                  </td>
                  <td>
                    {natureza.padrao ? (
                      <Badge variante="sucesso">Sim</Badge>
                    ) : (
                      <span className="bling-naturezas__padrao-nulo">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bling-integracao__sem-eventos">
          Nenhuma natureza de operacao encontrada. Clique em "Sincronizar do Bling" para carregar as naturezas cadastradas.
        </div>
      )}
    </section>
  )
}
