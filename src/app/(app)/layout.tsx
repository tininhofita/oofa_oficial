/**
 * Layout principal do app — inclui Sidebar e Header.
 * Todas as páginas protegidas usam este layout.
 * Sidebar e Header serão implementados em src/components/layout/
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-layout">
      {/* TODO: <Sidebar /> */}
      <div className="app-layout__main">
        {/* TODO: <Header /> */}
        <main className="app-layout__content">
          {children}
        </main>
      </div>
    </div>
  )
}
