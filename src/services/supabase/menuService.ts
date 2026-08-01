import { createClient } from './client'
import { DatabaseMenu } from '@/types/database'
import { compressImage } from '@/utils/imageCompression'

export type CreateMenuInput = Omit<DatabaseMenu, 'id' | 'created_at'>

let menuCache: { data: DatabaseMenu[]; timestamp: number } | null = null
const CACHE_TTL_MS = 30 * 1000 // 30 Detik Memory Cache TTL

export function clearMenuCache() {
  menuCache = null
}

export function hasMenuCache(): boolean {
  return Boolean(menuCache && Date.now() - menuCache.timestamp < CACHE_TTL_MS)
}

export async function getMenuItems(forceRefresh = false): Promise<DatabaseMenu[]> {
  const now = Date.now()
  if (!forceRefresh && menuCache && now - menuCache.timestamp < CACHE_TTL_MS) {
    return menuCache.data
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu')
    .select('*')
    .order('is_available', { ascending: false })
    .order('updated_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Error fetching menu items:', error)
    return menuCache ? menuCache.data : []
  }

  const result = data as DatabaseMenu[]
  menuCache = { data: result, timestamp: now }
  return result
}

export interface PaginatedMenuResult {
  data: DatabaseMenu[]
  totalCount: number
}

export async function getPaginatedMenuItems(params: {
  page: number
  pageSize: number
  searchQuery?: string
  categoryFilter?: string
}): Promise<PaginatedMenuResult> {
  const { page, pageSize, searchQuery, categoryFilter } = params
  const supabase = createClient()

  let query = supabase.from('menu').select('*', { count: 'exact' })

  if (categoryFilter && categoryFilter !== 'semua') {
    query = query.or(`main_category.eq.${categoryFilter},sub_category.eq.${categoryFilter}`)
  }

  if (searchQuery && searchQuery.trim() !== '') {
    const term = searchQuery.trim()
    query = query.or(`name.ilike.%${term}%,sub_category.ilike.%${term}%`)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count, error } = await query
    .order('is_available', { ascending: false })
    .order('updated_at', { ascending: false, nullsFirst: false })
    .range(from, to)

  if (error) {
    console.error('Error fetching paginated menu items:', error)
    return { data: [], totalCount: 0 }
  }

  return {
    data: (data as DatabaseMenu[]) || [],
    totalCount: count ?? 0,
  }
}

export function subscribeToMenu(onMenuChange: (payload: any) => void) {
  const supabase = createClient()
  const channel = supabase
    .channel('public:menu-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'menu' },
      (payload) => {
        clearMenuCache()
        onMenuChange(payload)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function uploadMenuImage(file: File): Promise<string | null> {
  const supabase = createClient()
  
  // Kompres file gambar secara super ketat sebelum dikirim ke Supabase Storage
  const compressedFile = await compressImage(file)

  const fileExt = compressedFile.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`
  const filePath = `menu/${fileName}`

  const { error } = await supabase.storage
    .from('menu-images')
    .upload(filePath, compressedFile, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    console.error('Error uploading menu image to Supabase Storage:', error)
    return null
  }

  const { data } = supabase.storage.from('menu-images').getPublicUrl(filePath)
  return data.publicUrl
}

export async function createMenuItem(input: CreateMenuInput): Promise<DatabaseMenu | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('menu')
    .insert([input])
    .select()
    .single()

  if (error) {
    console.error('Error creating menu item:', error)
    return null
  }

  clearMenuCache()
  return data as DatabaseMenu
}

export async function updateMenuItem(id: string, input: Partial<CreateMenuInput>): Promise<DatabaseMenu | null> {
  const supabase = createClient()
  const updateData = {
    ...input,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from('menu')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating menu item:', error)
    return null
  }

  clearMenuCache()
  return data as DatabaseMenu
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('menu')
    .update({ is_available: isAvailable })
    .eq('id', id)

  if (error) {
    console.error('Error toggling menu availability:', error)
    return false
  }

  clearMenuCache()
  return true
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('menu')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting menu item:', error)
    return false
  }

  clearMenuCache()
  return true
}
