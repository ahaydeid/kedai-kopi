'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/ui/Avatar'
import {
  FiShoppingBag,
  FiTag,
  FiInfo,
  FiChevronRight,
  FiLogOut,
  FiEdit3,
  FiMail,
  FiInstagram,
  FiMapPin,
} from 'react-icons/fi'
import { FaWhatsapp, FaTiktok } from 'react-icons/fa6'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { getCurrentUser, getCachedUserSync, signOut } from '@/services/supabase/authService'
import { createClient } from '@/services/supabase/client'

import { InfoModal } from '../_components/InfoModal'
import { EditProfileModal } from '../_components/EditProfileModal'

const CUSTOMER_POINTS_CACHE_KEY = 'customer_points_cache_v1'
let pointsMemoryCache: number | null = null

export default function CustomerProfilePage() {
  const cachedUser = getCachedUserSync()
  const [user, setUser] = useState<any>(cachedUser)
  const [loading, setLoading] = useState<boolean>(() => !cachedUser)
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const router = useRouter()

  const [userPoints, setUserPoints] = useState<number>(() => {
    if (pointsMemoryCache !== null) return pointsMemoryCache
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CUSTOMER_POINTS_CACHE_KEY)
        if (saved !== null) {
          const parsed = Number(saved)
          pointsMemoryCache = parsed
          return parsed
        }
      } catch {}
    }
    return 0
  })

  useEffect(() => {
    async function loadUser() {
      if (!cachedUser && !user) {
        setLoading(true)
      }
      const u = await getCurrentUser()
      if (!u) {
        router.push('/login')
        return
      }
      setUser(u)

      // Ambil poin dari tabel member_points
      const supabase = createClient()
      const { data: pointsData } = await supabase
        .from('member_points')
        .select('points')
        .eq('user_id', u.id)
        .single()

      const pts = pointsData?.points ?? 0
      setUserPoints(pts)
      pointsMemoryCache = pts
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(CUSTOMER_POINTS_CACHE_KEY, String(pts))
        } catch {}
      }
      setLoading(false)
    }
    loadUser()
  }, [router, cachedUser, user])

  const handleSignOut = () => {
    playSwalSound('confirm')
    Swal.fire({
      title: 'Keluar dari Akun?',
      text: 'Kamu harus login ulang kalau mau masuk lagi',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup',
        cancelButton: '!text-slate-700 !font-semibold',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem(CUSTOMER_POINTS_CACHE_KEY)
          } catch {}
        }
        pointsMemoryCache = null
        await signOut()
        router.push('/login')
      }
    })
  }

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
        <main className="flex-1 w-full max-w-md mx-auto pb-28 space-y-4 p-4">
          {/* Skeleton Header User Info */}
          <section className="bg-white dark:bg-slate-900 p-4 rounded border-none space-y-3.5 animate-pulse">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-44" />
              </div>
            </div>
            <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </section>

          {/* Skeleton Menu Items */}
          <section className="bg-white dark:bg-slate-900 rounded p-4 space-y-3 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
          </section>
        </main>
      </div>
    )
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Pelanggan Kedai'
  const userPhoto = user?.user_metadata?.avatar_url || null
  const userEmail = user?.email || 'Pelanggan'
  const userPhone = user?.user_metadata?.phone || user?.user_metadata?.phone_number || ''

  const handleProfileUpdated = (newName: string, newPhone: string) => {
    setUser((prev: any) => ({
      ...prev,
      user_metadata: {
        ...prev?.user_metadata,
        full_name: newName,
        phone: newPhone,
        phone_number: newPhone,
      },
    }))
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-[#3D2514] selection:text-white">
      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto pb-16 space-y-4">
        {/* Header User Info & Poin Saya */}
        <section className="bg-white dark:bg-slate-900 p-4 rounded border-none space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <Avatar name={userName} photo={userPhoto} size="medium" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate">
                    {userName}
                  </h1>
                </div>
                {userPhone ? (
                  <p className="text-xs text-slate-700 dark:text-slate-200 font-medium truncate mt-0.5">
                    {userPhone}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-normal italic truncate mt-0.5">
                    Belum ada No. HP
                  </p>
                )}
              </div>
            </div>

            {/* Tombol Edit Profil */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Edit Profil"
            >
              <FiEdit3 className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit</span>
            </button>
          </div>

          {/* Ringkasan Poin Saya (Style Card Sky) */}
          <div className="relative overflow-hidden bg-sky-600 p-4 rounded-xl text-white">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative z-10 flex flex-col">
              <span className="text-[11px] font-semibold text-sky-100 tracking-wider uppercase text-left">
                Poin Saya
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-white">
                  {userPoints}
                </span>
                <span className="text-xs font-normal text-sky-100">
                  Poin
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* List Menu Utama Datar & Bersih (Rounded Reguler) */}
        <section className="bg-white dark:bg-slate-900 rounded overflow-hidden border-none divide-y divide-slate-100/60 dark:divide-slate-800/60">
          <Link
            href="/history"
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FiShoppingBag className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Riwayat Pesanan
              </span>
            </div>
            <FiChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          <div
            onClick={() => alert('Voucher Saya')}
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FiTag className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Voucher Saya
              </span>
            </div>
            <FiChevronRight className="h-4 w-4 text-slate-400" />
          </div>

          <div
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <FiInfo className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Info
              </span>
            </div>
            <FiChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </section>

        {/* Email Pelanggan Rata Tengah di Atas Tombol Bulat */}
        <div className="text-center pt-1">
          <p className="text-[11px] font-normal text-slate-400 dark:text-slate-500 truncate">
            {userEmail}
          </p>
        </div>

        {/* Tombol-Tombol Bulat Direct Link (Social & Location) */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <a
            href="https://maps.google.com/?q=Kedai+Kopi"
            target="_blank"
            rel="noopener noreferrer"
            title="Lokasi Kedai (Google Maps)"
            className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 transition-all"
          >
            <FiMapPin className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </a>
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            title="WhatsApp Official"
            className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 transition-all"
          >
            <FaWhatsapp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </a>
          <a
            href="https://instagram.com/kedaikopi.official"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram Official"
            className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 transition-all"
          >
            <FiInstagram className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </a>
          <a
            href="https://tiktok.com/@kedaikopi.official"
            target="_blank"
            rel="noopener noreferrer"
            title="TikTok Official"
            className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 transition-all"
          >
            <FaTiktok className="h-5 w-5 text-slate-900 dark:text-slate-100" />
          </a>
          <a
            href="https://shopee.co.id/universal-link/now-food/shop/kedaikopi"
            target="_blank"
            rel="noopener noreferrer"
            title="ShopeeFood"
            className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center shadow-xs hover:shadow-md hover:scale-105 transition-all"
          >
            <FiShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </a>
        </div>
      </main>

      {/* Modal Info Kedai Kopi */}
      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      {/* Modal Edit Profil Pelanggan */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialName={userName}
        initialPhone={userPhone}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Tombol Keluar Akun - Fixed di atas BottomBar */}
      <div className="fixed bottom-14 left-0 right-0 z-30 flex justify-center pb-3 pt-2">
        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex items-center justify-center gap-1.5 p-2 text-rose-600 dark:text-rose-400 font-normal text-xs hover:underline cursor-pointer transition-colors"
        >
          <FiLogOut className="h-4 w-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  )
}
