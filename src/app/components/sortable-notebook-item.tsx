'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Notebook } from '../types'

interface SortableNotebookItemProps {
  notebook: Notebook
  isSelected: boolean
  isEditing: boolean
  editingTitle: string
  isHovered: boolean
  onSelect: () => void
  onStartEdit: (e: React.MouseEvent) => void
  onSaveEdit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onTitleChange: (value: string) => void
  onDelete: (e: React.MouseEvent) => void
  onHover: (hovered: boolean) => void
}

export function SortableNotebookItem({
  notebook,
  isSelected,
  isEditing,
  editingTitle,
  isHovered,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onKeyDown,
  onTitleChange,
  onDelete,
  onHover,
}: SortableNotebookItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: notebook.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full p-3 mb-2 rounded-lg transition-colors flex items-center gap-2 group ${
        isSelected
          ? 'bg-primary/10 border-2 border-primary/20'
          : 'hover:bg-muted border-2 border-transparent'
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div
        className="w-4 h-4 rounded flex-shrink-0"
        style={{ backgroundColor: notebook.color }}
      />

      {isEditing ? (
        <Input
          value={editingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={onKeyDown}
          className="h-7 text-sm font-medium"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span
            className="font-medium text-sm truncate flex-1 cursor-pointer"
            onClick={onSelect}
          >
            {notebook.title || <span className="text-muted-foreground italic">Unnamed</span>}
          </span>
          {isHovered && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onStartEdit}
                className="p-1 hover:bg-primary/10 rounded"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="p-1 hover:bg-destructive/10 rounded"
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
