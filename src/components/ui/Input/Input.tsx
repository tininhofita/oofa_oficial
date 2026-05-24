'use client'

import { useState } from 'react'
import './Input.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  helper?:   string
  required?: boolean
}

/**
 * Campo de input padrão com label, estado de erro e helper text.
 * Para senha, use type="password" — o botão de mostrar/ocultar é automático.
 *
 * @example
 * <Input label="E-mail" type="email" error={errors.email} required />
 * <Input label="Senha"  type="password" />
 */
export function Input({
  label,
  error,
  helper,
  required,
  className = '',
  id,
  type,
  ...props
}: InputProps) {
  const [senhaVisivel, setSenhaVisivel] = useState(false)

  const inputId    = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const isSenha    = type === 'password'
  const inputType  = isSenha && senhaVisivel ? 'text' : type

  const inputClasses = [
    'form-input',
    error ? 'form-input--error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="form-field">
      {label && (
        <label
          htmlFor={inputId}
          className={`form-label${required ? ' form-label--required' : ''}`}
        >
          {label}
        </label>
      )}

      <div className={isSenha ? 'form-input-wrapper' : undefined}>
        <input
          id={inputId}
          type={inputType}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          required={required}
          {...props}
        />

        {isSenha && (
          <button
            type="button"
            className="form-input-action"
            onClick={() => setSenhaVisivel((v) => !v)}
            aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {senhaVisivel ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <span id={`${inputId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}

      {helper && !error && (
        <span className="form-helper">{helper}</span>
      )}
    </div>
  )
}
