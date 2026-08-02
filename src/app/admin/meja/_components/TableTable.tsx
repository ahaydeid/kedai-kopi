'use client'

import React from 'react'
import { ActionButton } from '@/components/ui/ActionButton'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import { TableData } from './TableManagement'

interface TableTableProps {
  items: TableData[]
  totalCount?: number
  onEdit: (table: TableData) => void
  onDelete: (table: TableData) => void
  onShowQr: (table: TableData) => void
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  isOnline?: boolean
}

export function TableTable({
  items,
  totalCount,
  onEdit,
  onDelete,
  onShowQr,
  currentPage,
  pageSize,
  onPageChange,
  isOnline = true,
}: TableTableProps) {
  const effectiveTotal = totalCount ?? items.length
  const totalPages = Math.ceil(effectiveTotal / pageSize) || 1

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + items.length, effectiveTotal)
  const paginatedItems = items.slice(startIndex, startIndex + pageSize)

  const renderBadge = (status: TableData['status']) => {
    switch (status) {
      case 'Tersedia':
        return <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">Tersedia</span>
      case 'Penuh':
        return <span className="text-xs font-normal text-amber-600 dark:text-amber-400">Penuh</span>
      case 'Dipesan':
        return <span className="text-xs font-normal text-sky-600 dark:text-sky-400">Dipesan</span>
      case 'Tidak tersedia':
        return <span className="text-xs font-normal text-rose-600 dark:text-rose-400">Tidak tersedia</span>
    }
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell scope="col" className="text-center w-12 whitespace-nowrap">No</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Nomor Meja</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Kapasitas</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Status</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">QR Pemesanan</TableHeaderCell>
            <TableHeaderCell scope="col" className="text-right whitespace-nowrap">Aksi</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {paginatedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                Tidak ada data meja.
              </TableCell>
            </TableRow>
          ) : (
            paginatedItems.map((item, index) => (
              <TableRow key={item.id}>
                {/* Column No */}
                <TableCell className="text-center font-medium text-slate-700 text-xs dark:text-slate-500">
                  {startIndex + index + 1}
                </TableCell>

                {/* Nomor Meja */}
                <TableCell>
                  <span className="font-bold text-slate-600 dark:text-slate-100">
                    <span className="font-normal text-slate-400">#</span>{item.number}
                  </span>
                </TableCell>

                {/* Kapasitas */}
                <TableCell>
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    {item.capacity} Orang
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell>
                  {renderBadge(item.status)}
                </TableCell>

                {/* QR Code Button */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onShowQr(item)}
                    className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors cursor-pointer hover:underline"
                  >
                    <BsQrCode className="w-3.5 h-3.5" />
                    <span>Lihat QR</span>
                  </button>
                </TableCell>

                {/* Aksi */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <ActionButton title="Edit Meja" variant="edit" disabled={!isOnline} onClick={() => onEdit(item)}>
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </ActionButton>
                    <ActionButton title="Hapus Meja" variant="delete" disabled={!isOnline} onClick={() => onDelete(item)}>
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </ActionButton>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination Footer */}
      {effectiveTotal > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2">
          <div>
            Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{startIndex + 1}</span> -{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{endIndex}</span> dari{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{effectiveTotal}</span> meja
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 font-medium">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
