'use client'

import { useEffect } from 'react'
import { useTenant } from '@/lib/auth/tenant-context'
import { useNotesStore } from './lib/notes-store'
import { usePanelStore } from './lib/panel-store'
import { NotebooksPanel } from './components/notebooks-panel'
import { SectionsTabs } from './components/sections-tabs'
import { PagesPanel } from './components/pages-panel'
import { PageEditor } from './components/page-editor'
import { BreadcrumbNav } from './components/breadcrumb-nav'
import { DesktopRecommended } from '@/components/desktop-recommended'
import { cn } from '@/lib/utils'

export default function OneNotePage() {
  const { tenantId, userId } = useTenant()
  const { setContext, initialize } = useNotesStore()
  const { notebooksVisible, sectionsVisible, pagesVisible, setFocusMode } = usePanelStore()

  useEffect(() => {
    setContext(tenantId, userId)
    initialize()
  }, [tenantId, userId, setContext, initialize])

  // Keyboard shortcut: Cmd/Ctrl + \ for focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        const isAnyHidden = !notebooksVisible || !sectionsVisible || !pagesVisible
        setFocusMode(!isAnyHidden)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [notebooksVisible, sectionsVisible, pagesVisible, setFocusMode])

  // Dynamic grid columns based on panel visibility
  const gridCols = cn(
    'flex-1 grid overflow-hidden transition-all duration-200',
    notebooksVisible && pagesVisible && 'grid-cols-[250px_1fr_250px]',
    notebooksVisible && !pagesVisible && 'grid-cols-[250px_1fr]',
    !notebooksVisible && pagesVisible && 'grid-cols-[1fr_250px]',
    !notebooksVisible && !pagesVisible && 'grid-cols-[1fr]'
  )

  return (
    <DesktopRecommended featureName="Notes canvas">
      <div className="h-full flex flex-col overflow-hidden">
        <BreadcrumbNav />
        {sectionsVisible && <SectionsTabs />}

        <div className={gridCols}>
          {notebooksVisible && <NotebooksPanel />}
          <PageEditor />
          {pagesVisible && <PagesPanel />}
        </div>
      </div>
    </DesktopRecommended>
  )
}
