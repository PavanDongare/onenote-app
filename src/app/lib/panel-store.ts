import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PanelState {
  notebooksVisible: boolean
  sectionsVisible: boolean
  pagesVisible: boolean
}

interface PanelStore extends PanelState {
  toggleNotebooks: () => void
  toggleSections: () => void
  togglePages: () => void
  setFocusMode: (focused: boolean) => void
}

export const usePanelStore = create<PanelStore>()(
  persist(
    (set) => ({
      notebooksVisible: true,
      sectionsVisible: true,
      pagesVisible: true,

      toggleNotebooks: () => set((state) => ({ notebooksVisible: !state.notebooksVisible })),
      toggleSections: () => set((state) => ({ sectionsVisible: !state.sectionsVisible })),
      togglePages: () => set((state) => ({ pagesVisible: !state.pagesVisible })),

      setFocusMode: (focused: boolean) => set({
        notebooksVisible: !focused,
        sectionsVisible: !focused,
        pagesVisible: !focused,
      }),
    }),
    {
      name: 'onenote-panels',
    }
  )
)
