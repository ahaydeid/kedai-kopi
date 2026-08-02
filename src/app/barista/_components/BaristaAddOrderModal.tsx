'use client'

import React, { useState, useRef, useEffect } from 'react'
import { FiPlus, FiMinus, FiCheck, FiChevronDown, FiSearch, FiShoppingBag } from 'react-icons/fi'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { MenuItem } from '@/types/customer'
import { BaristaOrderItem } from './BaristaOrderCard'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'
import { getMenuItems } from '@/services/supabase/menuService'
import { DatabaseMenu } from '@/types/database'

interface BaristaAddOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onAddOrder: (order: { customerName: string; items: BaristaOrderItem[]; totalAmount: number }) => void
}

function mapDatabaseMenuToCustomerMenuItem(item: DatabaseMenu): MenuItem {
  return {
    id: item.id,
    name: item.name,
    category: item.sub_category,
    price: Number(item.price),
    image: item.images?.[0] || '/img/kedai-kopi.jpeg',
    images: item.images || [],
    description: item.description || '',
    isAvailable: item.is_available,
  }
}

export function BaristaAddOrderModal({ isOpen, onClose, onAddOrder }: BaristaAddOrderModalProps) {
  const [customerName, setCustomerName] = useState('')
  const [cartItems, setCartItems] = useState<{ [productId: string]: number }>({})
  const [menuList, setMenuList] = useState<MenuItem[]>([])

  // State Combobox
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [comboboxSearch, setComboboxSearch] = useState('')
  const comboboxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      getMenuItems().then((dbData) => {
        setMenuList(dbData.map(mapDatabaseMenuToCustomerMenuItem))
      })
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setIsComboboxOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  const handleSelectItem = (productId: string) => {
    setCartItems((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
    setComboboxSearch('')
    setIsComboboxOpen(false)
  }

  const handleQuantityChange = (productId: string, delta: number) => {
    setCartItems((prev) => {
      const current = prev[productId] || 0
      const updated = current + delta
      if (updated <= 0) {
        const { [productId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [productId]: updated }
    })
  }

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => {
      const { [productId]: _, ...rest } = prev
      return rest
    })
  }

  const filteredMenuItems = menuList.filter((item) =>
    item.name.toLowerCase().includes(comboboxSearch.toLowerCase()) ||
    item.category.toLowerCase().includes(comboboxSearch.toLowerCase())
  )

  const selectedList = Object.entries(cartItems).map(([id, qty]) => {
    const product = menuList.find((p) => p.id === id)
    return {
      product,
      qty,
      total: (product?.price || 0) * qty,
    }
  }).filter((i) => i.product && i.qty > 0)

  const totalCartPrice = selectedList.reduce((acc, curr) => acc + curr.total, 0)
  const totalCartItems = selectedList.reduce((acc, curr) => acc + curr.qty, 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerName.trim()) {
      playSwalSound('error')
      Swal.fire({
        icon: 'error',
        title: 'Nama Pemesan Kosong',
        text: 'Harap isi nama pelanggan terlebih dahulu.',
        confirmButtonColor: '#3D2514',
      })
      return
    }

    if (selectedList.length === 0) {
      playSwalSound('error')
      Swal.fire({
        icon: 'error',
        title: 'Item Pesanan Kosong',
        text: 'Pilih minimal 1 item menu dari combobox untuk dibuatkan pesanan.',
        confirmButtonColor: '#3D2514',
      })
      return
    }

    const items: BaristaOrderItem[] = selectedList.map((item) => ({
      name: `${item.qty}x ${item.product!.name}`,
      price: item.total,
    }))

    onAddOrder({
      customerName: customerName.trim(),
      items,
      totalAmount: totalCartPrice,
    })

    playSwalSound('success')
    Swal.fire({
      icon: 'success',
      title: 'Pesanan Dibuat!',
      text: `Pesanan atas nama "${customerName.trim()}" berhasil ditambahkan ke tab Menunggu.`,
      timer: 1500,
      showConfirmButton: false,
    })

    setCustomerName('')
    setCartItems({})
    onClose()
  }

  const handleRequestClose = () => {
    const hasUnsavedChanges = customerName.trim().length > 0 || totalCartItems > 0
    if (hasUnsavedChanges) {
      playSwalSound('confirm')
      Swal.fire({
        title: 'Tutup Tanpa Menyimpan?',
        text: 'Data pesanan yang telah dimasukkan akan hilang.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#f1f5f9',
        confirmButtonText: 'Ya, Tutup',
        cancelButtonText: 'Lanjutkan',
        reverseButtons: true,
        customClass: {
          actions: '!flex !flex-row !items-center !justify-center !gap-2',
          cancelButton: '!text-slate-700 !font-semibold !m-0',
          confirmButton: '!m-0',
        },
      }).then((result) => {
        if (result.isConfirmed) {
          setCustomerName('')
          setCartItems({})
          onClose()
        }
      })
    } else {
      setCustomerName('')
      setCartItems({})
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleRequestClose}
      title="Buat Pesanan Manual"
      size="md"
      bodyClassName="p-4 sm:p-5 !overflow-visible relative z-20"
      footerClassName="relative z-10"
      footer={
        <div className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total ({totalCartItems} Item)
            </span>
            <span className="text-base font-extrabold text-amber-800 dark:text-amber-400">
              {formatRupiah(totalCartPrice)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={handleRequestClose}>
              Batal
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!customerName.trim() || totalCartItems === 0}
              className="bg-amber-800 hover:bg-amber-900 text-white dark:bg-amber-700 dark:hover:bg-amber-800"
            >
              <FiCheck className="h-4 w-4" />
              <span>Tambah Pesanan</span>
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Input Nama Pelanggan */}
        <div className="space-y-1.5">
          <label className="block font-medium text-slate-700 dark:text-slate-300">
            Nama Pelanggan <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Contoh: Hadi"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-amber-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Combobox Tambah Menu */}
        <div className="space-y-1.5 relative z-30" ref={comboboxRef}>
          <label className="block font-medium text-slate-700 dark:text-slate-300">
            Cari & Tambah Menu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={comboboxSearch}
              onFocus={() => setIsComboboxOpen(true)}
              onChange={(e) => {
                setComboboxSearch(e.target.value)
                setIsComboboxOpen(true)
              }}
              placeholder="Ketik atau pilih menu..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-8 py-2 text-xs outline-none focus:border-amber-700 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <button
              type="button"
              onClick={() => setIsComboboxOpen(!isComboboxOpen)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <FiChevronDown className={`h-4 w-4 transition-transform ${isComboboxOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Combobox Dropdown List */}
          {isComboboxOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto py-1 thin-scroll">
              {filteredMenuItems.length > 0 ? (
                filteredMenuItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item.id)}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-amber-50/60 dark:hover:bg-slate-800/80 cursor-pointer border-b border-slate-50 dark:border-slate-800/40 last:border-0"
                  >
                    <div>
                      <span className="font-medium text-slate-900 dark:text-slate-100 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.category}</span>
                    </div>
                    <span className="font-medium text-[11px] text-amber-700 dark:text-amber-400">{formatRupiah(item.price)}</span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-slate-400 text-center">
                  Menu &quot;{comboboxSearch}&quot; tidak ditemukan.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Daftar Item Yang Ditambahkan */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Daftar Pesanan ({selectedList.length})
            </label>
          </div>

          {selectedList.length === 0 ? (
            <div className="p-4 rounded text-center text-slate-400 dark:text-slate-600 bg-slate-50 dark:bg-slate-950/30 space-y-1">
              <FiShoppingBag className="h-5 w-5 mx-auto opacity-40" />
              <p className="text-xs">Belum ada item ditambahkan.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 thin-scroll">
              {selectedList.map(({ product, qty }) => {
                return (
                  <div key={product!.id} className="flex items-center gap-2">
                    {/* Checkbox Centang Cokelat di Kiri */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(product!.id)}
                      className="h-6 w-6 rounded-lg bg-[#3D2514] text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:bg-[#2b190d] transition-colors"
                      title="Hapus item pesanan"
                    >
                      <FiCheck className="h-4 w-4 stroke-[3]" />
                    </button>

                    {/* Card Item */}
                    <div className="flex-1 p-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 space-y-1.5 min-w-0">
                      {/* Baris Atas: Nama Item (Full Width) */}
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block break-words">
                        {product!.name}
                      </span>

                      {/* Baris Bawah: Harga & Kontrol Kuantitas (- n +) */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {formatRupiah(product!.price)}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(product!.id, -1)}
                            className="h-6 w-6 rounded-md bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer text-xs"
                          >
                            <FiMinus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 min-w-4 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(product!.id, 1)}
                            className="h-6 w-6 rounded-md bg-[#3D2514] hover:bg-[#2b190d] text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs text-xs"
                          >
                            <FiPlus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </form>
    </Modal>
  )
}
