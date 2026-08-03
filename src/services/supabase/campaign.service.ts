import { CampaignItem } from '@/core/types/campaign'

export interface ICampaignService {
  getCampaigns(): Promise<CampaignItem[]>
  createCampaign(data: Omit<CampaignItem, 'id' | 'createdAt'>): Promise<CampaignItem>
  toggleCampaignStatus(id: string, isActive: boolean): Promise<void>
  deleteCampaign(id: string): Promise<void>
}

export class SupabaseCampaignService implements ICampaignService {
  async getCampaigns(): Promise<CampaignItem[]> {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kedai_campaigns')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return [
      {
        id: '1',
        campaignName: 'Promo Gajian Kopi Susu',
        productId: '1',
        productName: 'Kopi Susu Aren',
        productImageUrl: '/img/kedai-kopi.jpeg',
        originalPrice: 15000,
        discountPercent: 20,
        priceAfterDiscount: 12000,
        startDate: '2026-08-01',
        endDate: '2026-08-07',
        isActive: true,
      },
    ]
  }

  async createCampaign(data: Omit<CampaignItem, 'id' | 'createdAt'>): Promise<CampaignItem> {
    const existing = await this.getCampaigns()
    const newC: CampaignItem = {
      ...data,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
    }
    const updated = [newC, ...existing]
    if (typeof window !== 'undefined') {
      localStorage.setItem('kedai_campaigns', JSON.stringify(updated))
    }
    return newC
  }

  async toggleCampaignStatus(id: string, isActive: boolean): Promise<void> {
    const existing = await this.getCampaigns()
    const updated = existing.map((c) => (c.id === id ? { ...c, isActive } : c))
    if (typeof window !== 'undefined') {
      localStorage.setItem('kedai_campaigns', JSON.stringify(updated))
    }
  }

  async deleteCampaign(id: string): Promise<void> {
    const existing = await this.getCampaigns()
    const updated = existing.filter((c) => c.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('kedai_campaigns', JSON.stringify(updated))
    }
  }
}
