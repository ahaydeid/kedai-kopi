'use client'

import { FiEdit3, FiEye, FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { ActionButton } from '@/components/ui/ActionButton'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table'

export interface MenuItem {
  id: string
  name: string
  mainCategory: 'Minuman' | 'Makanan'
  subCategory: string
  price: number
  points?: number
  stock: 'Tersedia' | 'Habis'
  imageUrl?: string
  images?: string[]
}

interface MenuTableProps {
  items: MenuItem[]
  totalCount?: number
  onDetail?: (item: MenuItem) => void
  onEdit?: (item: MenuItem) => void
  onDelete?: (id: string, name: string) => void
  onToggleStock?: (id: string, currentStock: 'Tersedia' | 'Habis') => void
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function MenuTable({
  items,
  totalCount,
  onDetail,
  onEdit,
  onDelete,
  onToggleStock,
  currentPage,
  pageSize,
  onPageChange,
}: MenuTableProps) {
  const effectiveTotal = totalCount ?? items.length
  const totalPages = Math.ceil(effectiveTotal / pageSize) || 1

  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + items.length, effectiveTotal)
  const paginatedItems = items

  return (
    <div className="space-y-4">
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell scope="col" className="text-center w-12 whitespace-nowrap">No</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Menu</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Kategori Utama</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Sub-Kategori</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Harga</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Poin</TableHeaderCell>
            <TableHeaderCell scope="col" className="whitespace-nowrap">Stok</TableHeaderCell>
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

              {/* Info Menu */}
              <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl || (item.images && item.images.length > 0 ? item.images[0] : '/img/kedai-kopi.webp')}
                    alt={item.name}
                    className="h-9 w-9 rounded-lg object-cover shrink-0"
                  />
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {item.name}
                  </span>
                </div>
              </TableCell>
              
              {/* Kategori Utama */}
              <TableCell className="text-xs font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {item.mainCategory}
              </TableCell>

              {/* Sub-Kategori */}
              <TableCell className="text-xs font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {item.subCategory}
              </TableCell>

              {/* Harga */}
              <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  maximumFractionDigits: 0,
                }).format(item.price)}
              </TableCell>

              {/* Poin */}
              <TableCell className="text-xs font-semibold text-emerald-600 dark:text-slate-300 whitespace-nowrap">
                {item.points ?? Math.floor(item.price / 1000)} <span className='text-[10px] font-normal text-slate-500 dark:text-slate-400'>Poin</span>
              </TableCell>

              {/* Stok */}
              <TableCell className="text-xs font-normal whitespace-nowrap">
                {item.stock === 'Tersedia' ? (
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">Tersedia</span>
                ) : (
                  <span className="text-xs font-normal text-rose-600 dark:text-rose-400">Habis</span>
                )}
              </TableCell>

              {/* Aksi */}
              <TableCell className={`text-center whitespace-nowrap sticky right-0 z-10 ${index % 2 === 1 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-900'}`}>
                <div className="flex items-center justify-center gap-2">
                  <ActionButton
                    variant="detail"
                    onClick={() => {
                      if (onDetail) {
                        onDetail(item)
                      }
                    }}
                    title="Detail Menu"
                  >
                    <FiEye className="h-4 w-4" />
                  </ActionButton>

                  <ActionButton
                    variant="edit"
                    onClick={() => {
                      if (onEdit) {
                        onEdit(item)
                      }
                    }}
                    title="Edit Menu"
                  >
                    <FiEdit3 className="h-4 w-4 text-white" />
                  </ActionButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {items.length === 0 && (
        <div className="p-8 text-center text-zinc-400 text-sm bg-white dark:bg-zinc-900/40 rounded border border-zinc-200/80 dark:border-zinc-800">
          Belum ada data menu di katalog.
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-end gap-2 pr-1">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
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
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
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
