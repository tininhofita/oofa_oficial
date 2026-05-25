import './PageContainer.css'

interface PageContainerProps {
  titulo: string
  children: React.ReactNode
}

export function PageContainer({ titulo, children }: PageContainerProps) {
  return (
    <div className="page-container">
      <div className="page-container__cabecalho">
        <h2 className="page-container__titulo">{titulo}</h2>
      </div>
      <div className="page-container__conteudo">
        {children}
      </div>
    </div>
  )
}
