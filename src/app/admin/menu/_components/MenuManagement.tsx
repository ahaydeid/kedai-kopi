'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MenuTable, MenuItem } from './MenuTable'
import { AdminSearchFilter } from './AdminSearchFilter'
import { MenuModal } from './MenuModal'
import { MenuDetailModal } from './MenuDetailModal'
import { Button } from '@/components/ui/Button'
import { FiPlus } from 'react-icons/fi'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'
import {
  getMenuItems,
  getPaginatedMenuItems,
  getCachedMenuItemsSync,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  subscribeToMenu,
} from '@/services/supabase/menuService'
import { DatabaseMenu } from '@/types/database'
import { TableSkeleton } from '@/components/ui/TableSkeleton'

// Client-side in-memory cache untuk instant 0ms render saat navigasi ulang
let menuClientCache: {
  menuItems: MenuItem[]
  totalCount: number
  key: string
} | null = null

function mapDatabaseMenuToMenuItem(item: DatabaseMenu): MenuItem {
  return {
    id: item.id,
    name: item.name,
    mainCategory: (item.main_category as 'Minuman' | 'Makanan') || 'Minuman',
    subCategory: item.sub_category,
    price: Number(item.price),
    points: item.points ?? Math.floor(Number(item.price) / 1000),
    stock: item.is_available ? 'Tersedia' : 'Habis',
    images: item.images || [],
    imageUrl: item.images?.[0] || undefined,
  }
}

