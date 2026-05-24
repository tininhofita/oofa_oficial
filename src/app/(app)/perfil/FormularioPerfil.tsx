'use client'

import { useActionState, useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { atualizarPerfil } from './acoes'
import './Perfil.css'

interface PerfilUsuario {
  full_name: string
  email: string
  role: 'admin' | 'gerente' | 'operador'
  avatar_url: string | null
}

interface PropriedadesFormularioPerfil {
  perfilInicial: PerfilUsuario
}

/**
 * Componente cliente do Formulário de Perfil do ERP.
 * Segue estritamente a convenção de nomenclatura em Português do Brasil.
 */
export function FormularioPerfil({ perfilInicial }: PropriedadesFormularioPerfil) {
  const [estado, acaoFormulario, pendente] = useActionState(atualizarPerfil, {
    sucesso: false,
    erro: null,
  })

  // Estados locais para controle de campos e preview interativo em tempo real
  const [nomeCompleto, setNomeCompleto] = useState(perfilInicial.full_name)
  const [urlAvatar, setUrlAvatar] = useState(perfilInicial.avatar_url || '')

  // Tradução do cargo do usuário para exibição amigável
  const cargoTraduzido = perfilInicial.role === 'admin'
    ? 'Administrador'
    : perfilInicial.role === 'gerente'
    ? 'Gerente'
    : perfilInicial.role === 'operador'
    ? 'Operador'
    : 'Colaborador'

  // Gera as iniciais do nome para o avatar em caso de ausência de imagem válida
  const iniciaisNome = nomeCompleto
    ? nomeCompleto
        .split(' ')
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join('')
    : 'U'

  return (
    <div className="pagina-perfil__card-conteudo">
      {/* Coluna Esquerda: Cartão de Apresentação e Avatar */}
      <aside className="perfil-avatar-secao">
        <div className="perfil-avatar-secao__wrapper">
          {urlAvatar ? (
            <img
              src={urlAvatar}
              alt={`Foto de ${nomeCompleto}`}
              className="perfil-avatar-secao__imagem"
            />
          ) : (
            <div className="perfil-avatar-secao__sem-imagem" aria-hidden="true">
              {iniciaisNome}
            </div>
          )}
        </div>
        <div className="perfil-avatar-secao__info">
          <h2 className="perfil-avatar-secao__nome">{nomeCompleto || 'Usuário'}</h2>
          <p className="perfil-avatar-secao__email">{perfilInicial.email}</p>
        </div>
        <div className="perfil-avatar-secao__status">
          <span className="badge-status badge-status--ativo">Conta Ativa</span>
        </div>
      </aside>

      {/* Coluna Direita: Formulário Completo de Configuração */}
      <section className="perfil-formulario-secao">
        <div style={{ padding: 'var(--space-6)' }}>
          <form action={acaoFormulario} className="perfil-formulario" noValidate>
            
            {/* Mensagem de Feedback de Sucesso */}
            {estado.sucesso && (
              <div className="alerta alerta--sucesso" role="alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="alerta__icone">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <div className="alerta__conteudo">
                  <strong className="alerta__titulo">Alterações salvas!</strong>
                  <span className="alerta__mensagem">Seu perfil foi atualizado com sucesso no sistema Oofa.</span>
                </div>
              </div>
            )}

            {/* Mensagem de Feedback de Erro */}
            {estado.erro && (
              <div className="alerta alerta--perigo" role="alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="alerta__icone">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div className="alerta__conteudo">
                  <strong className="alerta__titulo">Ocorreu um problema</strong>
                  <span className="alerta__mensagem">{estado.erro}</span>
                </div>
              </div>
            )}

            <div className="perfil-formulario__grade-campos">
              {/* Nome Completo */}
              <div className="perfil-formulario__grade-campos--inteira">
                <Input
                  label="Nome Completo"
                  name="nomeCompleto"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              {/* E-mail de Acesso (Somente Leitura) */}
              <div className="input-readonly">
                <Input
                  label="E-mail de Acesso"
                  value={perfilInicial.email}
                  disabled
                  helper="O e-mail é gerido na autenticação e não pode ser alterado."
                />
              </div>

              {/* Cargo / Role (Somente Leitura) */}
              <div className="input-readonly">
                <Input
                  label="Cargo no ERP"
                  value={cargoTraduzido}
                  disabled
                  helper="Seu nível de permissão no sistema Oofa."
                />
              </div>

              {/* URL do Avatar */}
              <div className="perfil-formulario__grade-campos--inteira">
                <Input
                  label="URL da Imagem do Avatar"
                  name="urlAvatar"
                  value={urlAvatar}
                  onChange={(e) => setUrlAvatar(e.target.value)}
                  placeholder="https://exemplo.com/sua-foto.jpg"
                  helper="Forneça uma URL pública de imagem para atualizar sua foto de perfil."
                />
              </div>
            </div>

            <div className="perfil-formulario__aviso">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Por questões de segurança e integridade das políticas de controle de acessos, alterações de e-mail e cargo devem ser solicitadas diretamente ao administrador de TI do sistema.</span>
            </div>

            {/* Grupo de Botões e Submissão */}
            <div className="perfil-formulario__grupo-botoes">
              <Button
                type="submit"
                variant="primary"
                loading={pendente}
                className="perfil-formulario__botao-enviar"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
