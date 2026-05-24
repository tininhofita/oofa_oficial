'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorPageProps {
  error:  Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[Oofa] Erro inesperado:', error)
  }, [error])

  return (
    <div className="error-page">
      <div className="error-page__content">
        <h1 className="title-md">Algo deu errado</h1>
        <p className="text-secondary" style={{ marginTop: '0.8rem' }}>
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <Button onClick={reset}>Tentar novamente</Button>
        </div>
      </div>
    </div>
  )
}
