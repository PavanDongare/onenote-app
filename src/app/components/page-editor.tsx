'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { useNotesStore } from '../lib/notes-store'
import { useDebouncedCallback } from 'use-debounce'
import { Tldraw, getSnapshot, loadSnapshot } from 'tldraw'
import type { Editor, TLEditorSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

export function PageEditor() {
  const currentPage = useNotesStore(s => s.currentPage)
  const currentPageId = useNotesStore(s => s.currentPageId)
  const updatePageTitle = useNotesStore(s => s.updatePageTitle)
  const updatePageContent = useNotesStore(s => s.updatePageContent)
  const isLoadingPage = useNotesStore(s => s.isLoadingPage)

  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  const currentPageIdRef = useRef<string | null>(null)
  const isInitialLoadRef = useRef(false)

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title)
    }
  }, [currentPage?.title]) // Only sync title when it changes

  const debouncedSave = useDebouncedCallback(async (pageId: string, data: string) => {
    setIsSaving(true)
    try {
      await updatePageContent(pageId, data)
    } catch (error) {
      console.error('PageEditor: Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, 1000) // Increase debounce to 1s for safety

  const debouncedSaveTitle = useDebouncedCallback(async (pageId: string, newTitle: string) => {
    try {
      await updatePageTitle(pageId, newTitle)
    } catch (error) {
      console.error('PageEditor: Failed to save title:', error)
    }
  }, 500)

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    if (currentPageId) {
      debouncedSaveTitle(currentPageId, newTitle)
    }
  }

  const handleMount = useCallback((editor: Editor) => {
    editorRef.current = editor

    const unsubscribe = editor.store.listen(
      (change) => {
        if (isInitialLoadRef.current) return
        if (change.source !== 'user') return

        const pageId = useNotesStore.getState().currentPageId
        if (pageId) {
          const snapshot = getSnapshot(editor.store)
          debouncedSave(pageId, JSON.stringify(snapshot))
        }
      },
      { source: 'user', scope: 'document' }
    )

    return () => {
      unsubscribe()
    }
  }, [debouncedSave])

  // Load page content when page selection changes
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !currentPage) return

    // CRITICAL: Only reload if the page ID has changed (switching pages)
    // or if we haven't loaded anything yet.
    // Do NOT reload if only the 'content' changed in the store (which happens after every save).
    if (currentPageIdRef.current !== currentPage.id) {
      currentPageIdRef.current = currentPage.id
      isInitialLoadRef.current = true
      
      if (currentPage.content) {
        try {
          const snapshot = JSON.parse(currentPage.content) as TLEditorSnapshot
          loadSnapshot(editor.store, snapshot)
        } catch (error) {
          console.error('PageEditor: Failed to load snapshot:', error)
          // Fallback: clear only shapes if load fails
          const shapeIds = Array.from(editor.getCurrentPageShapeIds())
          if (shapeIds.length > 0) editor.deleteShapes(shapeIds)
        }
      } else {
        // Safe way to clear current page shapes
        const shapeIds = Array.from(editor.getCurrentPageShapeIds())
        if (shapeIds.length > 0) editor.deleteShapes(shapeIds)
      }
      
      // Delay disabling initial load protection to ensure tldraw's internal
      // update cycle from loadSnapshot is complete.
      setTimeout(() => {
        isInitialLoadRef.current = false
      }, 500)
    }
  }, [currentPage?.id]) // ONLY depend on the ID, not the full object

  if (!currentPageId || !currentPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 text-6xl">📝</div>
          <h3 className="text-lg font-semibold mb-2">No page selected</h3>
          <p className="text-sm text-muted-foreground">Select a page or create a new one</p>
        </div>
      </div>
    )
  }

  if (isLoadingPage) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading page...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background overflow-hidden min-h-0">
      <div className="p-4 pb-0 flex items-center gap-2">
        <Input
          value={title}
          onChange={handleTitleChange}
          className="text-3xl font-bold border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
          placeholder="Page title..."
        />
        <span className={`text-xs text-muted-foreground w-16 ${isSaving ? 'opacity-100' : 'opacity-0'}`}>
          Saving...
        </span>
      </div>

      <div className="border-b mx-4 my-2" />

      <div className="flex-1 relative">
        <div className="absolute inset-0">
          <Tldraw onMount={handleMount} components={{ PageMenu: null }} />
        </div>
      </div>
    </div>
  )
}
