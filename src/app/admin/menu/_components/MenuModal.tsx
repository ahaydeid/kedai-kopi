'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FiChevronDown, FiPlus, FiCheck, FiCamera, FiTrash2 } from 'react-icons/fi'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Toggle'
import { MenuItem } from './MenuTable'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'

import { uploadMenuImage } from '@/services/supabase/menuService'

interface MenuModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (menuItem: Omit<MenuItem, 'id'> & { id?: string }) => void
  initialData?: MenuItem | null
  existingSubCategories: string[]
}

export function MenuModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingSubCategories,
}: MenuModalProps) {
  const [name, setName] = useState('')
  const [mainCategory, setMainCategory] = useState<'Minuman' | 'Makanan'>('Minuman')
  const [subCategory, setSubCategory] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [points, setPoints] = useState<number | ''>('')
  const [stock, setStock] = useState<'Tersedia' | 'Habis'>('Tersedia')
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [comboboxSearch, setComboboxSearch] = useState('')
  const comboboxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const openCombobox = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }
    setIsComboboxOpen(true)
  }

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setMainCategory(initialData.mainCategory)
      setSubCategory(initialData.subCategory)
      setComboboxSearch(initialData.subCategory)
      setPrice(initialData.price)
      setPoints(initialData.points ?? Math.floor(initialData.price / 1000))
      setStock(initialData.stock)
      const initialImgs = initialData.images && initialData.images.length > 0
        ? initialData.images
        : initialData.imageUrl
        ? [initialData.imageUrl]
        : []
      setImages(initialImgs.slice(0, 3))
    } else {
      setName('')
      setMainCategory('Minuman')
      setSubCategory('')
      setComboboxSearch('')
      setPrice('')
      setPoints('')
      setStock('Tersedia')
      setImages([])
    }
  }, [initialData, isOpen])

  // Handler Upload Foto ke Supabase Storage (Maksimal 3 Foto)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = 3 - images.length
    if (remainingSlots <= 0) {
      playSwalSound('confirm')
      Swal.fire({
        icon: 'warning',
        title: 'Batas Maksimal 3 Foto',
        text: 'Anda hanya dapat mengunggah maksimal 3 foto untuk setiap menu.',
        confirmButtonColor: '#0284c7',
      })
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)
    setIsUploading(true)

    for (const file of filesToUpload) {
      const publicUrl = await uploadMenuImage(file)
      if (publicUrl) {
        setImages((prev) => {
          if (prev.length >= 3) return prev
          return [...prev, publicUrl]
        })
      } else {
        playSwalSound('confirm')
        Swal.fire({
          icon: 'error',
          title: 'Gagal Upload Foto',
          text: 'Pastikan bucket menu-images di Supabase Storage sudah dibuat dan bersifat public.',
          confirmButtonColor: '#ef4444',
        })
      }
    }
    setIsUploading(false)
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        comboboxRef.current && !comboboxRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsComboboxOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSubCats = existingSubCategories.filter((cat) =>
    cat.toLowerCase().includes(comboboxSearch.toLowerCase())
  )

  const isExactMatch = existingSubCategories.some(
    (cat) => cat.toLowerCase() === comboboxSearch.trim().toLowerCase()
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!subCategory.trim() && !comboboxSearch.trim()) return
    if (price === '' || price < 0) return

    const finalSubCat = subCategory.trim() || comboboxSearch.trim()
    const numericPrice = Number(price)
    const numericPoints = points === '' ? Math.floor(numericPrice / 1000) : Number(points)

    onSave({
      id: initialData?.id,
      name: name.trim(),
      mainCategory,
      subCategory: finalSubCat,
      price: numericPrice,
      points: numericPoints,
      stock,
      imageUrl: images[0] || undefined,
      images,
    })

    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Menu' : 'Tambah Menu Baru'}
      size="xl"
      bodyClassName="p-5 sm:p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Upload Foto Menu (Maksimal 3 Foto) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Foto Menu <span className="text-slate-400 font-normal">(Maks. 3 Foto)</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {images.length}/3
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {images.map((img, idx) => (
              <div key={idx} className="relative h-20 w-full rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden group bg-slate-50 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-90 hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                  title="Hapus foto"
                >
                  <FiTrash2 className="h-3 w-3" />
                </button>
              </div>
            ))}

            {images.length < 3 && (
              <label className={`h-20 w-full rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 bg-slate-50/50 dark:bg-slate-950 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <FiCamera className="h-5 w-5" />
                <span className="text-[10px] font-medium">{isUploading ? 'Mengunggah...' : '+ Tambah Foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Nama Menu */}
        <div className="space-y-1.5">
          <label className="block font-medium text-slate-700 dark:text-slate-300">
            Nama Menu <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Kopi Susu Signature"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        {/* Grid Kategori Utama & Sub-Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Kategori Utama */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Kategori Utama <span className="text-rose-500">*</span>
            </label>
            <select
              value={mainCategory}
              onChange={(e) => setMainCategory(e.target.value as 'Minuman' | 'Makanan')}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="Minuman">Minuman</option>
              <option value="Makanan">Makanan</option>
            </select>
          </div>

          {/* Sub-Kategori Combobox */}
          <div className="space-y-1.5 relative" ref={comboboxRef}>
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Sub-Kategori <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                required
                value={comboboxSearch}
                onFocus={openCombobox}
                onChange={(e) => {
                  setComboboxSearch(e.target.value)
                  setSubCategory(e.target.value)
                  openCombobox()
                }}
                placeholder="Pilih atau ketik baru..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 pr-8 text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => {
                  if (isComboboxOpen) {
                    setIsComboboxOpen(false)
                  } else {
                    openCombobox()
                  }
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <FiChevronDown className={`h-4 w-4 transition-transform ${isComboboxOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Combobox Dropdown via Portal (fixed positioning, escapes modal overflow) */}
            {isComboboxOpen && dropdownPos && typeof document !== 'undefined' && createPortal(
              <div
                ref={dropdownRef}
                style={{
                  position: 'fixed',
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  width: dropdownPos.width,
                  zIndex: 9999,
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-48 overflow-y-auto py-1"
              >
                {filteredSubCats.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSubCategory(cat)
                      setComboboxSearch(cat)
                      setIsComboboxOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    <span>{cat}</span>
                    {subCategory === cat && <FiCheck className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
                  </button>
                ))}

                {!isExactMatch && comboboxSearch.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => {
                      const newCat = comboboxSearch.trim()
                      setSubCategory(newCat)
                      setComboboxSearch(newCat)
                      setIsComboboxOpen(false)
                    }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 font-semibold cursor-pointer border-t border-slate-100 dark:border-slate-800"
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    <span>Buat &quot;{comboboxSearch.trim()}&quot;</span>
                  </button>
                )}

                {filteredSubCats.length === 0 && comboboxSearch.trim() === '' && (
                  <div className="px-3 py-2 text-xs text-slate-400 text-center">
                    Ketik untuk membuat sub-kategori baru
                  </div>
                )}
              </div>,
              document.body
            )}
          </div>
        </div>

        {/* Grid Harga, Poin, Stok */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Harga */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Harga (Rp) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={price}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Number(e.target.value)
                setPrice(val)
                if (points === '' && typeof val === 'number') {
                  setPoints(Math.floor(val / 1000))
                }
              }}
              placeholder="20000"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Poin */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Poin
            </label>
            <input
              type="number"
              min="0"
              value={points}
              onChange={(e) => setPoints(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="20"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>

          {/* Status Stok */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700 dark:text-slate-300">
              Stok <span className="text-rose-500">*</span>
            </label>
            <div>
              <Toggle
                leftLabel="Habis"
                rightLabel="Tersedia"
                checked={stock === 'Habis'}
                onChange={(isHabis) => setStock(isHabis ? 'Habis' : 'Tersedia')}
                fontSizeClass="text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-600 transition-colors cursor-pointer shadow-xs"
          >
            {initialData ? 'Simpan Perubahan' : 'Tambah Menu'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
