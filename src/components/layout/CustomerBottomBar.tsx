'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { IconType } from 'react-icons'
import { FiCoffee, FiClock } from 'react-icons/fi'
import { HiOutlineUserCircle, HiOutlineClipboardDocumentList } from 'react-icons/hi2'
import { getOrders, subscribeToOrders } from '@/services/supabase/orderService'
import { getCurrentUser } from '@/services/supabase/authService'

interface CustomerBottomBarProps {
  activeTab?: 'menu' | 'orders' | 'history' | 'profile'
  orderBadgeCount?: number
  onTabChange?: (tab: 'menu' | 'orders' | 'history' | 'profile') => void
}

interface TabItem {
  id: 'menu' | 'orders' | 'history' | 'profile'
  label: string
  href: string
  icon: IconType
}

export const CustomerBottomBar: React.FC<CustomerBottomBarProps> = ({
  activeTab,
  orderBadgeCount: customBadgeCount,
  onTabChange,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const [activeOrderCount, setActiveOrderCount] = useState<number>(0)
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function loadActiveCount() {
      const user = await getCurrentUser()
      if (!user) {
        if (isMounted) setActiveOrderCount(0)
        return
      }

      const nameToMatch = (user.user_metadata?.full_name || user.email?.split('@')[0] || '').toLowerCase()
      const userEmail = (user.email || '').toLowerCase()
      const allOrders = await getOrders()

      if (isMounted) {
        const userActiveCount = allOrders.filter(
          (o) =>
            (o.status === 'Menunggu' || o.status === 'Diproses') &&
            (o.customer_name?.toLowerCase() === nameToMatch ||
              o.customer_name?.toLowerCase() === userEmail)
        ).length
        setActiveOrderCount(userActiveCount)
      }
    }

    async function loadUserAvatar() {
      const user = await getCurrentUser()
      if (isMounted) {
        if (user) {
          setUserPhoto(user.user_metadata?.avatar_url || null)
          setUserName(user.user_metadata?.full_name || user.email || null)
        } else {
          setUserPhoto(null)
          setUserName(null)
        }
      }
    }

    loadActiveCount()
    loadUserAvatar()

    // Realtime subscription ke Supabase orders table
    const unsubscribe = subscribeToOrders(() => {
      loadActiveCount()
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [pathname])

  const displayBadgeCount = customBadgeCount !== undefined ? customBadgeCount : activeOrderCount

  const tabs: TabItem[] = [
    { id: 'menu', label: 'Menu', href: '/menu', icon: FiCoffee },
    { id: 'orders', label: 'Pesanan', href: '/orders', icon: HiOutlineClipboardDocumentList },
    { id: 'history', label: 'Riwayat', href: '/history', icon: FiClock },
    { id: 'profile', label: 'Profil', href: '/profile', icon: HiOutlineUserCircle },
  ]

  const currentTab = activeTab || (
    pathname === '/menu' ? 'menu' : pathname === '/orders' ? 'orders' : pathname === '/history' ? 'history' : pathname === '/profile' ? 'profile' : 'menu'
  )

  const handleTabClick = (tab: TabItem) => {
    onTabChange?.(tab.id)
    router.push(tab.href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800/80 px-1 h-14 flex items-center justify-around shadow-lg transition-colors">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors cursor-pointer outline-none ${
              isActive
                ? 'text-[#3D2514] dark:text-amber-100 font-medium'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <div className="relative flex items-center justify-center">
              {tab.id === 'profile' && userPhoto ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={userPhoto}
                  alt="Foto Profil"
                  className={`h-5 w-5 rounded-full object-cover transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                />
              ) : tab.id === 'profile' && userName ? (
                <div
                  className={`h-5 w-5 rounded-full bg-[#3D2514] text-amber-50 text-[10px] font-bold flex items-center justify-center transition-transform ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
              ) : (
                <Icon className={`h-5 w-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              )}

              {tab.id === 'orders' && displayBadgeCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 text-white text-[9.5px] font-medium px-1 shadow-xs animate-in zoom-in duration-200">
                  {displayBadgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default CustomerBottomBar
