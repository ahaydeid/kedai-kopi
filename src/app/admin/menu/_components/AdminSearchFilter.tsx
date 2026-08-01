'use client'

import { useState } from 'react'
import { FiSearch, FiX } from 'react-icons/fi'

interface AdminSearchFilterProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategoryFilter: string
  onCategoryFilterChange: (cat: string) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  subCategories?: string[]
}

export function AdminSearchFilter({
  searchQuery,
  onSearchChange,
  selectedCategoryFilter,
  onCategoryFilterChange,
  pageSize,
  onPageSizeChange,
  subCategories = [],
}: AdminSearchFilterProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onSearchChange('')
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
      {/* Input Pencarian Bergaya Kapsul Membulat (Expand Saat Fokus) */}
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={isFocused ? 'Cari berdasarkan nama menu...' : 'Cari...'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`transition-all duration-300 ease-in-out rounded-full border border-slate-200 bg-white py-2 pl-10 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 ${
            isFocused || searchQuery ? 'w-64 sm:w-96 pr-10' : 'w-28 pr-4'
          }`}
        />
        {searchQuery && (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
            title="Bersihkan Pencarian"
          >
            <FiX className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter Kategori & Pagination Size Dropdown */}
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="py-2 px-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900/50 bg-transparent cursor-pointer text-slate-700 dark:text-slate-300"
          title="Tampilkan per halaman"
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>

        <select
          value={selectedCategoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className="py-2 px-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900/50 bg-transparent cursor-pointer text-slate-700 dark:text-slate-300"
        >
          <option value="semua">Semua</option>
          {subCategories.map((subCat) => (
            <option key={subCat} value={subCat}>
              {subCat}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
