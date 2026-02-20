'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { GripVertical, Pencil } from 'lucide-react'
import type { Page } from '../types'

interface SortablePageItemProps {
  page: Page
  isSelected: boolean
  isEditing: boolean
  editingTitle: string
  isHovered: boolean
  onSelect: () => void
  onStartEdit: (e: React.MouseEvent) => void
  onSaveEdit: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onTitleChange: (value: string) => void
  onHover: (hovered: boolean) => void
}

export function SortablePageItem({
  page,
  isSelected,
  isEditing,
  editingTitle,
  isHovered,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onKeyDown,
  onTitleChange,
  onHover,
}: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full p-3 mb-2 rounded-lg transition-colors group ${
        isSelected
          ? 'bg-primary/10 border-2 border-primary/20'
          : 'hover:bg-muted border-2 border-transparent'
      }`}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>

        <span className="text-lg flex-shrink-0">📄</span>

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
              {page.title || <span className="text-muted-foreground italic">Unnamed</span>}
            </span>
            {isHovered && (
              <button
                onClick={onStartEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded flex-shrink-0"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
