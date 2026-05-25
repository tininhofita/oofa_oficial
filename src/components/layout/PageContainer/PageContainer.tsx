import './PageContainer.css'

interface PageContainerProps {
  titulo: string
  children: React.ReactNode
}

export function PageContainer({ titulo, children }: PageContainerProps) {
  return (
    <div className="page-container">
      <header className="page-container__cabecalho">
        <h1 className="page-container__titulo">{titulo}</h1>
      </header>
      <main className="page-container__conteudo">
        {children}
      </main>
    </div>
  )
}
