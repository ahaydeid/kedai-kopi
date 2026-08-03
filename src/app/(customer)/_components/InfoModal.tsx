'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import {
  FiInstagram,
  FiShoppingBag,
  FiArrowUpRight,
  FiMapPin,
} from 'react-icons/fi'
import { FaWhatsapp, FaTiktok } from 'react-icons/fa6'
import { SiGojek } from 'react-icons/si'
import {
  getStoreProfile,
  getCachedStoreProfileSync,
  StoreProfile,
} from '@/services/supabase/storeProfileService'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SocialLink {
  title: string
  url: string
  icon: React.ReactNode
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<StoreProfile>(() => getCachedStoreProfileSync())

  useEffect(() => {
    if (isOpen) {
      getStoreProfile().then(setProfile)
    }
  }, [isOpen])

  const socialLinks: SocialLink[] = [
    ...(profile.gmapsUrl
      ? [
          {
            title: 'Lokasi Kedai',
            url: profile.gmapsUrl,
            icon: <FiMapPin className="h-6 w-6 text-slate-700 dark:text-slate-200 shrink-0" />,
          },
        ]
      : []),
    ...(profile.whatsapp
      ? [
          {
            title: 'WhatsApp',
            url: profile.whatsapp.startsWith('http') ? profile.whatsapp : `https://wa.me/${profile.whatsapp.replace(/\D/g, '')}`,
            icon: <FaWhatsapp className="h-6 w-6 text-slate-700 dark:text-slate-200 shrink-0" />,
          },
        ]
      : []),
    ...(profile.instagramUrl
      ? [
          {
            title: 'Instagram',
            url: profile.instagramUrl,
            icon: <FiInstagram className="h-6 w-6 text-slate-700 dark:text-slate-200 shrink-0" />,
          },
        ]
      : []),
    ...(profile.tiktokUrl
      ? [
          {
            title: 'TikTok',
            url: profile.tiktokUrl,
            icon: <FaTiktok className="h-6 w-6 text-slate-700 dark:text-slate-200 shrink-0" />,
          },
        ]
      : []),
    ...(profile.shopeefoodUrl
      ? [
          {
            title: 'ShopeeFood',
            url: profile.shopeefoodUrl,
            icon: <FiShoppingBag className="h-6 w-6 text-slate-700 dark:text-slate-200 shrink-0" />,
          },
        ]
      : []),
    ...(profile.gofoodUrl
      ? [
          {
            title: 'GoFood',
            url: profile.gofoodUrl,
            icon: <SiGojek className="h-6 w-6 text-slate-700 dark:text-slate-200 shrink-0" />,
          },
        ]
      : []),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={profile.storeName ? `Informasi & Kontak ${profile.storeName}` : 'Informasi & Kontak Kedai'}
      bodyClassName="p-0"
    >
      <div className="relative w-full overflow-hidden p-4 min-h-[380px] flex flex-col justify-center bg-[#eef2f6] dark:bg-slate-950">
        {/* Background Logo Kedai Watermark Artistik Besar */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.12] dark:opacity-[0.15]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/kedai-kopi.jpeg"
            alt="Kedai Kopi Watermark"
            className="w-96 h-96 object-cover rounded-full filter grayscale contrast-150"
          />
        </div>

        {/* List Card Link Glassmorphism Sesuai Referensi Gambar */}
        <div className="relative z-10 space-y-3 my-auto">
          {socialLinks.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between px-4 py-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/90 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {item.icon}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 tracking-tight truncate">
                    {item.title}
                  </h3>
                </div>
              </div>

              <FiArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-100 shrink-0 ml-2 self-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          ))}
        </div>
      </div>
    </Modal>
  )
}
