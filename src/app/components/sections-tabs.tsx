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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronsUpDown } from 'lucide-react'
import { useNotesStore } from '../lib/notes-store'
import { usePanelStore } from '../lib/panel-store'
import { updateSection } from '../lib/queries/sections'
import { SortableSectionTab } from './sortable-section-tab'

export function SectionsTabs() {
  const {
    sections,
    currentSectionId,
    currentNotebookId,
    setCurrentSection,
    createSection,
    loadSections,
    isLoadingSections,
    reorderSections
  } = useNotesStore()
  const { toggleSections } = usePanelStore()

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
      await reorderSections(active.id as string, over.id as string)
    }
  }

  const handleCreateSection = async () => {
    if (!currentNotebookId) return
    try {
      const section = await createSection(currentNotebookId)
      setEditingId(section.id)
      setEditingTitle('')
    } catch (error) {
      console.error('Failed to create section:', error)
    }
  }

  const handleStartEdit = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(title)
  }

  const handleSaveEdit = async (id: string) => {
    if (editingTitle.trim() && editingTitle !== sections.find(s => s.id === id)?.title) {
      try {
        await updateSection(id, { title: editingTitle.trim() })
        if (currentNotebookId) await loadSections(currentNotebookId)
      } catch (error) {
        console.error('Failed to update section:', error)
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

  if (!currentNotebookId) {
    return (
      <div className="h-12 border-b flex items-center justify-center bg-muted/5">
        <p className="text-sm text-muted-foreground">Select a notebook to view sections</p>
      </div>
    )
  }

  return (
    <div className="h-12 border-b flex items-center bg-muted/5">
      <ScrollArea className="flex-1">
        <div className="flex items-center gap-2 px-4 h-12">
          {isLoadingSections ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : sections.length === 0 ? (
            <div className="text-sm text-muted-foreground">No sections yet</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sections.map(s => s.id)}
                strategy={horizontalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SortableSectionTab
                    key={section.id}
                    section={section}
                    isSelected={currentSectionId === section.id}
                    isEditing={editingId === section.id}
                    editingTitle={editingTitle}
                    isHovered={hoveredId === section.id}
                    onSelect={() => setCurrentSection(section.id)}
                    onStartEdit={(e) => handleStartEdit(section.id, section.title, e)}
                    onSaveEdit={() => handleSaveEdit(section.id)}
                    onKeyDown={(e) => handleKeyDown(e, section.id)}
                    onTitleChange={setEditingTitle}
                    onHover={(hovered) => setHoveredId(hovered ? section.id : null)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}

          <Button onClick={handleCreateSection} variant="ghost" size="sm" className="ml-2 h-8 w-8 p-0">
            +
          </Button>
        </div>
      </ScrollArea>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 mr-2 text-muted-foreground hover:text-foreground"
        onClick={toggleSections}
        title="Hide sections"
      >
        <ChevronsUpDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
