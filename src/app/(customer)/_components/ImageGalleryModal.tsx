'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FiChevronLeft, FiChevronRight, FiCoffee } from 'react-icons/fi'
import { MenuItem } from '@/types/customer'

interface ImageGalleryModalProps {
  isOpen: boolean
  onClose: () => void
  product: MenuItem | null
  formatRupiah?: (num: number) => string
}

export const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  isOpen,
  onClose,
  product,
  formatRupiah,
}) => {
  const [photoIndex, setPhotoIndex] = useState<number>(0)

  // Extract photos for THIS SINGLE PRODUCT (cap max 5 photos per product)
  const productPhotos = (
    product?.images && product.images.length > 0
      ? product.images
      : product?.image
      ? [product.image]
      : []
  ).slice(0, 5)

  const totalPhotos = productPhotos.length

  const handlePrev = useCallback(() => {
    if (totalPhotos <= 1) return
    setPhotoIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos)
  }, [totalPhotos])

  const handleNext = useCallback(() => {
    if (totalPhotos <= 1) return
    setPhotoIndex((prev) => (prev + 1) % totalPhotos)
  }, [totalPhotos])

  // Reset photo index when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setPhotoIndex(0)
    }
  }, [isOpen, product?.id])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handlePrev, handleNext])

  // Return null ALWAYS AFTER all hooks are called (enforces React Rules of Hooks)
  if (!isOpen || !product) return null

  const currentPhotoSrc = productPhotos[photoIndex] || ''
  const hasPhoto = Boolean(currentPhotoSrc && currentPhotoSrc.trim() !== '')

  const isDrink = ['Kopi Signature', 'Non-Kopi'].includes(product.category)
  const mainCategory = isDrink ? 'Minuman' : 'Makanan'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={product.name}
      bodyClassName="p-0"
    >
      <div className="flex flex-col w-full overflow-hidden">
        {/* Container Foto Produk Putih Bersih Identik dengan Card */}
        <div className="relative w-full aspect-square sm:aspect-[4/3] bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
          {/* Counter n/n Foto pada 1 Produk Yang Sama */}
          {totalPhotos > 0 && (
            <span className="absolute top-2.5 left-3 z-20 text-slate-700 dark:text-white text-xs font-medium drop-shadow-xs select-none">
              {photoIndex + 1}/{totalPhotos}
            </span>
          )}

          {/* Chevron Prev (<) untuk Ganti Foto Produk */}
          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-1.5 z-20 p-2 rounded-full bg-slate-900/10 hover:bg-slate-900/30 text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/20 backdrop-blur-[2px] transition-colors cursor-pointer shadow-none"
              title="Foto Produk Sebelumnya"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Display Foto Produk atau Placeholder Identik dengan Card */}
          {hasPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={currentPhotoSrc}
              alt={`${product.name} - Foto ${photoIndex + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
              <FiCoffee className="h-20 w-20 stroke-1 text-slate-200 dark:text-slate-700" />
            </div>
          )}

          {/* Chevron Next (>) untuk Ganti Foto Produk */}
          {totalPhotos > 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-1.5 z-20 p-2 rounded-full bg-slate-900/10 hover:bg-slate-900/30 text-slate-800 dark:text-white border border-slate-200/80 dark:border-white/20 backdrop-blur-[2px] transition-colors cursor-pointer shadow-none"
              title="Foto Selanjutnya"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Footer Ringkas: Kategori & Harga Produk */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Kategori</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {mainCategory} · {product.category}
            </span>
          </div>

          <div className="flex items-end justify-between pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium pb-0.5">
              Harga Menu
            </span>
            {product.price && formatRupiah ? (
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  +{product.points} poin
                </span>
                <span className="text-sm font-extrabold text-[#3D2514] dark:text-amber-200">
                  {formatRupiah(product.price)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  )
}
