'use client'

import React, { useState, useEffect } from 'react'
import { FiX, FiHeart, FiTrash2, FiCoffee } from 'react-icons/fi'
import { MenuItem } from '@/types/customer'

interface FavoritesDrawerProps {
  isOpen: boolean
  onClose: () => void
  favoriteItems: MenuItem[]
  onRemoveFavorite: (id: string) => void
  formatRupiah: (num: number) => string
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favoriteItems,
  onRemoveFavorite,
  formatRupiah,
}) => {
  const [isClosing, setIsClosing] = useState<boolean>(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 240)
  }

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end justify-center px-3 sm:px-4 pb-[136px] sm:pb-20 transition-opacity duration-240 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <style jsx>{`
        @keyframes sheetSlideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes sheetSlideDown {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }
        .sheet-animate-up {
          animation: sheetSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform;
        }
        .sheet-animate-down {
          animation: sheetSlideDown 0.24s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: transform;
        }
      `}</style>

      <div
        className={`w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl sm:rounded-3xl max-h-[70vh] flex flex-col shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden ${
          isClosing ? 'sheet-animate-down' : 'sheet-animate-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Indicator */}
        <div className="w-full pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Header Drawer */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FiHeart className="h-5 w-5 text-rose-500 fill-current" />
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-50">
              Menu Favorit Saya
            </h2>
            <span className="text-xs text-slate-400 font-normal">
              ({favoriteItems.length} menu)
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* List Favorite Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 thin-scroll">
          {favoriteItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 py-12">
              <FiHeart className="h-12 w-12 opacity-30 text-rose-400" />
              <p className="text-sm font-medium">Belum ada menu favorit yang disimpan.</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Klik tombol hati [love] di pojok kanan atas kartu menu untuk menyimpan menu favoritmu.
              </p>
            </div>
          ) : (
            favoriteItems.map((item) => {
              const hasImage = Boolean(item.image && item.image.trim() !== '')
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800/80 justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 bg-white dark:bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {hasImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiCoffee className="h-6 w-6 text-slate-200 dark:text-slate-700" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs font-semibold text-[#3D2514] dark:text-amber-200 block mt-0.5">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveFavorite(item.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Hapus dari Favorit"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
