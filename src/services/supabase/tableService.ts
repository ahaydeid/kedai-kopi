import { createClient } from './client'

export interface TableItem {
  id: string
  number: string
  capacity: number
  status: 'Tersedia' | 'Penuh' | 'Dipesan' | 'Tidak tersedia'
  created_at?: string
  updated_at?: string
}

export interface CreateTableInput {
  number: string
  capacity: number
  status?: 'Tersedia' | 'Penuh' | 'Dipesan' | 'Tidak tersedia'
}

export interface UpdateTableInput {
  number?: string
  capacity?: number
  status?: 'Tersedia' | 'Penuh' | 'Dipesan' | 'Tidak tersedia'
}

let tablesCache: { data: TableItem[]; timestamp: number } | null = null
const CACHE_TTL_MS = 30 * 1000
const LOCAL_STORAGE_TABLES_KEY = 'admin_tables_cache_v1'

export function getCachedTablesSync(): TableItem[] {
  if (tablesCache && tablesCache.data.length > 0) return tablesCache.data
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_TABLES_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        tablesCache = { data: parsed, timestamp: Date.now() }
        return parsed
      }
    } catch {}
  }
  return []
}

export function clearTablesCache() {
  tablesCache = null
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_TABLES_KEY)
    } catch {}
  }
}

export async function getTables(): Promise<TableItem[]> {
  if (tablesCache && Date.now() - tablesCache.timestamp < CACHE_TTL_MS) {
    return tablesCache.data
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('number', { ascending: true })

  if (error) {
    console.warn('Error fetching tables from Supabase. Falling back to local cache:', error)
    return getCachedTablesSync()
  }

  const result = data || []
  tablesCache = { data: result, timestamp: Date.now() }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_TABLES_KEY, JSON.stringify(result))
    } catch {}
  }
  return result
}

export async function createTable(input: CreateTableInput): Promise<TableItem | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tables')
    .insert([
      {
        number: input.number,
        capacity: input.capacity,
        status: input.status || 'Tersedia',
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating table in Supabase:', error)
    return null
  }

  clearTablesCache()
  return data
}

export async function updateTable(id: string, input: UpdateTableInput): Promise<TableItem | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tables')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating table in Supabase:', error)
    return null
  }

  clearTablesCache()
  return data
}

export async function deleteTable(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('tables').delete().eq('id', id)

  if (error) {
    console.error('Error deleting table from Supabase:', error)
    return false
  }

  clearTablesCache()
  return true
}

export function subscribeToTables(onUpdate: () => void) {
  const supabase = createClient()

  const channel = supabase
    .channel('public:tables')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tables' },
      () => {
        clearTablesCache()
        onUpdate()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
