'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import '../previsoes.css'

// Tipagens de dados em Português BR
interface LancamentoCusto {
  id: string
  data: string
  descricao: string
  tipo: 'Fixo' | 'Variável' | 'Investimento'
  canal: 'Geral' | 'E-commerce' | 'Shows'
  grupo: 'Administrativo' | 'Logística' | 'Merchan' | 'Pessoal' | 'Produtos'
  subgrupo:
    | 'Benefícios'
    | 'Embalagens'
    | 'Encargos'
    | 'Equipamento'
    | 'Estrutura'
    | 'Logística'
    | 'Marketing'
    | 'Organização'
    | 'Plataformas'
    | 'Pró-labore'
    | 'Produto Acabado'
    | 'Salário'
    | 'Transporte e Armazenagem'
    | 'Vendedor'
  quantidadePrevista: number
  quantidadeReal: number
  valorUnitarioPrevisto: number
  valorUnitarioReal: number
  naoOcorreu: boolean
}

/**
 * Página de Previsão de Custos (Painel Planejado vs. Realizado).
 * Conexão direta em tempo real para leitura, inserção e deleção autenticadas (RLS ativo) no Supabase.
 * Desenvolvido seguindo as diretrizes de Nomenclatura em Português BR.
 */
export default function PaginaPrevisoesCustos() {
  // Lista de lançamentos dinâmicos iniciada inteiramente vazia (dados reais do banco)
  const [lancamentos, definirLancamentos] = useState<LancamentoCusto[]>([])
  const [carregando, definirCarregando] = useState<boolean>(true)

  // Estados dos Filtros
  const [busca, definirBusca] = useState<string>('')
  const [filtroGrupo, definirFiltroGrupo] = useState<string>('')
  const [filtroSubgrupo, definirFiltroSubgrupo] = useState<string>('')
  const [filtroTipo, definirFiltroTipo] = useState<string>('')
  const [tipoPeriodo, definirTipoPeriodo] = useState<'mes' | 'custom'>('custom')
  const [filtroMesAno, definirFiltroMesAno] = useState<string>(() => {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  })
  const [dataInicio, definirDataInicio] = useState<string>(() => {
    return `${new Date().getFullYear()}-01-01`
  })
  const [dataFim, definirDataFim] = useState<string>(() => {
    return `${new Date().getFullYear()}-12-31`
  })

  // Estado de abertura do modal
  const [modalAberto, definirModalAberto] = useState<boolean>(false)
  const [lancamentoSendoEditado, definirLancamentoSendoEditado] = useState<LancamentoCusto | null>(null)

  // Estados dos campos do formulário no Modal
  const [formTipo, definirFormTipo] = useState<'Fixo' | 'Variável' | 'Investimento'>('Fixo')
  const [formCanal, definirFormCanal] = useState<'Geral' | 'E-commerce' | 'Shows'>('Geral')
  const [formGrupo, definirFormGrupo] = useState<'Administrativo' | 'Logística' | 'Merchan' | 'Pessoal' | 'Produtos'>('Administrativo')
  const [formSubgrupo, definirFormSubgrupo] = useState<
    | 'Benefícios'
    | 'Embalagens'
    | 'Encargos'
    | 'Equipamento'
    | 'Estrutura'
    | 'Logística'
    | 'Marketing'
    | 'Organização'
    | 'Plataformas'
    | 'Pró-labore'
    | 'Produto Acabado'
    | 'Salário'
    | 'Transporte e Armazenagem'
    | 'Vendedor'
  >('Benefícios')
  const [formDescricao, definirFormDescricao] = useState<string>('')
  const [formQuantidadePrevista, definirFormQuantidadePrevista] = useState<number>(1)
  const [formQuantidadeReal, definirFormQuantidadeReal] = useState<number>(1)
  const [usuarioMudouQuantidadeReal, definirUsuarioMudouQuantidadeReal] = useState<boolean>(false)
  const [formValorUnitarioPrevistoCentavos, definirFormValorUnitarioPrevistoCentavos] = useState<number>(0)
  const [formValorUnitarioRealCentavos, definirFormValorUnitarioRealCentavos] = useState<number>(0)
  const [formNaoOcorreu, definirFormNaoOcorreu] = useState<boolean>(false)
  const [formData, definirFormData] = useState<string>('')

  // Efeito para buscar os custos diretamente da tabela do Supabase
  const carregarCustos = async () => {
    try {
      definirCarregando(true)
      const supabase = createClient() as any

      const { data, error } = await supabase
        .from('custos')
        .select('*')
        .order('data_custo', { ascending: false })

      if (error) {
        console.error('Erro ao buscar custos:', error.message)
        alert('Erro ao carregar os custos cadastrados do banco de dados.')
        return
      }

      if (data) {
        // Mapeia o snake_case do banco para o camelCase da UI
        const custosMapeados: LancamentoCusto[] = data.map((item: any) => ({
          id: item.id,
          data: item.data_custo,
          descricao: item.descricao,
          tipo: item.tipo as any,
          canal: (item.canal || 'Geral') as any,
          grupo: item.grupo as any,
          subgrupo: (item.sub_grupo || 'Benefícios') as any,
          quantidadePrevista: Number(item.quantidade_prevista || 1),
          quantidadeReal: Number(item.quantidade_real || 1),
          valorUnitarioPrevisto: Number(item.valor_unitario_previsto || 0),
          valorUnitarioReal: Number(item.valor_unitario_real || 0),
          naoOcorreu: Boolean(item.nao_ocorreu)
        }))
        definirLancamentos(custosMapeados)
      }
    } catch (err) {
      console.error('Erro de conexão com o banco de dados:', err)
    } finally {
      definirCarregando(false)
    }
  }

  useEffect(() => {
    carregarCustos()
  }, [])

  // Efeito para preencher a data atual ao abrir o modal
  useEffect(() => {
    if (modalAberto) {
      const hoje = new Date()
      const ano = hoje.getFullYear()
      const mes = String(hoje.getMonth() + 1).padStart(2, '0')
      const dia = String(hoje.getDate()).padStart(2, '0')
      definirFormData(`${ano}-${mes}-${dia}`)
    }
  }, [modalAberto])

  // Formatação de moeda corrente (BRL)
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  // Formata o input monetário de centavos em tempo real
  const formatarValorInput = (centavos: number) => {
    const reais = centavos / 100
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Lida com a digitação do input monetário aplicando a máscara de centavos
  const lidarMudancaValorUnitarioPrevisto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '')
    const centavos = digitos ? parseInt(digitos, 10) : 0
    definirFormValorUnitarioPrevistoCentavos(centavos)
  }

  const lidarMudancaValorUnitarioReal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitos = e.target.value.replace(/\D/g, '')
    const centavos = digitos ? parseInt(digitos, 10) : 0
    definirFormValorUnitarioRealCentavos(centavos)
  }

  // Função para abrir o modal pré-preenchido com os dados do lançamento para edição
  const lidarEditarLancamento = (item: LancamentoCusto) => {
    definirLancamentoSendoEditado(item)
    definirFormTipo(item.tipo)
    definirFormCanal(item.canal)
    definirFormGrupo(item.grupo)
    definirFormSubgrupo(item.subgrupo)
    definirFormDescricao(item.descricao)
    definirFormQuantidadePrevista(item.quantidadePrevista)
    definirFormQuantidadeReal(item.quantidadeReal)
    definirUsuarioMudouQuantidadeReal(true) // no fluxo de edição, mantemos as quantidades livres
    definirFormValorUnitarioPrevistoCentavos(Math.round(item.valorUnitarioPrevisto * 100))
    definirFormValorUnitarioRealCentavos(Math.round(item.valorUnitarioReal * 100))
    definirFormNaoOcorreu(Boolean(item.naoOcorreu))
    definirFormData(item.data)
    definirModalAberto(true)
  }

  // Função para limpar o formulário e fechar o modal
  const fecharModal = () => {
    definirFormDescricao('')
    definirFormQuantidadePrevista(1)
    definirFormQuantidadeReal(1)
    definirUsuarioMudouQuantidadeReal(false)
    definirFormValorUnitarioPrevistoCentavos(0)
    definirFormValorUnitarioRealCentavos(0)
    definirFormNaoOcorreu(false)
    definirFormTipo('Fixo')
    definirFormCanal('Geral')
    definirFormGrupo('Administrativo')
    definirFormSubgrupo('Benefícios')
    definirLancamentoSendoEditado(null)
    definirModalAberto(false)
  }

  // Processamento do valor monetário real e cálculo dinâmico de totais do formulário
  const valorUnitarioPrevistoReal = formValorUnitarioPrevistoCentavos / 100
  const valorUnitarioRealReal = formValorUnitarioRealCentavos / 100

  const valorTotalPrevistoFormulario = formQuantidadePrevista * valorUnitarioPrevistoReal
  const valorTotalRealFormulario = formQuantidadeReal * valorUnitarioRealReal

  // Processo de filtragem reativo
  const lancamentosFiltrados = lancamentos.filter((item) => {
    // 1. Busca Geral (por descrição, grupo, subgrupo ou tipo)
    if (busca.trim() !== '') {
      const buscaNormalizada = busca.toLowerCase()
      const correspondeBusca =
        item.descricao.toLowerCase().includes(buscaNormalizada) ||
        item.grupo.toLowerCase().includes(buscaNormalizada) ||
        item.subgrupo.toLowerCase().includes(buscaNormalizada) ||
        item.tipo.toLowerCase().includes(buscaNormalizada)

      if (!correspondeBusca) return false
    }

    // 2. Filtro de Grupo
    if (filtroGrupo !== '' && item.grupo !== filtroGrupo) {
      return false
    }

    // 3. Filtro de Subgrupo
    if (filtroSubgrupo !== '' && item.subgrupo !== filtroSubgrupo) {
      return false
    }

    // 4. Filtro de Tipo
    if (filtroTipo !== '' && item.tipo !== filtroTipo) {
      return false
    }

    // 5. Filtro de Período (Mês ou Customizado)
    if (tipoPeriodo === 'mes' && filtroMesAno !== '') {
      if (!item.data.startsWith(filtroMesAno)) {
        return false
      }
    } else if (tipoPeriodo === 'custom') {
      if (dataInicio !== '' && item.data < dataInicio) {
        return false
      }
      if (dataFim !== '' && item.data > dataFim) {
        return false
      }
    }

    return true
  })

  // --- CÁLCULOS DOS CARDS DE PLANEJADO VS. REALIZADO ---
  const custoPrevistoTotal = lancamentosFiltrados.reduce((acumulado, item) => acumulado + item.quantidadePrevista * item.valorUnitarioPrevisto, 0)
  const custoRealTotal = lancamentosFiltrados.reduce((acumulado, item) => acumulado + item.quantidadeReal * item.valorUnitarioReal, 0)
  const desvioTotal = custoRealTotal - custoPrevistoTotal
  const porcentagemDesvio = custoPrevistoTotal > 0 ? (desvioTotal / custoPrevistoTotal) * 100 : 0

  // Lógica de Registro e Atualização de lançamento no Supabase
  const lidarRegistrarCusto = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formDescricao.trim()) {
      alert('Por favor, informe uma descrição para o custo.')
      return
    }

    if (formValorUnitarioPrevistoCentavos <= 0 && formValorUnitarioRealCentavos <= 0) {
      alert('Por favor, informe um valor previsto ou um valor real maior que zero.')
      return
    }

    try {
      const supabase = createClient() as any
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('Sessão expirada. Por favor, faça login novamente.')
        return
      }

      // Prepara o objeto com a convenção de banco de dados (snake_case)
      const dadosCustoBanco = {
        user_id: user.id,
        grupo: formGrupo,
        sub_grupo: formSubgrupo,
        tipo: formTipo,
        descricao: formDescricao,
        canal: formCanal,
        quantidade_prevista: formQuantidadePrevista,
        quantidade_real: formNaoOcorreu ? 0 : formQuantidadeReal,
        valor_unitario_previsto: valorUnitarioPrevistoReal, // planejado
        valor_unitario_real: formNaoOcorreu ? 0 : valorUnitarioRealReal, // acontecido (zerado se não ocorreu)
        nao_ocorreu: formNaoOcorreu,
        data_custo: formData
      }

      if (lancamentoSendoEditado) {
        // UPDATE no Supabase
        const { data, error } = await supabase
          .from('custos')
          .update(dadosCustoBanco)
          .eq('id', lancamentoSendoEditado.id)
          .select()
          .single()

        if (error) {
          console.error('Erro ao atualizar custo no Supabase:', error.message)
          alert(`Erro ao atualizar no banco de dados: ${error.message}`)
          return
        }

        if (data) {
          const custoEditadoMapeado: LancamentoCusto = {
            id: data.id,
            data: data.data_custo,
            descricao: data.descricao,
            tipo: data.tipo as any,
            canal: (data.canal || 'Geral') as any,
            grupo: data.grupo as any,
            subgrupo: (data.sub_grupo || 'Benefícios') as any,
            quantidadePrevista: Number(data.quantidade_prevista || 1),
            quantidadeReal: Number(data.quantidade_real || 1),
            valorUnitarioPrevisto: Number(data.valor_unitario_previsto || 0),
            valorUnitarioReal: Number(data.valor_unitario_real || 0),
            naoOcorreu: Boolean(data.nao_ocorreu)
          }

          definirLancamentos((anteriores) =>
            anteriores.map((item) => (item.id === lancamentoSendoEditado.id ? custoEditadoMapeado : item))
          )
        }
      } else {
        // INSERT no Supabase
        const { data, error } = await supabase
          .from('custos')
          .insert([dadosCustoBanco])
          .select()
          .single()

        if (error) {
          console.error('Erro ao registrar custo no Supabase:', error.message)
          alert(`Erro ao salvar no banco de dados: ${error.message}`)
          return
        }

        if (data) {
          const novoCustoMapeado: LancamentoCusto = {
            id: data.id,
            data: data.data_custo,
            descricao: data.descricao,
            tipo: data.tipo as any,
            canal: (data.canal || 'Geral') as any,
            grupo: data.grupo as any,
            subgrupo: (data.sub_grupo || 'Benefícios') as any,
            quantidadePrevista: Number(data.quantidade_prevista || 1),
            quantidadeReal: Number(data.quantidade_real || 1),
            valorUnitarioPrevisto: Number(data.valor_unitario_previsto || 0),
            valorUnitarioReal: Number(data.valor_unitario_real || 0),
            naoOcorreu: Boolean(data.nao_ocorreu)
          }

          definirLancamentos((anteriores) => [novoCustoMapeado, ...anteriores])
        }
      }

      fecharModal()
    } catch (err) {
      console.error('Erro ao salvar custo:', err)
      alert('Erro de conexão ao registrar ou atualizar o lançamento.')
    }
  }

  // Lógica de exclusão autenticada no Supabase
  const lidarExcluirLancamento = async (id: string) => {
    if (confirm('Deseja realmente excluir este lançamento permanentemente do banco de dados?')) {
      try {
        const supabase = createClient() as any

        const { error } = await supabase
          .from('custos')
          .delete()
          .eq('id', id)

        if (error) {
          console.error('Erro ao excluir custo no Supabase:', error.message)
          alert(`Erro ao excluir do banco de dados: ${error.message}`)
          return
        }

        // Atualiza a UI se excluiu com sucesso
        definirLancamentos((anteriores) => anteriores.filter((item) => item.id !== id))
      } catch (err) {
        console.error('Erro de conexão ao excluir custo:', err)
        alert('Erro ao processar exclusão no banco de dados.')
      }
    }
  }

  // --- AGREGAÇÕES COMPARATIVAS PARA OS 3 GRÁFICOS (PREVISTO E REAL) ---

  // 1. Agrupamento por Grupo
  const custoPorGrupoPrevisto: Record<string, number> = {}
  const custoPorGrupoReal: Record<string, number> = {}
  lancamentosFiltrados.forEach((item) => {
    const totalPrevisto = item.quantidadePrevista * item.valorUnitarioPrevisto
    const totalReal = item.quantidadeReal * item.valorUnitarioReal
    custoPorGrupoPrevisto[item.grupo] = (custoPorGrupoPrevisto[item.grupo] || 0) + totalPrevisto
    custoPorGrupoReal[item.grupo] = (custoPorGrupoReal[item.grupo] || 0) + totalReal
  })
  const maiorCustoGrupo = Math.max(...Object.values(custoPorGrupoPrevisto), ...Object.values(custoPorGrupoReal), 0)

  // 2. Agrupamento por Subgrupo (Top 5 ativos)
  const custoPorSubgrupoPrevisto: Record<string, number> = {}
  const custoPorSubgrupoReal: Record<string, number> = {}
  lancamentosFiltrados.forEach((item) => {
    const totalPrevisto = item.quantidadePrevista * item.valorUnitarioPrevisto
    const totalReal = item.quantidadeReal * item.valorUnitarioReal
    custoPorSubgrupoPrevisto[item.subgrupo] = (custoPorSubgrupoPrevisto[item.subgrupo] || 0) + totalPrevisto
    custoPorSubgrupoReal[item.subgrupo] = (custoPorSubgrupoReal[item.subgrupo] || 0) + totalReal
  })
  // Coleta as categorias que têm valores e ordena pelo real/previsto máximo
  const todasSubcategorias = Array.from(new Set([...Object.keys(custoPorSubgrupoPrevisto), ...Object.keys(custoPorSubgrupoReal)]))
  const subgruposOrdenados = todasSubcategorias
    .map((sub) => ({ sub, max: Math.max(custoPorSubgrupoPrevisto[sub] || 0, custoPorSubgrupoReal[sub] || 0) }))
    .sort((a, b) => b.max - a.max)
    .slice(0, 5)
    .map((x) => x.sub)
  const maiorCustoSubgrupo = Math.max(...Object.values(custoPorSubgrupoPrevisto), ...Object.values(custoPorSubgrupoReal), 0)

  // 3. Agrupamento por Tipo
  const custoPorTipoPrevisto: Record<string, number> = {}
  const custoPorTipoReal: Record<string, number> = {}
  lancamentosFiltrados.forEach((item) => {
    const totalPrevisto = item.quantidadePrevista * item.valorUnitarioPrevisto
    const totalReal = item.quantidadeReal * item.valorUnitarioReal
    custoPorTipoPrevisto[item.tipo] = (custoPorTipoPrevisto[item.tipo] || 0) + totalPrevisto
    custoPorTipoReal[item.tipo] = (custoPorTipoReal[item.tipo] || 0) + totalReal
  })
  const maiorCustoTipo = Math.max(...Object.values(custoPorTipoPrevisto), ...Object.values(custoPorTipoReal), 0)

  // Formatar a data de AAAA-MM-DD para DD/MM/AAAA na tabela
  const formatarDataTabela = (dataStr: string) => {
    const partes = dataStr.split('-')
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`
    }
    return dataStr
  }

  return (
    <div className="pagina-previsoes">
      {/* Cabeçalho */}
      <header className="pagina-previsoes__cabecalho">
        <div className="pagina-previsoes__titulo-grupo">
          <h1 className="pagina-previsoes__titulo">Previsão de Custos</h1>
          <p className="pagina-previsoes__subtitulo">
            Acompanhamento comparativo de despesas Planejadas (Previstas) e Realizadas (Acontecidas) com o Supabase.
          </p>
        </div>
        <div className="pagina-previsoes__acoes">
          <button
            type="button"
            className="pagina-previsoes__botao"
            onClick={carregarCustos}
            disabled={carregando}
            title="Recarregar dados"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={carregando ? 'girar-lento' : ''}>
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Sincronizar Banco
          </button>
          <button
            type="button"
            className="pagina-previsoes__botao pagina-previsoes__botao--primario"
            onClick={() => definirModalAberto(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo Lançamento
          </button>
        </div>
      </header>

      {/* Seção de Filtros Avançados */}
      <section className="painel-filtros">
        {/* Campo de Busca Geral */}
        <div className="painel-filtros__grupo painel-filtros__busca">
          <label htmlFor="busca-geral" className="painel-filtros__label">Busca Geral</label>
          <input
            id="busca-geral"
            type="text"
            placeholder="Buscar por descrição, grupo, subgrupo ou tipo..."
            value={busca}
            onChange={(e) => definirBusca(e.target.value)}
            className="painel-filtros__input"
          />
        </div>

        {/* Filtro por Grupo */}
        <div className="painel-filtros__grupo">
          <label htmlFor="filtro-grupo" className="painel-filtros__label">Grupo</label>
          <select
            id="filtro-grupo"
            value={filtroGrupo}
            onChange={(e) => definirFiltroGrupo(e.target.value)}
            className="painel-filtros__input"
          >
            <option value="">Todos</option>
            <option value="Administrativo">Administrativo</option>
            <option value="Logística">Logística</option>
            <option value="Merchan">Merchan</option>
            <option value="Pessoal">Pessoal</option>
            <option value="Produtos">Produtos</option>
          </select>
        </div>

        {/* Filtro por Subgrupo */}
        <div className="painel-filtros__grupo">
          <label htmlFor="filtro-subgrupo" className="painel-filtros__label">Subgrupo</label>
          <select
            id="filtro-subgrupo"
            value={filtroSubgrupo}
            onChange={(e) => definirFiltroSubgrupo(e.target.value)}
            className="painel-filtros__input"
          >
            <option value="">Todos</option>
            <option value="Benefícios">Benefícios</option>
            <option value="Embalagens">Embalagens</option>
            <option value="Encargos">Encargos</option>
            <option value="Equipamento">Equipamento</option>
            <option value="Estrutura">Estrutura</option>
            <option value="Logística">Logística</option>
            <option value="Marketing">Marketing</option>
            <option value="Organização">Organização</option>
            <option value="Plataformas">Plataformas</option>
            <option value="Pró-labore">Pró-labore</option>
            <option value="Produto Acabado">Produto Acabado</option>
            <option value="Salário">Salário</option>
            <option value="Transporte e Armazenagem">Transporte e Armazenagem</option>
            <option value="Vendedor">Vendedor</option>
          </select>
        </div>

        {/* Filtro por Tipo */}
        <div className="painel-filtros__grupo">
          <label htmlFor="filtro-tipo" className="painel-filtros__label">Tipo</label>
          <select
            id="filtro-tipo"
            value={filtroTipo}
            onChange={(e) => definirFiltroTipo(e.target.value)}
            className="painel-filtros__input"
          >
            <option value="">Todos</option>
            <option value="Fixo">Fixo</option>
            <option value="Variável">Variável</option>
            <option value="Investimento">Investimento</option>
          </select>
        </div>

        {/* Filtro de Período / Data */}
        <div className="painel-filtros__grupo" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <span className="painel-filtros__label">Período</span>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                <input
                  type="radio"
                  name="tipoPeriodo"
                  checked={tipoPeriodo === 'mes'}
                  onChange={() => definirTipoPeriodo('mes')}
                />
                Mês/Ano
              </label>
              <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
                <input
                  type="radio"
                  name="tipoPeriodo"
                  checked={tipoPeriodo === 'custom'}
                  onChange={() => definirTipoPeriodo('custom')}
                />
                Customizado
              </label>
            </div>
          </div>

          {tipoPeriodo === 'mes' ? (
            <input
              type="month"
              value={filtroMesAno}
              onChange={(e) => definirFiltroMesAno(e.target.value)}
              className="painel-filtros__input"
              style={{ width: '100%' }}
            />
          ) : (
            <div className="painel-filtros__input-periodo-grupo">
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => definirDataInicio(e.target.value)}
                className="painel-filtros__input"
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => definirDataFim(e.target.value)}
                className="painel-filtros__input"
              />
            </div>
          )}
        </div>
      </section>

      {/* Lógica de Renderização Condicional do Estado de Carregamento */}
      {carregando ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '340px',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-8)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            className="spinner-carregando"
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--color-gray-200)',
              borderTopColor: 'var(--color-primary)',
              borderRadius: '50%',
              animation: 'girar 1s linear infinite'
            }}
          />
          <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
            Buscando lançamentos no Supabase Database...
          </span>
          <style>{`
            @keyframes girar {
              to { transform: rotate(360deg); }
            }
            .girar-lento {
              animation: girar 2s linear infinite;
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* Duplos Cards de KPIs de Orçamentos (Previsto e Real) */}
          <section className="pagina-previsoes__grid-metricas">
            {/* Card 1: Previsto */}
            <div className="card-metrica" style={{ borderLeft: '4px solid var(--color-primary)' }}>
              <div className="card-metrica__cabecalho">
                <span className="card-metrica__titulo">Custo Previsto (Planejado)</span>
                <div className="card-metrica__icone-wrapper">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
              <p className="card-metrica__valor">{formatarMoeda(custoPrevistoTotal)}</p>
              <div className="card-metrica__diferenca">
                <span className="card-metrica__diferenca-texto">
                  Planejamento orçamentário anual
                </span>
              </div>
            </div>

            {/* Card 2: Real */}
            <div className="card-metrica" style={{ borderLeft: '4px solid var(--color-danger)' }}>
              <div className="card-metrica__cabecalho">
                <span className="card-metrica__titulo">Custo Real (Realizado)</span>
                <div className="card-metrica__icone-wrapper card-metrica__icone-wrapper--amarelo">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
              </div>
              <p className="card-metrica__valor">{formatarMoeda(custoRealTotal)}</p>
              <div className="card-metrica__diferenca">
                <span className="card-metrica__diferenca-texto">
                  Total de gastos que efetivamente ocorreram
                </span>
              </div>
            </div>

            {/* Card 3: Desvio */}
            <div className="card-metrica" style={{ borderLeft: `4px solid ${desvioTotal <= 0 ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
              <div className="card-metrica__cabecalho">
                <span className="card-metrica__titulo">Desvio Financeiro</span>
                <div className={`card-metrica__icone-wrapper ${desvioTotal <= 0 ? 'card-metrica__icone-wrapper--verde' : 'card-metrica__icone-wrapper--amarelo'}`}>
                  {desvioTotal <= 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                      <polyline points="17 18 23 18 23 12" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="card-metrica__valor">{formatarMoeda(Math.abs(desvioTotal))}</p>
              <div className="card-metrica__diferenca">
                <span className={`card-metrica__diferenca ${desvioTotal <= 0 ? 'card-metrica__diferenca--positiva' : 'card-metrica__diferenca--negativa'}`}>
                  {desvioTotal <= 0 ? '↓' : '↑'} {Math.abs(porcentagemDesvio).toFixed(1)}%
                </span>
                <span className="card-metrica__diferenca-texto">
                  {desvioTotal <= 0 ? 'abaixo do planejado (economia)' : 'acima do planejado (excedente)'}
                </span>
              </div>
            </div>
          </section>

          {/* Seção com os Três Gráficos de Distribuição Duplos */}
          <section className="secao-graficos">
            {/* Gráfico 1: Por Grupo */}
            <div className="bloco-visualizacao">
              <h2 className="bloco-visualizacao__titulo">
                Custos por Grupo
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>Planejado vs. Real</span>
              </h2>
              <div className="grafico-horizontal">
                {Object.keys(custoPorGrupoPrevisto).length > 0 || Object.keys(custoPorGrupoReal).length > 0 ? (
                  Array.from(new Set([...Object.keys(custoPorGrupoPrevisto), ...Object.keys(custoPorGrupoReal)]))
                    .map((grupo) => ({
                      grupo,
                      previsto: custoPorGrupoPrevisto[grupo] || 0,
                      real: custoPorGrupoReal[grupo] || 0
                    }))
                    .sort((a, b) => b.real - a.real)
                    .map(({ grupo, previsto, real }) => {
                      const percentualPrevisto = maiorCustoGrupo > 0 ? `${(previsto / maiorCustoGrupo) * 100}%` : '0%'
                      const percentualReal = maiorCustoGrupo > 0 ? `${(real / maiorCustoGrupo) * 100}%` : '0%'
                      return (
                        <div key={grupo} className="grafico-horizontal__item">
                          <div className="grafico-horizontal__topo">
                            <span className="grafico-horizontal__label">{grupo}</span>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                              <span style={{ color: 'var(--color-text-secondary)' }}>P: {formatarMoeda(previsto)}</span>
                              <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>R: {formatarMoeda(real)}</span>
                            </div>
                          </div>
                          <div className="grafico-horizontal__barra-fundo" style={{ height: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px 0' }}>
                            {/* Barra Real */}
                            <div
                              className="grafico-horizontal__barra-preenchimento"
                              style={{ width: percentualReal, height: '4px', background: 'linear-gradient(90deg, var(--color-brand-mid), var(--color-primary))' }}
                            />
                            {/* Barra Prevista */}
                            <div
                              className="grafico-horizontal__barra-preenchimento"
                              style={{ width: percentualPrevisto, height: '4px', background: 'var(--color-gray-300)' }}
                            />
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="grafico-horizontal__aviso-vazio">Nenhum custo registrado neste filtro.</div>
                )}
              </div>
            </div>

            {/* Gráfico 2: Por Subgrupo */}
            <div className="bloco-visualizacao">
              <h2 className="bloco-visualizacao__titulo">
                Custos por Subgrupo
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>Top 5: Planejado vs. Real</span>
              </h2>
              <div className="grafico-horizontal">
                {subgruposOrdenados.length > 0 ? (
                  subgruposOrdenados.map((subgrupo) => {
                    const previsto = custoPorSubgrupoPrevisto[subgrupo] || 0
                    const real = custoPorSubgrupoReal[subgrupo] || 0
                    const percentualPrevisto = maiorCustoSubgrupo > 0 ? `${(previsto / maiorCustoSubgrupo) * 100}%` : '0%'
                    const percentualReal = maiorCustoSubgrupo > 0 ? `${(real / maiorCustoSubgrupo) * 100}%` : '0%'
                    return (
                      <div key={subgrupo} className="grafico-horizontal__item">
                        <div className="grafico-horizontal__topo">
                          <span className="grafico-horizontal__label">{subgrupo}</span>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>P: {formatarMoeda(previsto)}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>R: {formatarMoeda(real)}</span>
                          </div>
                        </div>
                        <div className="grafico-horizontal__barra-fundo" style={{ height: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px 0' }}>
                          {/* Barra Real */}
                          <div
                            className="grafico-horizontal__barra-preenchimento"
                            style={{ width: percentualReal, height: '4px', background: 'linear-gradient(90deg, var(--color-brand-mid), var(--color-primary))' }}
                          />
                          {/* Barra Prevista */}
                          <div
                            className="grafico-horizontal__barra-preenchimento"
                            style={{ width: percentualPrevisto, height: '4px', background: 'var(--color-gray-300)' }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="grafico-horizontal__aviso-vazio">Nenhum custo registrado neste filtro.</div>
                )}
              </div>
            </div>

            {/* Gráfico 3: Por Tipo */}
            <div className="bloco-visualizacao">
              <h2 className="bloco-visualizacao__titulo">
                Custos por Tipo
                <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>Planejado vs. Real</span>
              </h2>
              <div className="grafico-horizontal">
                {Object.keys(custoPorTipoPrevisto).length > 0 || Object.keys(custoPorTipoReal).length > 0 ? (
                  Array.from(new Set([...Object.keys(custoPorTipoPrevisto), ...Object.keys(custoPorTipoReal)]))
                    .map((tipo) => ({
                      tipo,
                      previsto: custoPorTipoPrevisto[tipo] || 0,
                      real: custoPorTipoReal[tipo] || 0
                    }))
                    .sort((a, b) => b.real - a.real)
                    .map(({ tipo, previsto, real }) => {
                      const percentualPrevisto = maiorCustoTipo > 0 ? `${(previsto / maiorCustoTipo) * 100}%` : '0%'
                      const percentualReal = maiorCustoTipo > 0 ? `${(real / maiorCustoTipo) * 100}%` : '0%'

                      const corReal =
                        tipo === 'Fixo'
                          ? 'linear-gradient(90deg, var(--color-gray-700), var(--color-gray-900))'
                          : tipo === 'Variável'
                          ? 'linear-gradient(90deg, var(--color-primary), #818cf8)'
                          : 'linear-gradient(90deg, var(--color-success), #4ade80)'

                      return (
                        <div key={tipo} className="grafico-horizontal__item">
                          <div className="grafico-horizontal__topo">
                            <span className="grafico-horizontal__label">{tipo}</span>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '10px' }}>
                              <span style={{ color: 'var(--color-text-secondary)' }}>P: {formatarMoeda(previsto)}</span>
                              <span style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>R: {formatarMoeda(real)}</span>
                            </div>
                          </div>
                          <div className="grafico-horizontal__barra-fundo" style={{ height: '14px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px', padding: '2px 0' }}>
                            {/* Barra Real */}
                            <div
                              className="grafico-horizontal__barra-preenchimento"
                              style={{ width: percentualReal, height: '4px', background: corReal }}
                            />
                            {/* Barra Prevista */}
                            <div
                              className="grafico-horizontal__barra-preenchimento"
                              style={{ width: percentualPrevisto, height: '4px', background: 'var(--color-gray-300)' }}
                            />
                          </div>
                        </div>
                      )
                    })
                ) : (
                  <div className="grafico-horizontal__aviso-vazio">Nenhum custo registrado neste filtro.</div>
                )}
              </div>
            </div>
          </section>

          {/* Tabela de Detalhamento Comparativa de Custos (Previsto vs. Real) */}
          <section className="bloco-visualizacao">
            <h2 className="bloco-visualizacao__titulo">
              Detalhamento de Custos (Planejado vs. Realizado)
              <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-text-secondary)' }}>
                Exibindo {lancamentosFiltrados.length} custo(s) ativo(s)
              </span>
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabela-previsoes">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Grupo / Descrição</th>
                    <th>Tipo</th>
                    <th style={{ textAlign: 'center' }}>Qtde</th>
                    <th style={{ textAlign: 'right' }}>Previsto (Un. / Total)</th>
                    <th style={{ textAlign: 'right' }}>Real (Un. / Total)</th>
                    <th style={{ textAlign: 'center', width: '90px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lancamentosFiltrados.length > 0 ? (
                    lancamentosFiltrados.map((item) => {
                      const totalPrevisto = item.quantidadePrevista * item.valorUnitarioPrevisto
                      const totalReal = item.quantidadeReal * item.valorUnitarioReal
                      const cancelado = item.naoOcorreu
                      const pendente = item.valorUnitarioReal === 0 && !cancelado
                      const naoPrevisto = item.valorUnitarioPrevisto === 0

                      return (
                        <tr key={item.id} className={cancelado ? 'tabela-previsoes__linha-cancelada' : ''}>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatarDataTabela(item.data)}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-primary)' }}>
                                {item.grupo}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                {item.descricao} ({item.subgrupo})
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge-status ${
                                item.tipo === 'Fixo'
                                  ? 'badge-status--verde'
                                  : item.tipo === 'Variável'
                                  ? 'badge-status--amarelo'
                                  : 'badge-status--vermelho'
                              }`}
                            >
                              {item.tipo}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                              <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--color-text-primary)' }} title="Quantidade Prevista">
                                P: {item.quantidadePrevista}
                              </span>
                              <span style={{ fontSize: '11px', color: cancelado ? 'var(--color-danger)' : 'var(--color-primary)', fontWeight: 'bold' }} title="Quantidade Real">
                                {cancelado ? 'R: 0' : `R: ${item.quantidadeReal}`}
                              </span>
                            </div>
                          </td>
                          
                          {/* Coluna Previsto */}
                          <td style={{ textAlign: 'right' }}>
                            {naoPrevisto ? (
                              <span style={{ color: 'var(--color-text-disabled)', fontSize: '12px', fontStyle: 'italic' }}>
                                Não Previsto
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--color-text-primary)' }}>
                                  {formatarMoeda(totalPrevisto)}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                                  {item.quantidadePrevista} un x {formatarMoeda(item.valorUnitarioPrevisto)}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Coluna Real */}
                          <td style={{ textAlign: 'right' }}>
                            {cancelado ? (
                              <span className="badge-status badge-status--cancelado">
                                Não Ocorrido
                              </span>
                            ) : pendente ? (
                              <span className="badge-status" style={{ backgroundColor: 'var(--color-gray-100)', color: 'var(--color-gray-500)', fontSize: '11px', fontWeight: 'bold' }}>
                                Pendente
                              </span>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 'var(--fw-bold)', color: 'var(--color-primary)' }}>
                                  {formatarMoeda(totalReal)}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                                  {item.quantidadeReal} un x {formatarMoeda(item.valorUnitarioReal)}
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Coluna Ações */}
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => lidarEditarLancamento(item)}
                                className="tabela-previsoes__botao-editar"
                                title="Editar Custo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => lidarExcluirLancamento(item.id)}
                                className="tabela-previsoes__botao-excluir"
                                title="Excluir Custo"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-secondary)' }}>
                        Nenhum custo cadastrado encontrado no banco de dados para os filtros ativos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ============================================================
         MODAL DE CADASTRO / EDIÇÃO (PLANEJADO VS. REALIZADO)
         ============================================================ */}
      {modalAberto && (
        <div className="modal-lancamento__backdrop" onClick={fecharModal}>
          <div className="modal-lancamento__conteudo" onClick={(e) => e.stopPropagation()}>
            {/* Cabeçalho do Modal */}
            <header className="modal-lancamento__cabecalho">
              <h2 className="modal-lancamento__titulo">
                {lancamentoSendoEditado ? 'Editar Lançamento de Custo' : 'Novo Lançamento de Custo'}
              </h2>
              <button
                type="button"
                className="modal-lancamento__fechar"
                onClick={fecharModal}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            {/* Form do Modal */}
            <form onSubmit={lidarRegistrarCusto} className="modal-lancamento__form">
              {/* Grid 1: Tipo e Canal */}
              <div className="modal-lancamento__grid">
                <div className="painel-filtros__grupo">
                  <label htmlFor="form-tipo" className="painel-filtros__label">Tipo *</label>
                  <select
                    id="form-tipo"
                    value={formTipo}
                    onChange={(e) => definirFormTipo(e.target.value as any)}
                    className="painel-filtros__input"
                  >
                    <option value="Fixo">Fixo</option>
                    <option value="Variável">Variável</option>
                    <option value="Investimento">Investimento</option>
                  </select>
                </div>

                <div className="painel-filtros__grupo">
                  <label htmlFor="form-canal" className="painel-filtros__label">Canal *</label>
                  <select
                    id="form-canal"
                    value={formCanal}
                    onChange={(e) => definirFormCanal(e.target.value as any)}
                    className="painel-filtros__input"
                  >
                    <option value="Geral">Geral</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="Shows">Shows</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Grupo e Subgrupo */}
              <div className="modal-lancamento__grid">
                <div className="painel-filtros__grupo">
                  <label htmlFor="form-grupo" className="painel-filtros__label">Grupo *</label>
                  <select
                    id="form-grupo"
                    value={formGrupo}
                    onChange={(e) => definirFormGrupo(e.target.value as any)}
                    className="painel-filtros__input"
                  >
                    <option value="Administrativo">Administrativo</option>
                    <option value="Logística">Logística</option>
                    <option value="Merchan">Merchan</option>
                    <option value="Pessoal">Pessoal</option>
                    <option value="Produtos">Produtos</option>
                  </select>
                </div>

                <div className="painel-filtros__grupo">
                  <label htmlFor="form-subgrupo" className="painel-filtros__label">Subgrupo *</label>
                  <select
                    id="form-subgrupo"
                    value={formSubgrupo}
                    onChange={(e) => definirFormSubgrupo(e.target.value as any)}
                    className="painel-filtros__input"
                  >
                    <option value="Benefícios">Benefícios</option>
                    <option value="Embalagens">Embalagens</option>
                    <option value="Encargos">Encargos</option>
                    <option value="Equipamento">Equipamento</option>
                    <option value="Estrutura">Estrutura</option>
                    <option value="Logística">Logística</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Organização">Organização</option>
                    <option value="Plataformas">Plataformas</option>
                    <option value="Pró-labore">Pró-labore</option>
                    <option value="Produto Acabado">Produto Acabado</option>
                    <option value="Salário">Salário</option>
                    <option value="Transporte e Armazenagem">Transporte e Armazenagem</option>
                    <option value="Vendedor">Vendedor</option>
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div className="painel-filtros__grupo">
                <label htmlFor="form-descricao" className="painel-filtros__label">Descrição *</label>
                <input
                  id="form-descricao"
                  type="text"
                  placeholder="Ex: Compra de bobinas para impressão"
                  value={formDescricao}
                  onChange={(e) => {
                    const texto = e.target.value
                    const formatado = texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : ''
                    definirFormDescricao(formatado)
                  }}
                  className="painel-filtros__input"
                  required
                />
              </div>

              {/* Grid 3: Quantidade Prevista e Real */}
              <div className="modal-lancamento__grid">
                <div className="painel-filtros__grupo">
                  <label htmlFor="form-quantidade-prevista" className="painel-filtros__label">Quantidade Prevista (Planejada) *</label>
                  <input
                    id="form-quantidade-prevista"
                    type="number"
                    min="1"
                    value={formQuantidadePrevista}
                    onChange={(e) => {
                      const valor = Math.max(1, parseInt(e.target.value, 10) || 1)
                      definirFormQuantidadePrevista(valor)
                      if (!usuarioMudouQuantidadeReal && !formNaoOcorreu) {
                        definirFormQuantidadeReal(valor)
                      }
                    }}
                    className="painel-filtros__input"
                    required
                  />
                </div>

                <div className="painel-filtros__grupo">
                  <label htmlFor="form-quantidade-real" className="painel-filtros__label">Quantidade Real (Comprada) *</label>
                  <input
                    id="form-quantidade-real"
                    type="number"
                    min="0"
                    disabled={formNaoOcorreu}
                    value={formNaoOcorreu ? 0 : formQuantidadeReal}
                    onChange={(e) => {
                      definirFormQuantidadeReal(Math.max(0, parseInt(e.target.value, 10) || 0))
                      definirUsuarioMudouQuantidadeReal(true)
                    }}
                    className="painel-filtros__input"
                    required
                    style={{
                      backgroundColor: formNaoOcorreu ? 'var(--color-gray-100)' : 'var(--color-surface)',
                      cursor: formNaoOcorreu ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>

              {/* Grid 4: Preços Unitários Comparativos */}
              <div className="modal-lancamento__grid">
                <div className="painel-filtros__grupo">
                  <label htmlFor="form-valor-unitario-previsto" className="painel-filtros__label">Valor Unitário Previsto (Planejado)</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 'var(--space-3)', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>R$</span>
                    <input
                      id="form-valor-unitario-previsto"
                      type="text"
                      placeholder="0,00"
                      value={formatarValorInput(formValorUnitarioPrevistoCentavos)}
                      onChange={lidarMudancaValorUnitarioPrevisto}
                      className="painel-filtros__input"
                      style={{ paddingLeft: '32px', width: '100%', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <div className="painel-filtros__grupo">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label htmlFor="form-valor-unitario-real" className="painel-filtros__label">Valor Unitário Real (Acontecido)</label>
                    <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--color-danger)', fontWeight: 'bold', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={formNaoOcorreu}
                        onChange={(e) => {
                          const marcado = e.target.checked
                          definirFormNaoOcorreu(marcado)
                          if (marcado) {
                            definirFormValorUnitarioRealCentavos(0)
                            definirFormQuantidadeReal(0)
                          } else {
                            definirFormQuantidadeReal(formQuantidadePrevista)
                          }
                        }}
                      />
                      Não Ocorrido
                    </label>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: 'var(--space-3)', fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>R$</span>
                    <input
                      id="form-valor-unitario-real"
                      type="text"
                      placeholder="0,00"
                      value={formNaoOcorreu ? '0,00' : formatarValorInput(formValorUnitarioRealCentavos)}
                      onChange={lidarMudancaValorUnitarioReal}
                      disabled={formNaoOcorreu}
                      className="painel-filtros__input"
                      style={{ 
                        paddingLeft: '32px', 
                        width: '100%', 
                        fontWeight: 'bold', 
                        color: formNaoOcorreu ? 'var(--color-text-disabled)' : 'var(--color-primary)',
                        backgroundColor: formNaoOcorreu ? 'var(--color-gray-100)' : 'var(--color-surface)',
                        cursor: formNaoOcorreu ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Data do Lançamento */}
              <div className="painel-filtros__grupo">
                <label htmlFor="form-data" className="painel-filtros__label">Data do Lançamento *</label>
                <input
                  id="form-data"
                  type="date"
                  value={formData}
                  onChange={(e) => definirFormData(e.target.value)}
                  className="painel-filtros__input"
                  required
                  style={{ maxWidth: '280px' }}
                />
              </div>

              {/* Grid 4: Totais Calculados Previstos e Reais */}
              <div className="modal-lancamento__grid">
                <div className="painel-filtros__grupo">
                  <span className="painel-filtros__label" style={{ color: 'var(--color-text-secondary)' }}>Total Previsto Calculado</span>
                  <div style={{ height: '38px', display: 'flex', alignItems: 'center', fontSize: '16px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                    {formatarMoeda(valorTotalPrevistoFormulario)}
                  </div>
                </div>

                <div className="painel-filtros__grupo">
                  <span className="painel-filtros__label" style={{ color: 'var(--color-text-secondary)' }}>Total Real Calculado</span>
                  <div style={{ height: '38px', display: 'flex', alignItems: 'center', fontSize: '18px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {formatarMoeda(valorTotalRealFormulario)}
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <footer className="modal-lancamento__rodape">
                <button
                  type="button"
                  className="pagina-previsoes__botao"
                  onClick={fecharModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pagina-previsoes__botao pagina-previsoes__botao--primario"
                >
                  {lancamentoSendoEditado ? 'Salvar Alterações' : 'Registrar Custo'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
