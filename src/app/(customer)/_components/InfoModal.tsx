'use client'

import React from 'react'
import { Modal } from '@/components/ui/Modal'
import {
  FiInstagram,
  FiShoppingBag,
  FiArrowUpRight,
} from 'react-icons/fi'
import { FaWhatsapp, FaTiktok } from 'react-icons/fa6'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SocialLink {
  title: string
  subtitle: string
  url: string
  icon: React.ReactNode
}

const SOCIAL_LINKS: SocialLink[] = [
  {
    title: 'WhatsApp',
    subtitle: 'wa.me/6281234567890',
    url: 'https://wa.me/6281234567890',
    icon: <FaWhatsapp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  },
  {
    title: 'Instagram',
    subtitle: '@kedaikopi.official',
    url: 'https://instagram.com/kedaikopi.official',
    icon: <FiInstagram className="h-5 w-5 text-pink-600 dark:text-pink-400" />,
  },
  {
    title: 'TikTok',
    subtitle: '@kedaikopi.official',
    url: 'https://tiktok.com/@kedaikopi.official',
    icon: <FaTiktok className="h-5 w-5 text-slate-900 dark:text-slate-100" />,
  },
  {
    title: 'ShopeeFood',
    subtitle: 'shopeefood/kedaikopi.official',
    url: 'https://shopee.co.id/universal-link/now-food/shop/kedaikopi',
    icon: <FiShoppingBag className="h-5 w-5 text-orange-600 dark:text-orange-400" />,
  },
]

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Informasi & Kontak Kedai"
      bodyClassName="p-0"
    >
      <div className="relative w-full overflow-hidden p-4 min-h-[340px] flex flex-col justify-center bg-slate-50/70 dark:bg-slate-950/70">
        {/* Background Logo Kedai Watermark Artistik */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] dark:opacity-[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/img/kedai-kopi.jpeg"
            alt="Kedai Kopi Watermark"
            className="w-80 h-80 object-cover rounded-full filter grayscale contrast-125"
          />
        </div>

        {/* List Card Link Glassmorphism */}
        <div className="relative z-10 space-y-2.5 my-auto">
          {SOCIAL_LINKS.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/80 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              <FiArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 shrink-0 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          ))}
        </div>
      </div>
    </Modal>
  )
}
