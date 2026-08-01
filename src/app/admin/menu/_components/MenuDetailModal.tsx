'use client'

import React, { useState, useEffect } from 'react'
import { FiTrash2, FiCoffee } from 'react-icons/fi'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { MenuItem } from './MenuTable'

interface MenuDetailModalProps {
  isOpen: boolean
  onClose: () => void
  item: MenuItem | null
  onDelete: (id: string, name: string) => void
}

export function MenuDetailModal({
  isOpen,
  onClose,
  item,
  onDelete,
}: MenuDetailModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    setActiveImageIndex(0)
  }, [item, isOpen])

  if (!isOpen || !item) return null

  const imagesList = item.images && item.images.length > 0
    ? item.images
    : item.imageUrl
    ? [item.imageUrl]
    : []

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num)
  }

  const handleDelete = () => {
    onClose()
    onDelete(item.id, item.name)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Menu"
      size="md"
    >
      <div className="space-y-5 text-sm p-4 sm:p-5">
        {/* Gambar Produk */}
        {imagesList.length > 0 ? (
          <div className="space-y-2">
            <div className="h-48 w-full rounded overflow-hidden bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagesList[activeImageIndex] || imagesList[0]}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            </div>
            {imagesList.length > 1 && (
              <div className="flex items-center gap-2">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`h-12 w-12 rounded overflow-hidden cursor-pointer transition-all ${
                      activeImageIndex === idx
                        ? 'ring-2 ring-zinc-900 dark:ring-zinc-100'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumb ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-36 w-full rounded bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center gap-2 text-zinc-400 dark:text-zinc-600">
            <FiCoffee className="h-10 w-10" />
            <span className="text-xs">Belum Ada Foto Produk</span>
          </div>
        )}

        {/* Tabel Detail Informasi Menu */}
        <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900/50 text-xs">
          <div className="p-3 flex items-start justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">Nama Menu</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-right">{item.name}</span>
          </div>

          <div className="p-3 flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">Kategori Utama</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.mainCategory}</span>
          </div>

          <div className="p-3 flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">Sub-Kategori</span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.subCategory}</span>
          </div>

          <div className="p-3 flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">Harga</span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{formatRupiah(item.price)}</span>
          </div>

          <div className="p-3 flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">Poin</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{item.points ?? Math.floor(item.price / 1000)} Poin</span>
          </div>

          <div className="p-3 flex items-center justify-between gap-4">
            <span className="text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">Status Stok</span>
            <span className={`font-semibold ${item.stock === 'Tersedia' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {item.stock}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-normal text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-colors"
          >
            Hapus Menu
          </button>

          <Button variant="secondary" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  )
}
