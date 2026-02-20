import { create } from 'zustand'
import type { Notebook, Section, Page } from '../types'
import {
  getNotebooks,
  createNotebook as createNotebookQuery,
  updateNotebook as updateNotebookQuery,
  deleteNotebook as deleteNotebookQuery,
  reorderNotebooks as reorderNotebooksQuery,
} from './queries/notebooks'
import {
  getSections,
  createSection as createSectionQuery,
  deleteSection as deleteSectionQuery,
  reorderSections as reorderSectionsQuery,
} from './queries/sections'
import {
  getPages,
  getPage,
  createPage as createPageQuery,
  updatePageContent as updatePageContentQuery,
  updatePageTitle as updatePageTitleQuery,
  deletePage as deletePageQuery,
  reorderPages as reorderPagesQuery,
} from './queries/pages'

interface NotesStore {
  // Tenant context
  tenantId: string | null
  userId: string | null

  // Current selections
  currentNotebookId: string | null
  currentSectionId: string | null
  currentPageId: string | null

  // Data
  notebooks: Notebook[]
  sections: Section[]
  pages: Page[]
  currentPage: Page | null

  // Loading states
  isLoadingNotebooks: boolean
  isLoadingSections: boolean
  isLoadingPages: boolean
  isLoadingPage: boolean

  // Actions
  setContext: (tenantId: string, userId: string) => void
  initialize: () => Promise<void>
  setCurrentNotebook: (id: string) => Promise<void>
  setCurrentSection: (id: string) => Promise<void>
  setCurrentPage: (id: string) => Promise<void>
  loadNotebooks: () => Promise<void>
  loadSections: (notebookId: string) => Promise<void>
  loadPages: (sectionId: string) => Promise<void>
  loadPageContent: (pageId: string) => Promise<void>
  createNotebook: (title?: string, color?: string) => Promise<Notebook | undefined>
  createSection: (notebookId: string, title?: string, color?: string) => Promise<Section>
  createPage: (sectionId: string, title?: string) => Promise<Page>
  updatePageContent: (pageId: string, content: string) => Promise<void>
  updatePageTitle: (pageId: string, title: string) => Promise<void>
  deleteNotebook: (id: string) => Promise<void>
  deleteSection: (id: string) => Promise<void>
  deletePage: (id: string) => Promise<void>
  reorderNotebooks: (activeId: string, overId: string) => Promise<void>
  reorderSections: (activeId: string, overId: string) => Promise<void>
  reorderPages: (activeId: string, overId: string) => Promise<void>
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  tenantId: null,
  userId: null,
  currentNotebookId: null,
  currentSectionId: null,
  currentPageId: null,
  notebooks: [],
  sections: [],
  pages: [],
  currentPage: null,
  isLoadingNotebooks: false,
  isLoadingSections: false,
  isLoadingPages: false,
  isLoadingPage: false,

  setContext: (tenantId: string, userId: string) => {
    set({ tenantId, userId })
  },

  initialize: async () => {
    await get().loadNotebooks()
    const { notebooks } = get()
    if (notebooks.length > 0) {
      await get().setCurrentNotebook(notebooks[0].id)
    }
  },

  loadNotebooks: async () => {
    const { tenantId } = get()
    if (!tenantId) return

    set({ isLoadingNotebooks: true })
    try {
      const notebooks = await getNotebooks(tenantId)
      set({ notebooks })
    } catch (error) {
      console.error('Failed to load notebooks:', error)
    } finally {
      set({ isLoadingNotebooks: false })
    }
  },

  loadSections: async (notebookId: string) => {
    set({ isLoadingSections: true })
    try {
      const sections = await getSections(notebookId)
      set({ sections })
    } catch (error) {
      console.error('Failed to load sections:', error)
    } finally {
      set({ isLoadingSections: false })
    }
  },

  loadPages: async (sectionId: string) => {
    set({ isLoadingPages: true })
    try {
      const pages = await getPages(sectionId)
      set({ pages })
    } catch (error) {
      console.error('Failed to load pages:', error)
    } finally {
      set({ isLoadingPages: false })
    }
  },

  loadPageContent: async (pageId: string) => {
    set({ isLoadingPage: true })
    try {
      const page = await getPage(pageId)
      set({ currentPage: page })
    } catch (error) {
      console.error('Failed to load page:', error)
    } finally {
      set({ isLoadingPage: false })
    }
  },

  setCurrentNotebook: async (id: string) => {
    set({ currentNotebookId: id })
    await get().loadSections(id)
    const { sections } = get()
    if (sections.length > 0) {
      await get().setCurrentSection(sections[0].id)
    } else {
      set({ currentSectionId: null, pages: [], currentPageId: null, currentPage: null })
    }
  },

