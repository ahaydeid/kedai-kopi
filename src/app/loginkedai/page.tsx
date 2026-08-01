'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FiLock, FiMail, FiGrid } from 'react-icons/fi'
import { verifyBaristaPin, signInAdminWithPassword } from '@/services/supabase/authService'
import { playSwalSound } from '@/utils/sound'
import Swal from 'sweetalert2'

export default function LoginKedaiPage() {
  const [activeTab, setActiveTab] = useState<'barista' | 'admin'>('barista')

  // State Barista PIN
  const [baristaPin, setBaristaPin] = useState('')
  const [baristaLoading, setBaristaLoading] = useState(false)

  // State Admin Email & Password
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminLoading, setAdminLoading] = useState(false)

  const router = useRouter()

  const handleBaristaLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!baristaPin.trim()) return

    if (baristaPin.length !== 6) {
      playSwalSound('confirm')
      Swal.fire({
        icon: 'warning',
        title: 'PIN Harus 6 Digit',
        text: 'Silakan masukkan 6 digit angka PIN Barista.',
        confirmButtonColor: '#3D2514',
      })
      return
    }

    setBaristaLoading(true)
    const res = await verifyBaristaPin(baristaPin)
    setBaristaLoading(false)

    if (res.success) {
      router.push('/barista')
    } else {
      playSwalSound('confirm')
      Swal.fire({
        icon: 'error',
        title: 'PIN Salah / Tidak Aktif',
        text: 'PIN 6-digit yang Anda masukkan tidak terdaftar.',
        confirmButtonColor: '#ef4444',
      })
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEmail.trim() || !adminPassword) return

    setAdminLoading(true)
    const res = await signInAdminWithPassword(adminEmail, adminPassword)
    setAdminLoading(false)

    if (res.success) {
      router.push('/admin')
    } else {
      playSwalSound('confirm')
      Swal.fire({
        icon: 'error',
        title: 'Gagal Login Admin',
        text: res.error || 'Email atau password Admin tidak valid.',
        confirmButtonColor: '#ef4444',
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-[#3D2514] selection:text-white">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        
        {/* Logo Kedai Kopi & Header Judul */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-full">
            <Image
              src="/img/logo-kedaikopi.webp"
              alt="Logo Kedai Kopi"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Login
          </h1>
        </div>

        {/* Tab Header Garis Tipis Clean */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('barista')}
            className={`flex-1 py-2.5 text-center cursor-pointer transition-colors border-b-2 ${
              activeTab === 'barista'
                ? 'border-[#3D2514] text-[#3D2514] dark:border-amber-200 dark:text-amber-200 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500'
            }`}
          >
            Barista
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2.5 text-center cursor-pointer transition-colors border-b-2 ${
              activeTab === 'admin'
                ? 'border-[#3D2514] text-[#3D2514] dark:border-amber-200 dark:text-amber-200 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:text-slate-500'
            }`}
          >
            Admin
          </button>
        </div>

        {/* Form Container */}
        <div>
          {/* TAB BARISTA */}
          {activeTab === 'barista' && (
            <form onSubmit={handleBaristaLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={6}
                    required
                    value={baristaPin}
                    onChange={(e) => setBaristaPin(e.target.value)}
                    placeholder="• • • • • •"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-9 py-2.5 text-xs text-center font-mono tracking-widest outline-none focus:border-[#3D2514] text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                  <FiGrid className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={baristaLoading}
                className="w-full py-2.5 px-4 rounded-full bg-[#3D2514] hover:bg-[#2B190E] active:scale-[0.98] text-amber-50 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>{baristaLoading ? 'Verifikasi...' : 'Masuk'}</span>
              </button>
            </form>
          )}

          {/* TAB ADMIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Admin
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="username"
                    autoComplete="username"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@kedaikopi.com"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2.5 text-xs outline-none focus:border-[#3D2514] text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                  <FiMail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan Password Admin"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2.5 text-xs outline-none focus:border-[#3D2514] text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  />
                  <FiLock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full py-2.5 px-4 rounded-full bg-[#3D2514] hover:bg-[#2B190E] active:scale-[0.98] text-amber-50 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <span>{adminLoading ? 'Verifikasi...' : 'Masuk'}</span>
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}
