'use client'

import React from 'react'
import Link from 'next/link'
import { FiMapPin, FiPhone, FiClock, FiInstagram } from 'react-icons/fi'

export const CustomerFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img/logo-kedaikopi.webp"
              alt="Kedai Kopi Logo"
              className="h-8 w-8 object-contain"
            />
            <span className="font-extrabold text-base tracking-wider uppercase text-[#3D2514] dark:text-amber-100">
              KEDAI KOPI
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
            Menyajikan kopi kualitas terbaik, varian non-kopi segar, makanan lezat, dan snack renyah untuk menemani hari-harimu.
          </p>
        </div>

        {/* Jam Operasional */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Jam Operasional
          </h4>
          <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <FiClock className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Senin - Minggu</p>
              <p>09:00 - 22:00 WIB</p>
            </div>
          </div>
        </div>

        {/* Lokasi & Kontak */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Lokasi & Kontak
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <FiMapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Jl. Kedai Kopi No. 1, Kota Bandung</span>
            </div>
            <div className="flex items-center gap-2">
              <FiPhone className="h-4 w-4 shrink-0 text-slate-400" />
              <span>+62 812-3456-7890</span>
            </div>
            <div className="flex items-center gap-2">
              <FiInstagram className="h-4 w-4 shrink-0 text-slate-400" />
              <Link href="#" className="hover:text-[#3D2514] dark:hover:text-amber-200 transition-colors">
                @kedaikopi
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 mt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
        <p>© {new Date().getFullYear()} Kedai Kopi. Hak Cipta Dilindungi.</p>
        <p>Beri Kehangatan Suasana Hatimu Setiap Hari.</p>
      </div>
    </footer>
  )
}
