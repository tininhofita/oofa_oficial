import { create } from 'zustand'

interface EstadoInterfaceUsuario {
  barraLateralRecolhida: boolean
  alternarBarraLateral: () => void
  definirBarraLateral: (recolhida: boolean) => void
}

/**
 * Store global do Zustand para controle de estados da interface do usuário (UI).
 * Segue estritamente a nomenclatura em Português do Brasil.
 */
export const useInterfaceUsuario = create<EstadoInterfaceUsuario>((set) => ({
  barraLateralRecolhida: false,
  alternarBarraLateral: () => set((state) => ({ barraLateralRecolhida: !state.barraLateralRecolhida })),
  definirBarraLateral: (recolhida) => set({ barraLateralRecolhida: recolhida }),
}))
