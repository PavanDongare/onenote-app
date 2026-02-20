'use client'

import { ChevronRight, PanelLeft, PanelRight, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useNotesStore } from '../lib/notes-store'
import { usePanelStore } from '../lib/panel-store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function BreadcrumbNav() {
  const {
    notebooks,
    currentNotebookId,
    sections,
    currentSectionId,
    pages,
    currentPageId,
    setCurrentNotebook,
    setCurrentSection,
  } = useNotesStore()

  const {
    notebooksVisible,
    sectionsVisible,
    pagesVisible,
    toggleNotebooks,
    toggleSections,
    togglePages,
  } = usePanelStore()

  const notebook = notebooks.find((n) => n.id === currentNotebookId)
  const section = sections.find((s) => s.id === currentSectionId)
  const page = pages.find((p) => p.id === currentPageId)

  const notebookLabel = notebook?.title || 'Untitled Notebook'
  const sectionLabel = section?.title || 'Untitled Section'
  const pageLabel = page?.title || 'Untitled Page'

  return (
    <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-4 w-full">
      {/* Left expand button when notebooks hidden */}
      {!notebooksVisible && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 mr-2"
          onClick={toggleNotebooks}
          title="Show notebooks"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}

      <nav className="flex items-center gap-4 flex-1 justify-center">
        {/* Notebook - dropdown when panel hidden */}
        {!notebooksVisible ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 font-bold text-base tracking-tight text-white hover:text-zinc-300 transition-colors">
                <span className="truncate max-w-[200px]" title={notebookLabel}>
                  {notebookLabel}
                </span>
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {notebooks.map((nb) => (
                <DropdownMenuItem
                  key={nb.id}
                  onClick={() => setCurrentNotebook(nb.id)}
                  className={nb.id === currentNotebookId ? 'bg-accent' : ''}
                >
                  {nb.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span
            className="font-bold text-base tracking-tight text-white truncate max-w-[200px]"
            title={notebookLabel}
          >
            {notebookLabel}
          </span>
        )}

        <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" strokeWidth={3} />

        {/* Section - dropdown when sections hidden */}
        {!sectionsVisible ? (
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 font-bold text-base tracking-tight text-zinc-200 hover:text-white transition-colors">
                  <span className="truncate max-w-[200px]" title={sectionLabel}>
                    {sectionLabel}
                  </span>
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {sections.map((sec) => (
                  <DropdownMenuItem
                    key={sec.id}
                    onClick={() => setCurrentSection(sec.id)}
                    className={sec.id === currentSectionId ? 'bg-accent' : ''}
                  >
                    {sec.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-zinc-800"
              onClick={toggleSections}
              title="Show section tabs"
            >
              <ChevronsUpDown className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span
            className="font-bold text-base tracking-tight text-zinc-200 truncate max-w-[200px]"
            title={sectionLabel}
          >
            {sectionLabel}
          </span>
        )}

        <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" strokeWidth={3} />

        <span
          className="font-bold text-base tracking-tight text-zinc-400 truncate max-w-[200px]"
          title={pageLabel}
        >
          {pageLabel}
        </span>
      </nav>

      {/* Right expand button when pages hidden */}
      {!pagesVisible && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-800 ml-2"
          onClick={togglePages}
          title="Show pages"
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
