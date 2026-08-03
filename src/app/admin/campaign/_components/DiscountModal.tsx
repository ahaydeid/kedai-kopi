'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import Toggle from '@/components/ui/Toggle'
import { FiSearch, FiChevronDown, FiCheck } from 'react-icons/fi'
import { Product } from '@/core/types/product'
import { CampaignItem } from '@/core/types/campaign'
import { IProductService } from '@/core/interfaces/product.interface'

interface DiscountModalProps {
  isOpen: boolean
  onClose: () => void
  onAddDiscount: (data: Omit<CampaignItem, 'id' | 'createdAt'>) => Promise<void>
  productService: IProductService
  formatRupiah: (num: number) => string
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const futureDate = (days: number) => {
  const d = new Date(); d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function DiscountModal({ isOpen, onClose, onAddDiscount, productService, formatRupiah }: DiscountModalProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  const [campaignName, setCampaignName] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [priceAfterDiscount, setPriceAfterDiscount] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [startDate, setStartDate] = useState(today())
  const [endDate, setEndDate] = useState(futureDate(7))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setIsLoadingProducts(true)
    productService.getAllProducts().then(p => { setAllProducts(p); setIsLoadingProducts(false) })
  }, [isOpen, productService])

  const resetForm = () => {
    setCampaignName(''); setSelectedProduct(null); setSearchQuery('')
    setDiscountPercent(0); setPriceAfterDiscount(0); setIsActive(true)
    setStartDate(today()); setEndDate(futureDate(7)); setIsSubmitting(false)
  }

  const handleClose = () => { resetForm(); onClose() }

  const handlePercentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (val < 0 || val > 100) return
    setDiscountPercent(val)
    if (selectedProduct) setPriceAfterDiscount(Math.max(0, Math.round(selectedProduct.price * (1 - val / 100))))
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (!selectedProduct || val < 0 || val > selectedProduct.price) return
    setPriceAfterDiscount(val)
    setDiscountPercent(Math.round(((selectedProduct.price - val) / selectedProduct.price) * 100))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!campaignName.trim() || !selectedProduct || discountPercent <= 0) return
    setIsSubmitting(true)
    try {
      await onAddDiscount({
        campaignName: campaignName.trim(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImageUrl: selectedProduct.imageUrl,
        originalPrice: selectedProduct.price,
        priceAfterDiscount,
        discountPercent,
        isActive,
        startDate,
        endDate,
      })
      resetForm()
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Buat Campaign Diskon Baru" size="lg" bodyClassName="!overflow-visible">
      <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
        {/* Nama Campaign */}
        <div>
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Nama Event / Campaign</label>
          <input type="text" placeholder="Contoh: Promo Gajian Akhir Bulan"
            value={campaignName} onChange={e => setCampaignName(e.target.value)} required
            className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        {/* Pilih Produk — Combobox */}
        <div className="relative">
          <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Pilih Produk</label>
          <div className="relative">
            <input type="text"
              placeholder={selectedProduct ? selectedProduct.name : isLoadingProducts ? 'Memuat produk...' : 'Ketik untuk mencari produk...'}
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value); setIsComboboxOpen(true)
                if (selectedProduct && e.target.value !== selectedProduct.name) {
                  setSelectedProduct(null); setDiscountPercent(0); setPriceAfterDiscount(0)
                }
              }}
              onFocus={() => setIsComboboxOpen(true)}
              disabled={isLoadingProducts}
              className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent pl-10 pr-10 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium" />
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <button type="button" onClick={() => setIsComboboxOpen(!isComboboxOpen)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer">
              <FiChevronDown className="w-4 h-4" />
            </button>
          </div>

          {isComboboxOpen && !isLoadingProducts && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsComboboxOpen(false)} />
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded shadow-lg max-h-56 overflow-y-auto">
                {filtered.length === 0
                  ? <div className="p-3 text-xs text-zinc-400 text-center">Tidak ada produk ditemukan</div>
                  : filtered.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => { setSelectedProduct(p); setSearchQuery(p.name); setPriceAfterDiscount(p.price); setDiscountPercent(0); setIsComboboxOpen(false) }}
                      className="w-full text-left px-3.5 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-3 cursor-pointer border-b border-zinc-100/50 dark:border-zinc-900/50 last:border-b-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded object-cover bg-zinc-100" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{p.name}</p>
                        <p className="text-[10px] text-zinc-400">{formatRupiah(p.price)}{p.isCampaign && <span className="ml-2 text-amber-500">● Sudah di-campaign</span>}</p>
                      </div>
                      {selectedProduct?.id === p.id && <FiCheck className="text-sky-600 w-4 h-4 shrink-0" />}
                    </button>
                  ))
                }
              </div>
            </>
          )}
        </div>

        {/* Kalkulator Diskon */}
        {selectedProduct && (
          <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded border border-zinc-200 dark:border-zinc-800/80">
            <div className="col-span-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
              Kalkulator Diskon — Harga Saat Ini: {formatRupiah(selectedProduct.price)}
            </div>
            <div>
              <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">Diskon (%)</label>
              <div className="relative">
                <input type="number" min="1" max="100" value={discountPercent || ''} onChange={handlePercentChange} placeholder="0"
                  className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent pl-3 pr-8 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">%</span>
              </div>
            </div>
            <div>
              <label className="block font-medium text-zinc-600 dark:text-zinc-400 mb-1">Harga Setelah Diskon (Rp)</label>
              <input type="number" min="0" max={selectedProduct.price} value={priceAfterDiscount || ''} onChange={handlePriceChange} placeholder="Rp 0"
                className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-2 text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold" />
            </div>
          </div>
        )}

        {/* Durasi */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Mulai Berlaku</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">Berakhir Pada</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-2">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Status Awal Campaign</span>
          <Toggle
            leftLabel="Nonaktif"
            rightLabel="Aktif"
            checked={!isActive}
            onChange={(checked) => setIsActive(!checked)}
            leftActiveColorClass="bg-zinc-400 dark:bg-zinc-600"
            rightActiveColorClass="bg-emerald-500"
          />
        </div>

        {/* Footer */}
        <div className="flex gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button type="button" onClick={handleClose}
            className="flex-1 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-semibold py-2.5 rounded transition-colors cursor-pointer">
            Batal
          </button>
          <button type="submit"
            disabled={isSubmitting || !selectedProduct || !campaignName.trim() || discountPercent <= 0}
            className="flex-1 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded transition-colors cursor-pointer">
            {isSubmitting ? 'Menyimpan...' : 'Simpan Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
