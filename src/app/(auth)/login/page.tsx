import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import "./Login.css";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <main className="login">
      {/* Painel de marca — visível apenas em telas maiores */}
      <aside className="login__brand" aria-hidden="true">
        <div className="login__brand-content">
          <span className="login__brand-logo">OOfa</span>
          <p className="login__brand-tagline">Gestão inteligente.</p>
        </div>
        <div className="login__brand-decoration login__brand-decoration--1" />
        <div className="login__brand-decoration login__brand-decoration--2" />
        <div className="login__brand-decoration login__brand-decoration--3" />
      </aside>

      {/* Painel do formulário */}
      <section className="login__form-side">
        {/* Logo mobile */}
        <span className="login__mobile-logo" aria-label="Oofa ERP">
          OOfa
        </span>

        <div className="login__form-container">
          <header className="login__form-header">
            <h1 className="login__form-title">Bem-vindo de volta</h1>
            <p className="login__form-subtitle">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </header>

          <LoginForm />
        </div>

        <footer className="login__footer">
          OOfa ERP &copy; {new Date().getFullYear()} - Desenvolvido por
          Safitamemo Produções.
        </footer>
      </section>
    </main>
  );
}
