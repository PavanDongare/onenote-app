'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { GripVertical, Pencil } from 'lucide-react'
import type { Section } from '../types'

interface SortableSectionTabProps {
  section: Section
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

export function SortableSectionTab({
  section,
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
}: SortableSectionTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'px-4 py-2 rounded-t-lg border-b-2 transition-all whitespace-nowrap group flex items-center gap-2',
        isSelected
          ? 'bg-background border-primary font-medium'
          : 'border-transparent hover:bg-muted/50'
      )}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </div>

      {isEditing ? (
        <Input
          value={editingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={onKeyDown}
          className="h-6 text-sm font-medium w-32"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span
            className="cursor-pointer"
            onClick={onSelect}
          >
            {section.title || <span className="text-muted-foreground italic">Unnamed</span>}
          </span>
          {isHovered && (
            <button
              onClick={onStartEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-primary/10 rounded"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
        </>
      )}
    </div>
  )
}