export function MenuManagement() {
  const [subCategoriesList, setSubCategoriesList] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('semua')
  const [pageSize, setPageSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const cacheKey = `${currentPage}-${pageSize}-${searchQuery}-${selectedCategoryFilter}`

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    if (menuClientCache && menuClientCache.key === cacheKey) {
      return menuClientCache.menuItems
    }
    const syncCache = getCachedMenuItemsSync()
    if (syncCache.length > 0) {
      return syncCache.slice(0, pageSize).map(mapDatabaseMenuToMenuItem)
    }
    return []
  })
  const [totalCount, setTotalCount] = useState<number>(() => {
    if (menuClientCache && menuClientCache.key === cacheKey) {
      return menuClientCache.totalCount
    }
    const syncCache = getCachedMenuItemsSync()
    return syncCache.length
  })
  const [loading, setLoading] = useState<boolean>(() => !menuClientCache && getCachedMenuItemsSync().length === 0)
  const [isFetching, setIsFetching] = useState<boolean>(false)

  // Reset ke halaman 1 saat filter, pencarian, atau pageSize berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategoryFilter, pageSize])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)

  // State untuk Modal Detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<MenuItem | null>(null)

  // Fetch daftar sub-kategori unik dari seluruh database
  const fetchSubCategories = useCallback(async () => {
    const allMenu = await getMenuItems()
    const list = Array.from(new Set(allMenu.map((m) => m.sub_category).filter(Boolean))).sort()
    setSubCategoriesList(list)
  }, [])

  const fetchMenu = useCallback(async (isSilent = false) => {
    const key = `${currentPage}-${pageSize}-${searchQuery}-${selectedCategoryFilter}`
    const hasData = menuClientCache !== null || menuItems.length > 0

    if (!isSilent && !hasData) {
      setLoading(true)
    } else {
      setIsFetching(true)
    }

    const { data: dbData, totalCount: count } = await getPaginatedMenuItems({
      page: currentPage,
      pageSize,
      searchQuery,
      categoryFilter: selectedCategoryFilter,
    })

    const mapped = dbData.map(mapDatabaseMenuToMenuItem)
    setMenuItems(mapped)
    setTotalCount(count)
    menuClientCache = { menuItems: mapped, totalCount: count, key }
    setLoading(false)
    setIsFetching(false)
  }, [currentPage, pageSize, searchQuery, selectedCategoryFilter, menuItems.length])

  useEffect(() => {
    fetchSubCategories()
  }, [fetchSubCategories])

  useEffect(() => {
    fetchMenu(menuClientCache !== null)

    const unsubscribe = subscribeToMenu(() => {
      fetchMenu(true)
      fetchSubCategories()
    })

    return () => {
      unsubscribe()
    }
  }, [fetchMenu, fetchSubCategories])

  const handleOpenAddModal = () => {
    setEditingItem(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }

  const handleOpenDetailModal = (item: MenuItem) => {
    setDetailItem(item)
    setIsDetailModalOpen(true)
  }

  const handleSaveMenu = async (itemData: Omit<MenuItem, 'id'> & { id?: string }) => {
    const payload = {
      name: itemData.name,
      main_category: itemData.mainCategory,
      sub_category: itemData.subCategory,
      description: null,
      price: itemData.price,
      points: itemData.points ?? Math.floor(itemData.price / 1000),
      is_available: itemData.stock === 'Tersedia',
      images: itemData.images || (itemData.imageUrl ? [itemData.imageUrl] : []),
    }

    let success = false
    if (editingItem) {
      const res = await updateMenuItem(editingItem.id, payload)
      success = Boolean(res)
    } else {
      const res = await createMenuItem(payload)
      success = Boolean(res)
    }

    if (success) {
      menuClientCache = null
      playSwalSound('success')
      Swal.fire({
        title: 'Berhasil!',
        text: editingItem ? 'Menu berhasil diperbarui.' : 'Menu baru berhasil ditambahkan.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
      })
      fetchMenu(true)
      fetchSubCategories()
    } else {
      playSwalSound('confirm')
      Swal.fire({
        title: 'Gagal',
        text: 'Terjadi kesalahan saat menyimpan menu.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      })
    }
  }

  const handleDeleteMenu = (id: string) => {
    playSwalSound('confirm')
    Swal.fire({
      title: 'Hapus Menu?',
      text: 'Data menu yang dihapus tidak dapat dikembalikan!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await deleteMenuItem(id)
        if (success) {
          menuClientCache = null
          playSwalSound('success')
          Swal.fire({
            title: 'Terhapus!',
            text: 'Menu telah berhasil dihapus.',
            icon: 'success',
            confirmButtonColor: '#3b82f6',
          })
          fetchMenu(true)
          fetchSubCategories()
        } else {
          playSwalSound('confirm')
          Swal.fire({
            title: 'Gagal',
            text: 'Gagal menghapus menu dari database.',
            icon: 'error',
            confirmButtonColor: '#ef4444',
          })
        }
      }
    })
  }

  const handleToggleStock = async (id: string, currentStock: 'Tersedia' | 'Habis') => {
    const newAvailability = currentStock !== 'Tersedia'
    const success = await toggleMenuItemAvailability(id, newAvailability)
    if (success) {
      menuClientCache = null
      fetchMenu(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Kelola Menu
          </h1>
        </div>
        <Button onClick={handleOpenAddModal} variant="primary" size="sm">
          <FiPlus className="h-4 w-4" />
          <span>Tambah Menu</span>
        </Button>
      </div>

      {/* Filter & Search */}
      <AdminSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategoryFilter={selectedCategoryFilter}
        onCategoryFilterChange={setSelectedCategoryFilter}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        subCategories={subCategoriesList}
      />

      {/* Tabel Menu */}
      {loading ? (
        <TableSkeleton rows={8} cols={7} hasAvatar />
      ) : (
        <div className={isFetching ? 'pointer-events-none' : ''}>
          <MenuTable
            items={menuItems}
            totalCount={totalCount}
            onDetail={handleOpenDetailModal}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteMenu}
            onToggleStock={handleToggleStock}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Modal Tambah / Edit Menu */}
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMenu}
        initialData={editingItem}
        existingSubCategories={subCategoriesList}
      />

      {/* Modal Detail Menu */}
      <MenuDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        item={detailItem}
        onDelete={handleDeleteMenu}
      />
    </div>
  )
}
