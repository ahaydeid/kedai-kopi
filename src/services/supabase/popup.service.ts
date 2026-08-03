import { PopupAdConfig } from '@/core/types/popup'

export class SupabasePopupService {
  async getPopupConfig(): Promise<PopupAdConfig> {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kedai_popup_config')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return {
      isActive: true,
      title: 'Promo Spesial Gajian Kedai Kopi',
      description: 'Dapatkan diskon spesial hingga 20% untuk semua varian Kopi Susu Aren!',
      imageUrl: '/img/kedai-kopi.jpeg',
      buttonText: 'Pesan Sekarang',
      targetUrl: '/menu',
    }
  }

  async savePopupConfig(config: PopupAdConfig): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kedai_popup_config', JSON.stringify(config))
    }
  }

  async uploadBannerImage(file: File): Promise<string> {
    return URL.createObjectURL(file)
  }
}
