import { getSupabase } from '@/lib/supabase'
import type { Page } from '../../types'

export async function getPages(sectionId: string): Promise<Page[]> {
  const supabase = getSupabase('onenote')

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('section_id', sectionId)
    .is('deleted_at', null)
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getPage(pageId: string): Promise<Page> {
  const supabase = getSupabase('onenote')

  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('id', pageId)
    .single()

  if (error) throw error
  return data
}

export async function createPage(
  sectionId: string,
  title: string = ''
): Promise<Page> {
  const supabase = getSupabase('onenote')

  const { data: pages } = await supabase
    .from('pages')
    .select('position')
    .eq('section_id', sectionId)
    .order('position', { ascending: false })
    .limit(1)

  const position = pages && pages.length > 0 ? pages[0].position + 1 : 0

  const { data, error } = await supabase
    .from('pages')
    .insert({ section_id: sectionId, title, content: '', position })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePageContent(
  pageId: string,
  content: string
): Promise<void> {
  const supabase = getSupabase('onenote')

  const { error } = await supabase
    .from('pages')
    .update({ content })
    .eq('id', pageId)

  if (error) throw error
}

export async function updatePageTitle(
  pageId: string,
  title: string
): Promise<void> {
  const supabase = getSupabase('onenote')

  const { error } = await supabase
    .from('pages')
    .update({ title })
    .eq('id', pageId)

  if (error) throw error
}

export async function deletePage(id: string): Promise<void> {
  const supabase = getSupabase('onenote')

  const { error } = await supabase
    .from('pages')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function reorderPages(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase('onenote')

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('pages')
      .update({ position: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const error = results.find(r => r.error)?.error
  if (error) throw error
}
