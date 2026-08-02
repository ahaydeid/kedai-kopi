'use client'

import React from 'react'
import { FiPrinter, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { ActionButton } from '@/components/ui/ActionButton'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import { formatOrderIdDisplay } from '@/utils/orderId'
import { printThermalReceipt } from '@/utils/printReceipt'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table'

export interface OrderHistoryItem {
  id: string
  orderNumber: string
  customerName: string
  customerAvatarUrl?: string | null
  tableNumber?: string | null
  orderType?: string
  dateTime: string
  itemsSummary: string
  items?: { name: string; price: number }[]
  rawOrderItems?: any[]
  totalAmount: number
  discountAmount?: number
  claimedPoints?: number
  status: 'selesai' | 'dibatalkan'
  createdVia?: 'Pelanggan' | 'Barista'
}

interface OrderHistoryTableProps {
  items: OrderHistoryItem[]
  totalCount?: number
  onDetail?: (order: OrderHistoryItem) => void
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

export function OrderHistoryTable({
  items,
  totalCount,
  onDetail,
  currentPage = 1,
  pageSize = 10,
  onPageChange,
}: OrderHistoryTableProps) {
  const effectiveTotal = totalCount ?? items.length
  const totalPages = Math.ceil(effectiveTotal / pageSize) || 1

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + items.length, effectiveTotal)
  const paginatedItems = items

  const handlePrintClick = (item: OrderHistoryItem) => {
    playSwalSound('confirm')
    const rawList = item.rawOrderItems || item.items || []
    const parsedItems = rawList.map((i: any) => {
      const name = i.menu_name || i.name || 'Produk'
      const match = name.match(/^(\d+)x\s+(.+)$/)
      if (match) {
        const qty = parseInt(match[1], 10)
        return {
          name: match[2],
          quantity: qty,
          price: Math.floor(Number(i.price || 0) / qty),
        }
      }
      return {
        name,
        quantity: i.quantity || 1,
        price: Number(i.price || 0),
      }
    })

    printThermalReceipt({
      orderNumber: item.orderNumber,
      customerName: item.customerName,
      tableNumber: item.orderType === 'takeaway' || !item.tableNumber ? 'Takeaway' : `Meja #${item.tableNumber}`,
      orderType: item.orderType || (item.tableNumber ? 'dine_in' : 'takeaway'),
      dateTime: item.dateTime,
      items: parsedItems.length > 0 ? parsedItems : [{ name: item.itemsSummary, quantity: 1, price: item.totalAmount }],
      totalAmount: item.totalAmount,
    })
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell scope="col" className="text-center w-12 whitespace-nowrap">No</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">ID Pesanan</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Status</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Pelanggan</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Waktu Transaksi</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Rincian Item</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Total Bayar</TableHeaderCell>
            <TableHeaderCell scope="col" className="text-center whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10">Aksi</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {paginatedItems.map((item, index) => (
            <TableRow key={item.id}>
              {/* No */}
              <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300 w-12 text-center whitespace-nowrap">
                {startIndex + index + 1}
              </TableCell>

              {/* ID Pesanan */}
              <TableCell className="text-xs font-normal text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {formatOrderIdDisplay(item.orderNumber)}
              </TableCell>

              {/* Status */}
              <TableCell className="text-xs whitespace-nowrap">
                {item.status === 'selesai' ? (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Selesai</span>
                ) : (
                  <span className="text-xs text-rose-600 dark:text-rose-400">Dibatalkan</span>
                )}
              </TableCell>

              {/* Pelanggan */}
              <TableCell className="text-xs font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Avatar name={item.customerName} photo={item.customerAvatarUrl} size="small" />
                  <span>{item.customerName}</span>
                </div>
              </TableCell>

              {/* Waktu Transaksi */}
              <TableCell className="text-xs font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {item.dateTime}
              </TableCell>

              {/* Rincian Item */}
              <TableCell className="text-xs font-normal text-slate-700 dark:text-slate-300 whitespace-nowrap max-w-xs truncate">
                {item.itemsSummary}
              </TableCell>

              {/* Total Bayar */}
              <TableCell className="text-xs font-normal text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {formatRupiah(item.totalAmount)}
              </TableCell>

              {/* Aksi Sticky */}
              <TableCell className={`text-center whitespace-nowrap sticky right-0 z-10 ${index % 2 === 1 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-900'}`}>
                <div className="flex items-center justify-center gap-2">
                  <ActionButton
                    variant="detail"
                    onClick={() => {
                      if (onDetail) {
                        onDetail(item)
                      }
                    }}
                    title="Detail Riwayat"
                  >
                    <FiEye className="h-4 w-4" />
                  </ActionButton>

                  <ActionButton
                    variant="edit"
                    onClick={() => handlePrintClick(item)}
                    title="Cetak Struk"
                  >
                    <FiPrinter className="h-4 w-4 text-white" />
                  </ActionButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {items.length === 0 && (
        <div className="p-8 text-center text-slate-400 text-sm bg-white dark:bg-slate-900/40 rounded border border-slate-200/80 dark:border-slate-800">
          Belum ada riwayat pesanan.
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-end gap-2 pr-1">
        <button
          onClick={() => onPageChange && onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800/80 cursor-pointer"
          title="Sebelumnya"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>

        <span className="px-1.5 text-xs select-none">
          <span className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</span>
          <span className="font-normal text-slate-400 dark:text-slate-500">/{totalPages}</span>
        </span>

        <button
          onClick={() => onPageChange && onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800/80 cursor-pointer"
          title="Selanjutnya"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
