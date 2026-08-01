'use client'

import React from 'react'
import { CustomerBottomBar } from '@/components/layout/CustomerBottomBar'
import { FiInfo } from 'react-icons/fi'

export default function CustomerInfoPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-[#3D2514] selection:text-white">
      {/* Top Header App Bar */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
            Info
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-8 pb-28 flex flex-col items-center justify-center text-center">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-none flex flex-col items-center justify-center space-y-3 w-full">
          <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <FiInfo className="h-8 w-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Informasi
          </h2>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Halaman ini belum tersedia.
          </p>
        </div>
      </main>
    </div>
  )
}
