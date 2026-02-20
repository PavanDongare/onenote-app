export interface Notebook {
  id: string
  title: string
  color: string
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Section {
  id: string
  notebook_id: string
  title: string
  color: string
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface Page {
  id: string
  section_id: string
  title: string
  content: string
  position: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}
