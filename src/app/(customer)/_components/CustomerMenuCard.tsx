'use client'

import React from 'react'
import { FiPlus, FiCheck } from 'react-icons/fi'
import { MenuItem } from '@/types/customer'
import { playSound } from '@/utils/sound'

interface CustomerMenuCardProps {
  item: MenuItem
  cartQuantity: number
  onAddToCart: (item: MenuItem) => void
  onUpdateQuantity: (id: string, qty: number) => void
  onOpenGallery?: (item: MenuItem) => void
  formatRupiah: (num: number) => string
}

export const CustomerMenuCard: React.FC<CustomerMenuCardProps> = ({
  item,
  cartQuantity,
  onAddToCart,
  onUpdateQuantity,
  onOpenGallery,
  formatRupiah,
}) => {
  const hasDiscount = Boolean(item.originalPrice && item.originalPrice > item.price)
  const displayImage = item.image && item.image.trim() !== '' ? item.image : '/img/kedai-kopi.webp'

  return (
    <div
      className={`group relative flex flex-col rounded md:rounded-xl bg-white overflow-hidden hover:shadow-md transition-all duration-300 dark:border-slate-800/60 dark:bg-slate-900/40 cursor-pointer ${cartQuantity > 0 ? 'ring-2 ring-emerald-500' : ''}`}
      onClick={() => onOpenGallery && onOpenGallery(item)}
    >
      {/* Product Image Container */}
      <div className="relative h-28 sm:h-36 w-full overflow-hidden bg-amber-50/50 dark:bg-slate-900 flex items-center justify-center group/img shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayImage}
          alt={item.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-105"
        />
      </div>

      {/* Product Metadata & Info */}
      <div className="flex flex-1 flex-col p-3 gap-2 justify-between">
        <div className="space-y-1">
          <h4 className="line-clamp-2 text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200 group-hover:text-[#3D2514] dark:group-hover:text-amber-200 transition-colors h-9">
            {item.name}
          </h4>

          {/* Sold Count */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>56 Terjual</span>
          </div>
        </div>

        {/* Price & Action Block */}
        <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 mt-0.5">
          {/* Harga & Tombol + dalam satu baris */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {formatRupiah(item.price)}
              </span>
              {hasDiscount && (
                <span className="text-[10px] text-slate-400 line-through">
                  {formatRupiah(item.originalPrice!)}
                </span>
              )}
            </div>

            {/* Tombol Ikon + / Ceklis Bulat Full / Teks Habis */}
            {!item.isAvailable ? (
              <span className="text-xs font-normal text-rose-600 dark:text-rose-400">
                Habis
              </span>
            ) : cartQuantity > 0 ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.id, 0) }}
                className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                title="Ditambahkan ke keranjang (Klik untuk hapus)"
              >
                <FiCheck className="h-4 w-4 stroke-[3]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  playSound('present.mp3')
                  onAddToCart(item)
                }}
                className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full bg-[#3D2514] text-amber-50 dark:bg-amber-100 dark:text-[#3D2514] hover:bg-[#2B190E] dark:hover:bg-amber-200 transition-colors cursor-pointer"
                title="Tambah ke Keranjang"
              >
                <FiPlus className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
