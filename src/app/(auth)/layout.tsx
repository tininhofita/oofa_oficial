/**
 * Layout de autenticação — sem Sidebar e sem Header.
 * Usado apenas pela rota /login.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
