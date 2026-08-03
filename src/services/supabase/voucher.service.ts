import { createClient } from './client'
import { VoucherRecord, VoucherValidationResult } from '@/core/types/voucher'

export class SupabaseVoucherService {
  private getClient() {
    return createClient()
  }

  private mapToVoucherRecord(row: any): VoucherRecord {
    return {
      id: row.id,
      code: row.code,
      campaignName: row.campaign_name,
      type: row.type as 'percent' | 'nominal',
      value: Number(row.value),
      minPurchase: Number(row.min_purchase || 0),
      maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
      quota: Number(row.quota || 0),
      usedCount: Number(row.used_count || 0),
      expiryDate: row.expiry_date,
      isActive: Boolean(row.is_active),
      createdAt: row.created_at,
    }
  }

  async getVouchers(): Promise<VoucherRecord[]> {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('kedai_vouchers')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return [
      {
        id: '1',
        code: 'KEDAIMAJU10',
        campaignName: 'Promo Pengguna Baru',
        type: 'percent',
        value: 10,
        minPurchase: 20000,
        quota: 50,
        usedCount: 12,
        expiryDate: '2026-08-31',
        isActive: true,
      },
    ]
  }

  async createVoucher(voucher: Omit<VoucherRecord, 'id' | 'usedCount' | 'createdAt'>): Promise<VoucherRecord> {
    const existing = await this.getVouchers()
    const newV: VoucherRecord = {
      ...voucher,
      id: String(Date.now()),
      usedCount: 0,
      createdAt: new Date().toISOString(),
    }
    const updated = [newV, ...existing]
    if (typeof window !== 'undefined') {
      localStorage.setItem('kedai_vouchers', JSON.stringify(updated))
    }
    return newV
  }

  async toggleVoucherStatus(id: string, isActive: boolean): Promise<void> {
    const existing = await this.getVouchers()
    const updated = existing.map((v) => (v.id === id ? { ...v, isActive } : v))
    if (typeof window !== 'undefined') {
      localStorage.setItem('kedai_vouchers', JSON.stringify(updated))
    }
  }

  async deleteVoucher(id: string): Promise<void> {
    const existing = await this.getVouchers()
    const updated = existing.filter((v) => v.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('kedai_vouchers', JSON.stringify(updated))
    }
  }
}
