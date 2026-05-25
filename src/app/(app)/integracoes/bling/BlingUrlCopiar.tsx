'use client'

import { useState } from 'react'

interface BlingUrlCopiarProps {
  url: string
}

export function BlingUrlCopiar({ url }: BlingUrlCopiarProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiarUrl() {
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="bling-url-copiar">
      <code className="bling-url-copiar__valor">{url}</code>
      <button
        type="button"
        onClick={copiarUrl}
        className="btn btn--secondary btn--sm bling-url-copiar__botao"
      >
        {copiado ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}
