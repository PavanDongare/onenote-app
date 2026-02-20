'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Input } from '@/components/ui/input'
import { useNotesStore } from '../lib/notes-store'
import { useDebouncedCallback } from 'use-debounce'
import { Editor, getSnapshot, loadSnapshot, TLEditorSnapshot } from 'tldraw'
import { updatePageContent as savePageContentToDB } from '../lib/queries/pages'
import 'tldraw/tldraw.css'

const Tldraw = dynamic(() => import('tldraw').then((mod) => mod.Tldraw), {
  ssr: false,
})

export function PageEditor() {
  const { currentPage, currentPageId, updatePageTitle, isLoadingPage } = useNotesStore()

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
      await savePageContentToDB(pageId, data)
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
    editorRef.current = editor

    const page = useNotesStore.getState().currentPage
    if (page?.content) {
      currentPageIdRef.current = page.id
      isSavingRef.current = true
      try {
        const snapshot = JSON.parse(page.content) as TLEditorSnapshot
        loadSnapshot(editor.store, snapshot)
      } catch (error) {
        console.error('Failed to load initial content:', error)
      }
      requestAnimationFrame(() => {
        isSavingRef.current = false
      })
    }

    const unsubscribe = editor.store.listen(
      () => {
        if (isSavingRef.current) return
        const pageId = useNotesStore.getState().currentPageId
        if (pageId) {
          const snapshot = getSnapshot(editor.store)
          debouncedSave(pageId, JSON.stringify(snapshot))
        }
      },
      { source: 'user', scope: 'document' }
    )

    return () => unsubscribe()
  }, [debouncedSave])

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
    <div className="flex-1 flex flex-col bg-background overflow-hidden">
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
          <Tldraw key={currentPage.id} onMount={handleMount} components={{ PageMenu: null }} />
        </div>
      </div>
    </div>
  )
}
