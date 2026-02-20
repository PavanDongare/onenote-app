import { getSupabase } from '@/lib/supabase'
import type { Section } from '../../types'

export async function getSections(notebookId: string): Promise<Section[]> {
  const supabase = getSupabase('onenote')

  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('notebook_id', notebookId)
    .is('deleted_at', null)
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createSection(
  notebookId: string,
  title: string = '',
  color: string = '#22c55e'
): Promise<Section> {
  const supabase = getSupabase('onenote')

  const { data: sections } = await supabase
    .from('sections')
    .select('position')
    .eq('notebook_id', notebookId)
    .order('position', { ascending: false })
    .limit(1)

  const position = sections && sections.length > 0 ? sections[0].position + 1 : 0

  const { data, error } = await supabase
    .from('sections')
    .insert({ notebook_id: notebookId, title, color, position })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSection(
  id: string,
  updates: Partial<Section>
): Promise<void> {
  const supabase = getSupabase('onenote')

  const { error } = await supabase
    .from('sections')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function deleteSection(id: string): Promise<void> {
  const supabase = getSupabase('onenote')

  const { error } = await supabase
    .from('sections')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function reorderSections(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase('onenote')

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('sections')
      .update({ position: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const error = results.find(r => r.error)?.error
  if (error) throw error
}