  setCurrentSection: async (id: string) => {
    set({ currentSectionId: id })
    await get().loadPages(id)
    const { pages } = get()
    if (pages.length > 0) {
      await get().setCurrentPage(pages[0].id)
    } else {
      set({ currentPageId: null, currentPage: null })
    }
  },

  setCurrentPage: async (id: string) => {
    set({ currentPageId: id })
    await get().loadPageContent(id)
  },

  createNotebook: async (title?: string, color?: string) => {
    const { tenantId, userId } = get()
    if (!tenantId || !userId) return undefined

    // Create notebook
    const notebook = await createNotebookQuery(tenantId, userId, title, color)
    await get().loadNotebooks()

    // Create default section
    const section = await createSectionQuery(notebook.id)

    // Create default page in that section
    await createPageQuery(section.id)

    // Select the notebook (will cascade to section/page)
    await get().setCurrentNotebook(notebook.id)
    return notebook
  },

  createSection: async (notebookId: string, title?: string, color?: string) => {
    const section = await createSectionQuery(notebookId, title, color)
    await get().loadSections(notebookId)
    await get().setCurrentSection(section.id)
    return section
  },

  createPage: async (sectionId: string, title?: string) => {
    const page = await createPageQuery(sectionId, title)
    await get().loadPages(sectionId)
    await get().setCurrentPage(page.id)
    return page
  },

  updatePageContent: async (pageId: string, content: string) => {
    await updatePageContentQuery(pageId, content)
    const { currentPage } = get()
    if (currentPage && currentPage.id === pageId) {
      set({ currentPage: { ...currentPage, content } })
    }
  },

  updatePageTitle: async (pageId: string, title: string) => {
    await updatePageTitleQuery(pageId, title)
    const { currentPage, pages } = get()
    if (currentPage && currentPage.id === pageId) {
      set({ currentPage: { ...currentPage, title } })
    }
    set({ pages: pages.map(p => p.id === pageId ? { ...p, title } : p) })
  },

  deleteNotebook: async (id: string) => {
    await deleteNotebookQuery(id)
    await get().loadNotebooks()
    const { currentNotebookId, notebooks } = get()
    if (currentNotebookId === id) {
      if (notebooks.length > 0) {
        await get().setCurrentNotebook(notebooks[0].id)
      } else {
        set({
          currentNotebookId: null,
          sections: [],
          currentSectionId: null,
          pages: [],
          currentPageId: null,
          currentPage: null
        })
      }
    }
  },

  deleteSection: async (id: string) => {
    const { currentNotebookId } = get()
    if (!currentNotebookId) return
    await deleteSectionQuery(id)
    await get().loadSections(currentNotebookId)
    const { currentSectionId, sections } = get()
    if (currentSectionId === id) {
      if (sections.length > 0) {
        await get().setCurrentSection(sections[0].id)
      } else {
        set({ currentSectionId: null, pages: [], currentPageId: null, currentPage: null })
      }
    }
  },

  deletePage: async (id: string) => {
    const { currentSectionId } = get()
    if (!currentSectionId) return
    await deletePageQuery(id)
    await get().loadPages(currentSectionId)
    const { currentPageId, pages } = get()
    if (currentPageId === id) {
      if (pages.length > 0) {
        await get().setCurrentPage(pages[0].id)
      } else {
        set({ currentPageId: null, currentPage: null })
      }
    }
  },

  reorderNotebooks: async (activeId: string, overId: string) => {
    const { notebooks } = get()
    const oldIndex = notebooks.findIndex(n => n.id === activeId)
    const newIndex = notebooks.findIndex(n => n.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...notebooks]
    const [removed] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, removed)

    set({ notebooks: reordered })
    await reorderNotebooksQuery(reordered.map(n => n.id))
  },

  reorderSections: async (activeId: string, overId: string) => {
    const { sections } = get()
    const oldIndex = sections.findIndex(s => s.id === activeId)
    const newIndex = sections.findIndex(s => s.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...sections]
    const [removed] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, removed)

    set({ sections: reordered })
    await reorderSectionsQuery(reordered.map(s => s.id))
  },

  reorderPages: async (activeId: string, overId: string) => {
    const { pages } = get()
    const oldIndex = pages.findIndex(p => p.id === activeId)
    const newIndex = pages.findIndex(p => p.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...pages]
    const [removed] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, removed)

    set({ pages: reordered })
    await reorderPagesQuery(reordered.map(p => p.id))
  },
}))
