import { getSupabase } from '@/lib/supabase'
import type { Notebook } from '../../types'

export async function getNotebooks(tenantId: string): Promise<Notebook[]> {
  const supabase = getSupabase('onenote')

  const { data, error } = await supabase
    .from('notebooks')
    .select('*')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('position', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createNotebook(
  tenantId: string,
  userId: string,
  title: string = '',
  color: string = '#3b82f6'
): Promise<Notebook> {
  const supabase = getSupabase('onenote')

  const { data: notebooks } = await supabase
    .from('notebooks')
    .select('position')
    .eq('tenant_id', tenantId)
    .order('position', { ascending: false })
    .limit(1)

  const position = notebooks && notebooks.length > 0 ? notebooks[0].position + 1 : 0

  const { data, error } = await supabase
    .from('notebooks')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      title,
      color,
      position
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateNotebook(
  id: string,
  updates: Partial<Notebook>
): Promise<void> {
  const supabase = getSupabase('onenote')

  const { error } = await supabase
    .from('notebooks')
    .update(updates)
    .eq('id', id)

  if (error) throw error
}

export async function deleteNotebook(id: string): Promise<void> {
  const supabase = getSupabase('onenote')

  const { error } = await supabase
    .from('notebooks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function reorderNotebooks(orderedIds: string[]): Promise<void> {
  const supabase = getSupabase('onenote')

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('notebooks')
      .update({ position: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const error = results.find(r => r.error)?.error
  if (error) throw error
}
