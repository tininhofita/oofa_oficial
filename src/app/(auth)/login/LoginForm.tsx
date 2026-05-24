'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { loginAction } from './actions'

/* ----------------------------------------------------------
   Botão de submit — usa useFormStatus para mostrar loading
---------------------------------------------------------- */
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      variant="primary"
      fullWidth
      loading={pending}
      className="login__submit"
    >
      Entrar
    </Button>
  )
}

/* ----------------------------------------------------------
   Formulário principal
---------------------------------------------------------- */
export function LoginForm() {
  const [state, action] = useActionState(loginAction, { error: null })

  return (
    <form action={action} className="login__form" noValidate>
      <Input
        label="E-mail"
        name="email"
        type="email"
        placeholder="seu@email.com"
        autoComplete="email"
        required
      />

      <Input
        label="Senha"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {state.error && (
        <div className="alert alert--danger" role="alert">
          <svg className="alert__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />
    </form>
  )
}
