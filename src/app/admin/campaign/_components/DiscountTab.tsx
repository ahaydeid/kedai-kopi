import React from 'react'
import { FiPlus, FiPercent, FiLoader, FiTrash2, FiCalendar } from 'react-icons/fi'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table'
import { CampaignItem } from '@/core/types/campaign'

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

function formatDate(dateStr: string): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const day = parseInt(parts[2], 10)
  const month = MONTH_NAMES[parseInt(parts[1], 10) - 1] ?? ''
  const year = parts[0]
  return `${day} ${month} ${year}`
}

interface DiscountTabProps {
  campaigns: CampaignItem[]
  isLoading: boolean
  onToggleStatus: (id: string) => void
  onDeleteDiscount: (id: string, campaignName: string) => void
  onOpenModal: () => void
  formatRupiah: (num: number) => string
}

export default function DiscountTab({
  campaigns, isLoading, onToggleStatus, onDeleteDiscount, onOpenModal, formatRupiah
}: DiscountTabProps) {
  return (
    <div className="space-y-4 w-full max-w-full min-w-0">
      <div className="flex items-center justify-between">
        <span className="font-bold text-zinc-900 dark:text-white text-base">Daftar Diskon Berjalan</span>
        <button onClick={onOpenModal}
          className="inline-flex items-center gap-2 rounded bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer">
          <FiPlus className="h-4 w-4" /> Buat Diskon Baru
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-zinc-900 rounded p-8 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center gap-2">
          <FiLoader className="h-8 w-8 animate-spin opacity-50" />
          <p className="text-sm">Memuat data campaign...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded p-8 text-center text-zinc-400 dark:text-zinc-500 space-y-2">
          <FiPercent className="h-10 w-10 mx-auto opacity-40" />
          <p className="font-medium text-sm">Belum ada campaign diskon aktif.</p>
          <p className="text-xs">Klik &quot;Buat Diskon Baru&quot; untuk memulai campaign.</p>
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell className="w-12 text-center whitespace-nowrap">No</TableHeaderCell>
                <TableHeaderCell className="text-center w-24 whitespace-nowrap">Status</TableHeaderCell>
                <TableHeaderCell className="whitespace-nowrap">Nama Campaign</TableHeaderCell>
                <TableHeaderCell className="whitespace-nowrap">Produk</TableHeaderCell>
                <TableHeaderCell className="whitespace-nowrap">Harga Asli</TableHeaderCell>
                <TableHeaderCell className="whitespace-nowrap">Diskon</TableHeaderCell>
                <TableHeaderCell className="whitespace-nowrap">Harga Diskon</TableHeaderCell>
                <TableHeaderCell className="whitespace-nowrap">Durasi</TableHeaderCell>
                <TableHeaderCell className="text-center w-20 min-w-20 whitespace-nowrap sticky right-0 bg-white dark:bg-zinc-900 z-20 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">Aksi</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {campaigns.map((item, index) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="text-center text-zinc-400 dark:text-zinc-500 w-12 text-xs font-medium whitespace-nowrap">{index + 1}</TableCell>
                  <TableCell className="text-center whitespace-nowrap">
                    <button type="button" onClick={() => onToggleStatus(item.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${item.isActive ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${item.isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{item.campaignName}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.productImageUrl} alt={item.productName}
                        className="h-9 w-9 rounded-lg object-cover bg-zinc-50 dark:bg-zinc-800" />
                      <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 block max-w-[180px] truncate" title={item.productName}>
                        {item.productName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 line-through">{formatRupiah(item.originalPrice)}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded">
                      -{item.discountPercent}%
                    </span>
                    <span className="ml-1.5 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      ({formatRupiah(item.originalPrice - item.priceAfterDiscount)})
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatRupiah(item.priceAfterDiscount)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs font-medium text-zinc-800 dark:text-zinc-200">
                    <div className="flex items-center gap-1.5">
                      <FiCalendar className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span>{formatDate(item.startDate)} s/d {formatDate(item.endDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center w-20 min-w-20 whitespace-nowrap sticky right-0 bg-white dark:bg-zinc-900 group-even:bg-zinc-50 dark:group-even:bg-zinc-950 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.25)] z-10">
                    <button onClick={() => onDeleteDiscount(item.id, item.campaignName)}
                      className="p-2 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                      title="Hapus campaign">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
