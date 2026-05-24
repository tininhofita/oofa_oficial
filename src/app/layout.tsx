import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  'Oofa ERP',
    template: '%s | Oofa ERP',
  },
  description: 'Gestão inteligente para o seu e-commerce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
