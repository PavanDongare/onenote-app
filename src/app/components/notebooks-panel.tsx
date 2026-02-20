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
import { PanelLeftClose } from 'lucide-react'
import { usePanelStore } from '../lib/panel-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotesStore } from '../lib/notes-store'
import { updateNotebook } from '../lib/queries/notebooks'
import { SortableNotebookItem } from './sortable-notebook-item'

export function NotebooksPanel() {
  const {
    notebooks,
    currentNotebookId,
    setCurrentNotebook,
    createNotebook,
    deleteNotebook,
    loadNotebooks,
    isLoadingNotebooks,
    reorderNotebooks
  } = useNotesStore()
  const { toggleNotebooks } = usePanelStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notebookToDelete, setNotebookToDelete] = useState<{ id: string; title: string } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      await reorderNotebooks(active.id as string, over.id as string)
    }
  }

  const handleCreateNotebook = async () => {
    try {
      const notebook = await createNotebook()
      if (notebook) {
        setEditingId(notebook.id)
        setEditingTitle('')
      }
    } catch (error) {
      console.error('Failed to create notebook:', error)
    }
  }

  const handleStartEdit = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(id)
    setEditingTitle(title)
  }

  const handleSaveEdit = async (id: string) => {
    if (editingTitle.trim() && editingTitle !== notebooks.find(n => n.id === id)?.title) {
      try {
        await updateNotebook(id, { title: editingTitle.trim() })
        await loadNotebooks()
      } catch (error) {
        console.error('Failed to update notebook:', error)
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

  const handleDeleteClick = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotebookToDelete({ id, title })
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (notebookToDelete) {
      try {
        await deleteNotebook(notebookToDelete.id)
        setDeleteDialogOpen(false)
        setNotebookToDelete(null)
      } catch (error) {
        console.error('Failed to delete notebook:', error)
      }
    }
  }

  return (
    <div className="flex flex-col h-full border-r bg-muted/10">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Notebooks
        </h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={toggleNotebooks}
          title="Hide notebooks (Cmd+\)"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoadingNotebooks ? (
            <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
          ) : notebooks.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              <div className="mb-2 text-4xl">📓</div>
              <p>No notebooks yet</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={notebooks.map(n => n.id)}
                strategy={verticalListSortingStrategy}
              >
                {notebooks.map((notebook) => (
                  <SortableNotebookItem
                    key={notebook.id}
                    notebook={notebook}
                    isSelected={currentNotebookId === notebook.id}
                    isEditing={editingId === notebook.id}
                    editingTitle={editingTitle}
                    isHovered={hoveredId === notebook.id}
                    onSelect={() => setCurrentNotebook(notebook.id)}
                    onStartEdit={(e) => handleStartEdit(notebook.id, notebook.title, e)}
                    onSaveEdit={() => handleSaveEdit(notebook.id)}
                    onKeyDown={(e) => handleKeyDown(e, notebook.id)}
                    onTitleChange={setEditingTitle}
                    onDelete={(e) => handleDeleteClick(notebook.id, notebook.title, e)}
                    onHover={(hovered) => setHoveredId(hovered ? notebook.id : null)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button onClick={handleCreateNotebook} variant="outline" className="w-full">
          + New Notebook
        </Button>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notebook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{notebookToDelete?.title}"?
              This will also delete all sections and pages within.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
