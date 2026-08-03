import { createClient } from './client'
import { DatabaseMenu } from '@/types/database'
import { compressImage } from '@/utils/imageCompression'
import { offlineDB } from '@/services/offline/db'
import { slugify } from '@/utils/slugify'

export type CreateMenuInput = Omit<DatabaseMenu, 'id' | 'created_at'>

let menuCache: { data: DatabaseMenu[]; timestamp: number } | null = null
const CACHE_TTL_MS = 30 * 1000 // 30 Detik Memory Cache TTL
const LOCAL_STORAGE_MENU_KEY = 'customer_menu_cache_v1'

export function getCachedMenuItemsSync(): DatabaseMenu[] {
  if (menuCache && menuCache.data.length > 0) return menuCache.data
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MENU_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        menuCache = { data: parsed, timestamp: Date.now() }
        return parsed
      }
    } catch {}
  }
  return []
}

export function clearMenuCache() {
  menuCache = null
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_MENU_KEY)
    } catch {}
  }
}

export function hasMenuCache(): boolean {
  if (menuCache && menuCache.data.length > 0) return true
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MENU_KEY)
      if (saved && JSON.parse(saved).length > 0) return true
    } catch {}
  }
  return false
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
    console.warn('Network or Supabase error fetching menu items. Using offline cache fallback:', error)
    return getCachedMenuItemsSync()
  }

  const result = data as DatabaseMenu[]
  menuCache = { data: result, timestamp: now }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_MENU_KEY, JSON.stringify(result))
      // Save items asynchronously to Dexie IndexedDB
      offlineDB.cached_menu_items.clear().then(() => {
        offlineDB.cached_menu_items.bulkPut(
          result.map((m) => ({
            id: m.id,
            name: m.name,
            price: Number(m.price),
            category_id: m.main_category || 'Minuman',
            category_name: m.sub_category,
            image_url: m.images?.[0] || undefined,
            available: m.is_available,
            updated_at: m.updated_at,
          }))
        ).catch((err) => console.warn('Dexie sync warning:', err))
      }).catch(() => {})
    } catch {}
  }
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
    console.warn('Supabase fetch error for paginated menu (Offline mode active). Using offline local cache fallback:', error)
    let localData = getCachedMenuItemsSync()

    if (categoryFilter && categoryFilter !== 'semua') {
      localData = localData.filter(
        (m) => m.main_category === categoryFilter || m.sub_category === categoryFilter
      )
    }

    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().toLowerCase()
      localData = localData.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          (m.sub_category && m.sub_category.toLowerCase().includes(term))
      )
    }

    const totalCount = localData.length
    const offset = (page - 1) * pageSize
    const paginatedData = localData.slice(offset, offset + pageSize)

    return {
      data: paginatedData,
      totalCount,
    }
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
  const payload = {
    ...input,
    slug: input.slug || slugify(input.name),
  }
  const { data, error } = await supabase
    .from('menu')
    .insert([payload])
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
    ...(input.name ? { slug: input.slug || slugify(input.name) } : {}),
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
