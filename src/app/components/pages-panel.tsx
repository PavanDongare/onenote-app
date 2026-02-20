'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PanelRightClose } from 'lucide-react'
import { useNotesStore } from '../lib/notes-store'
import { usePanelStore } from '../lib/panel-store'
import { SortablePageItem } from './sortable-page-item'

export function PagesPanel() {
  const {
    pages,
    currentPageId,
    currentSectionId,
    setCurrentPage,
    createPage,
    isLoadingPages,
    updatePageTitle,
    reorderPages
  } = useNotesStore()
  const { togglePages } = usePanelStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      await reorderPages(active.id as string, over.id as string)
    }
  }

  const handleCreatePage = async () => {
    if (!currentSectionId) return
    try {
      const page = await createPage(currentSectionId)
      setEditingId(page.id)
      setEditingTitle('')
    } catch (error) {
      console.error('Failed to create page:', error)
    }
  }

  const handleStartEdit = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(title)
  }

  const handleSaveEdit = async (id: string) => {
    if (editingTitle.trim() && editingTitle !== pages.find(p => p.id === id)?.title) {
      try {
        await updatePageTitle(id, editingTitle.trim())
      } catch (error) {
        console.error('Failed to update page title:', error)
      }
    }
    setEditingId(null)
    setEditingTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') handleSaveEdit(id)
    else if (e.key === 'Escape') {
      setEditingId(null)
      setEditingTitle('')
    }
  }

  const headerButton = (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-foreground"
      onClick={togglePages}
      title="Hide pages (Cmd+\)"
    >
      <PanelRightClose className="h-4 w-4" />
    </Button>
  )

  if (!currentSectionId) {
    return (
      <div className="flex flex-col h-full border-l bg-muted/10">
        <div className="p-4 border-b flex items-center justify-between">
          {headerButton}
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="mb-2 text-4xl">📄</div>
            <p className="text-sm text-muted-foreground">Select a section to view pages</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-l bg-muted/10">
      <div className="p-4 border-b flex items-center justify-between">
        {headerButton}
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pages</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoadingPages ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
          ) : pages.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              <div className="mb-2 text-4xl">📄</div>
              <p>No pages yet</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pages.map(p => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {pages.map((page) => (
                  <SortablePageItem
                    key={page.id}
                    page={page}
                    isSelected={currentPageId === page.id}
                    isEditing={editingId === page.id}
                    editingTitle={editingTitle}
                    isHovered={hoveredId === page.id}
                    onSelect={() => setCurrentPage(page.id)}
                    onStartEdit={(e) => handleStartEdit(page.id, page.title, e)}
                    onSaveEdit={() => handleSaveEdit(page.id)}
                    onKeyDown={(e) => handleKeyDown(e, page.id)}
                    onTitleChange={setEditingTitle}
                    onHover={(hovered) => setHoveredId(hovered ? page.id : null)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button onClick={handleCreatePage} variant="outline" className="w-full">
          + New Page
        </Button>
      </div>
    </div>
  )
}
