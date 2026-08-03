import React, { useState } from 'react'
import { FiPlus, FiCheck, FiTrash2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { VoucherRecord } from '@/core/types/voucher'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface VoucherTabProps {
  vouchers: VoucherRecord[]
  onAddVoucher: (newVoucher: Omit<VoucherRecord, 'id' | 'usedCount' | 'createdAt'>) => Promise<void>
  onToggleVoucher: (id: string, currentStatus: boolean) => Promise<void>
  onDeleteVoucher: (id: string, code: string) => Promise<void>
  formatRupiah: (num: number) => string
}

export default function VoucherTab({
  vouchers,
  onAddVoucher,
  onToggleVoucher,
  onDeleteVoucher,
  formatRupiah
}: VoucherTabProps) {
  const [showModal, setShowModal] = useState(false)
  const [voucherCampaignName, setVoucherCampaignName] = useState('')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherType, setVoucherType] = useState<'percent' | 'nominal'>('percent')
  const [voucherValue, setVoucherValue] = useState(10)
  const [voucherMinPurchase, setVoucherMinPurchase] = useState(0)
  const [voucherQuota, setVoucherQuota] = useState(10)
  const [voucherExpiry, setVoucherExpiry] = useState('2026-08-01')

  const resetForm = () => {
    setVoucherCampaignName('')
    setVoucherCode('')
    setVoucherType('percent')
    setVoucherValue(10)
    setVoucherMinPurchase(0)
    setVoucherQuota(10)
  }

  const handleClose = () => {
    resetForm()
    setShowModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!voucherCode.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Silakan isi kode voucher.',
        confirmButtonColor: '#0369a1'
      })
      return
    }

    const cleanCode = voucherCode.toUpperCase().replace(/\s+/g, '')

    if (vouchers.some(v => v.code === cleanCode)) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: 'Kode voucher sudah terdaftar.',
        confirmButtonColor: '#0369a1'
      })
      return
    }

    try {
      await onAddVoucher({
        code: cleanCode,
        campaignName: voucherCampaignName.trim() || 'Promo Spesial Toko',
        type: voucherType,
        value: voucherValue,
        minPurchase: voucherMinPurchase,
        quota: voucherQuota,
        expiryDate: voucherExpiry,
        isActive: true
      })
      handleClose()
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: err?.message || 'Gagal menyimpan voucher.',
        confirmButtonColor: '#0369a1'
      })
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-zinc-800 dark:text-zinc-200">Daftar Voucher Toko</span>
          <Badge variant="info">{vouchers.length} Voucher</Badge>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowModal(true)} className="rounded">
          <FiPlus className="h-3.5 w-3.5" />
          Buat Voucher Baru
        </Button>
      </div>

      {/* Voucher Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-1">
        {vouchers.length === 0 && (
          <div className="col-span-full text-center py-10 text-zinc-400 dark:text-zinc-500 text-sm">
            Belum ada voucher. Buat voucher pertama Anda!
          </div>
        )}
        {vouchers.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
              item.isActive
                ? 'bg-zinc-50/50 dark:bg-zinc-950/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/20'
                : 'bg-zinc-100/50 dark:bg-zinc-900/10 opacity-60'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
                  {item.code}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant={item.isActive ? 'success' : 'secondary'}>
                    {item.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  <button
                    onClick={() => {
                      playSwalSound('confirm')
                      Swal.fire({
                        title: 'Hapus Voucher?',
                        text: `Voucher ${item.code} akan dihapus permanen.`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#ef4444',
                        cancelButtonColor: '#f1f5f9',
                        confirmButtonText: 'Ya, Hapus!',
                        cancelButtonText: 'Batal'
                      }).then(async (res) => {
                        if (res.isConfirmed) {
                          await onDeleteVoucher(item.id, item.code)
                        }
                      })
                    }}
                    className="text-zinc-400 hover:text-rose-500 p-1 transition-colors"
                    title="Hapus Voucher"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {item.campaignName && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium truncate">{item.campaignName}</p>
              )}

              <div className="pt-2">
                <p className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  {item.type === 'percent' ? `Diskon ${item.value}%` : `Diskon ${formatRupiah(item.value)}`}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                  Min. Belanja: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{formatRupiah(item.minPurchase)}</span>
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-200/50 dark:border-zinc-800/50 pt-2.5 mt-1 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
              <div className="space-y-0.5">
                <p>Kuota: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.usedCount}/{item.quota} klaim</span></p>
                <p>Kadaluarsa: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.expiryDate}</span></p>
              </div>
              <Button
                variant={item.isActive ? 'ghost' : 'secondary'}
                size="xs"
                onClick={async () => {
                  const actionText = item.isActive ? 'menonaktifkan' : 'mengaktifkan'
                  playSwalSound('confirm')
                  const result = await Swal.fire({
                    title: 'Ubah Status Voucher?',
                    text: `Apakah Anda yakin ingin ${actionText} voucher ${item.code}?`,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#0369a1',
                    cancelButtonColor: '#f1f5f9',
                    confirmButtonText: 'Ya, Ubah!',
                    cancelButtonText: 'Batal'
                  })
                  if (result.isConfirmed) {
                    await onToggleVoucher(item.id, item.isActive)
                  }
                }}
                className="rounded-lg"
              >
                {item.isActive ? 'Matikan' : 'Aktifkan'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Buat Voucher Baru */}
      <Modal isOpen={showModal} onClose={handleClose} title="Buat Voucher Baru" size="md">
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Nama Event / Campaign
            </label>
            <input
              type="text"
              placeholder="Contoh: Promo Gajian Akhir Bulan"
              value={voucherCampaignName}
              onChange={(e) => setVoucherCampaignName(e.target.value)}
              className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Kode Voucher
            </label>
            <input
              type="text"
              placeholder="Contoh: LAQZERHEBOH"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value)}
              className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono placeholder:font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Tipe Potongan
              </label>
              <select
                value={voucherType}
                onChange={(e) => {
                  setVoucherType(e.target.value as 'percent' | 'nominal')
                  setVoucherValue(e.target.value === 'percent' ? 10 : 50000)
                }}
                className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <option value="percent" className="dark:bg-zinc-900">Persentase (%)</option>
                <option value="nominal" className="dark:bg-zinc-900">Nominal Rupiah</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Nilai Potongan
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={voucherValue}
                  onChange={(e) => setVoucherValue(Number(e.target.value))}
                  className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent pl-3.5 pr-8 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">
                  {voucherType === 'percent' ? '%' : 'Rp'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Min. Belanja (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={voucherMinPurchase}
                onChange={(e) => setVoucherMinPurchase(Number(e.target.value))}
                className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Kuota Voucher
              </label>
              <input
                type="number"
                min="1"
                value={voucherQuota}
                onChange={(e) => setVoucherQuota(Number(e.target.value))}
                className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Tanggal Kadaluarsa
            </label>
            <input
              type="date"
              value={voucherExpiry}
              onChange={(e) => setVoucherExpiry(e.target.value)}
              className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="secondary" onClick={handleClose} className="rounded flex-1">
              Batal
            </Button>
            <Button type="submit" variant="primary" className="rounded flex-1">
              <FiCheck className="h-4 w-4" />
              Aktifkan Voucher
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
