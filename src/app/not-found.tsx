import Link from 'next/link'
import { ROUTES } from '@/constants/routes'

export default function NotFoundPage() {
  return (
    <div className="error-page">
      <div className="error-page__content">
        <p className="label" style={{ marginBottom: '0.8rem' }}>Erro 404</p>
        <h1 className="title-md">Página não encontrada</h1>
        <p className="text-secondary" style={{ marginTop: '0.8rem' }}>
          A página que você está procurando não existe ou foi movida.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <Link href={ROUTES.DASHBOARD} className="btn btn--primary">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
