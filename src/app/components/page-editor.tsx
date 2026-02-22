'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { useNotesStore } from '../lib/notes-store'
import { useDebouncedCallback } from 'use-debounce'
import { Tldraw, getSnapshot, loadSnapshot } from 'tldraw'
import type { Editor, TLEditorSnapshot } from 'tldraw'
import 'tldraw/tldraw.css'

export function PageEditor() {
  const { currentPage, currentPageId, updatePageTitle, updatePageContent, isLoadingPage } = useNotesStore()

  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<Editor | null>(null)
  const currentPageIdRef = useRef<string | null>(null)
  const isSavingRef = useRef(false)

  useEffect(() => {
    if (currentPage) {
      setTitle(currentPage.title)
    }
  }, [currentPage])

  const debouncedSave = useDebouncedCallback(async (pageId: string, data: string) => {
    setIsSaving(true)
    try {
      await updatePageContent(pageId, data)
    } catch (error) {
      console.error('Failed to save:', error)
    } finally {
      setIsSaving(false)
    }
  }, 500)

  const debouncedSaveTitle = useDebouncedCallback(async (pageId: string, newTitle: string) => {
    try {
      await updatePageTitle(pageId, newTitle)
    } catch (error) {
      console.error('Failed to save title:', error)
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
    console.log('PageEditor: Editor mounted')
    editorRef.current = editor

    const unsubscribe = editor.store.listen(
      (change) => {
        if (isSavingRef.current) {
          console.log('PageEditor: Ignoring change because isSavingRef is true')
          return
        }
        
        // Check if the change actually came from a user action
        if (change.source !== 'user') return

        const pageId = useNotesStore.getState().currentPageId
        console.log('PageEditor: Store changed by user, pageId:', pageId)
        
        if (pageId) {
          const snapshot = getSnapshot(editor.store)
          console.log('PageEditor: Triggering debouncedSave for pageId:', pageId)
          debouncedSave(pageId, JSON.stringify(snapshot))
        }
      },
      { source: 'user', scope: 'document' }
    )

    return () => {
      console.log('PageEditor: Editor unmounting, unsubscribing from store')
      unsubscribe()
    }
  }, [debouncedSave])

  // Load page content when currentPage changes
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const page = currentPage
    if (!page) {
      console.log('PageEditor: No current page')
      return
    }

    // Only reload if we're switching to a different page
    if (currentPageIdRef.current !== page.id) {
      console.log('PageEditor: Loading content for page', page.id, 'title:', page.title)
      currentPageIdRef.current = page.id
      isSavingRef.current = true
      
      if (page.content) {
        try {
          const snapshot = JSON.parse(page.content) as TLEditorSnapshot
          console.log('PageEditor: Snapshot parsed, loading into editor')
          loadSnapshot(editor.store, snapshot)
        } catch (error) {
          console.error('PageEditor: Failed to parse/load page content:', error)
          editor.createShapes([])
          editor.selectNone()
        }
      } else {
        console.log('PageEditor: Page has no content, clearing editor')
        editor.store.clear()
        editor.createShapes([])
        editor.selectNone()
      }
      
      requestAnimationFrame(() => {
        isSavingRef.current = false
        console.log('PageEditor: Loading complete, isSavingRef reset to false')
      })
    }
  }, [currentPage])

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
