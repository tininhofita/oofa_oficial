import './Badge.css'

type BadgeVariante = 'sucesso' | 'erro' | 'aviso' | 'inativo' | 'info'

interface BadgeProps {
  variante?: BadgeVariante
  children: React.ReactNode
}

export function Badge({ variante = 'inativo', children }: BadgeProps) {
  return (
    <span className={`badge badge--${variante}`}>
      {children}
    </span>
  )
}
