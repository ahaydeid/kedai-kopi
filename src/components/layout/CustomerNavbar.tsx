'use client'

import React from 'react'
import Link from 'next/link'
import { FiHeart, FiSearch } from 'react-icons/fi'

interface CustomerNavbarProps {
  favoriteCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  onOpenFavorites: () => void
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({
  favoriteCount,
  searchQuery,
  setSearchQuery,
  onOpenFavorites,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/logo-kedaikopi.webp"
            alt="Kedai Kopi Logo"
            className="h-8 w-8 sm:h-9 sm:w-9 object-contain transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col justify-center">
            {/* Title: 2 lines on mobile, 1 line on sm+ */}
            <span className="font-extrabold text-xs sm:text-base leading-tight tracking-wider uppercase text-[#3D2514] dark:text-amber-100 flex flex-col sm:flex-row sm:gap-1">
              <span>KEDAI</span>
              <span>KOPI</span>
            </span>

            {/* Tagline: Hidden on mobile, visible on sm+ */}
            <span className="hidden sm:block text-[8px] sm:text-[9px] text-slate-500 dark:text-slate-400 font-medium tracking-wide leading-none mt-0.5">
              Coffee, Drinks, Snack, Dessert, Bites, Good Food, Good Mood
            </span>
          </div>
        </Link>

        {/* Search Bar - Responsive */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kopi, makanan, atau snack..."
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-[#3D2514] dark:focus:border-amber-300 rounded-full text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none transition-all"
            />
          </div>
        </div>

        {/* Favorites Trigger Button ONLY */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenFavorites}
            className="relative p-2 text-slate-700 hover:text-rose-500 dark:text-slate-300 dark:hover:text-rose-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer outline-none"
            aria-label="Buka Favorit"
            title="Menu Favorit Saya"
          >
            <FiHeart className="h-5 w-5" />
            {favoriteCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
