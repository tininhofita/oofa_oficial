'use client'

import './Button.css'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  fullWidth?: boolean
  loading?:  boolean
  children:  React.ReactNode
}

/**
 * Botão padrão do sistema.
 * Use sempre este componente — nunca escreva <button> diretamente nas páginas.
 *
 * @example
 * <Button variant="primary" onClick={handleSalvar}>Salvar</Button>
 * <Button variant="danger" loading={deleting}>Excluir</Button>
 */
export function Button({
  variant   = 'primary',
  size      = 'md',
  fullWidth = false,
  loading   = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size !== 'md' ? `btn--${size}` : '',
    fullWidth ? 'btn--full' : '',
    loading   ? 'btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  )
}
