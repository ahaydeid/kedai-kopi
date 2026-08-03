'use client'

import React, { useState } from 'react'
import { TableTable } from './TableTable'
import { Button } from '@/components/ui/Button'
import { ActionButton } from '@/components/ui/ActionButton'
import { Modal } from '@/components/ui/Modal'
import { QRCodeSVG } from 'qrcode.react'
import { Badge } from '@/components/ui/Badge'
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiGrid, FiList, FiUsers, FiChevronLeft, FiChevronRight, FiPrinter, FiCheck } from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'
import Swal from 'sweetalert2'
import { playSound, playSwalSound } from '@/utils/sound'

import { getTables, getCachedTablesSync, createTable, updateTable, deleteTable, subscribeToTables, TableItem } from '@/services/supabase/tableService'
import { getCachedStoreProfileSync } from '@/services/supabase/storeProfileService'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export interface TableData {
  id: string
  number: string
  capacity: number
  status: 'Tersedia' | 'Penuh' | 'Dipesan' | 'Tidak tersedia'
  qrUrl: string
}

function getCustomerBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('url_masuk_pelanggan')
    if (saved) return saved.replace(/\/+$/, '')
    return window.location.origin
  }
  return 'https://kedaikopi.ahadi.my.id'
}

export function TableManagement() {
  const isOnline = useNetworkStatus()
  const [tables, setTables] = useState<TableData[]>(() => {
    const syncCache = getCachedTablesSync()
    if (syncCache.length > 0) {
      const baseUrl = getCustomerBaseUrl()
      return syncCache.map((t) => ({
        id: t.id,
        number: t.number,
        capacity: t.capacity,
        status: t.status,
        qrUrl: `${baseUrl}?meja=${t.number}`,
      }))
    }
    return []
  })
  const [loading, setLoading] = useState(() => getCachedTablesSync().length === 0)
  const [search, setSearch] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [statusFilter, setStatusFilter] = useState<'semua' | 'Tersedia' | 'Penuh' | 'Dipesan' | 'Tidak tersedia'>('semua')
  const [currentPage, setCurrentPage] = useState(1)

  const storeProfile = React.useMemo(() => getCachedStoreProfileSync(), [])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<TableData | null>(null)
  const [formData, setFormData] = useState({ number: '', capacity: 4, status: 'Tersedia' as TableData['status'] })

  // QR Modal State
  const [qrModalTable, setQrModalTable] = useState<TableData | null>(null)
  const [isPrintingAll, setIsPrintingAll] = useState(false)
  const [isPrintOptionsOpen, setIsPrintOptionsOpen] = useState(false)
  const [printMode, setPrintMode] = useState<'with_table' | 'no_table'>('with_table')
  const [isCopied, setIsCopied] = useState(false)

  const sortedTables = React.useMemo(() => {
    return [...tables].sort((a, b) => {
      const numA = parseInt(a.number, 10)
      const numB = parseInt(b.number, 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.number.localeCompare(b.number)
    })
  }, [tables])

  const tablePairs = React.useMemo(() => {
    const pairs: TableData[][] = []
    for (let i = 0; i < sortedTables.length; i += 2) {
      pairs.push(sortedTables.slice(i, i + 2))
    }
    return pairs
  }, [sortedTables])

  const handleOpenPrintOptions = () => {
    if (tables.length === 0) return
    setIsPrintOptionsOpen(true)
  }

  const handlePrintAllQRs = (mode: 'with_table' | 'no_table') => {
    setPrintMode(mode)
    setIsPrintOptionsOpen(false)
    setQrModalTable(null)
    setIsPrintingAll(true)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  React.useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingAll(false)
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  const fetchTablesFromSupabase = React.useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    const data = await getTables()
    const baseUrl = getCustomerBaseUrl()
    const mapped: TableData[] = data.map((t) => ({
      id: t.id,
      number: t.number,
      capacity: t.capacity,
      status: t.status,
      qrUrl: `${baseUrl}?meja=${t.number}`,
    }))
    setTables(mapped)
    setLoading(false)
  }, [])

  React.useEffect(() => {
    fetchTablesFromSupabase(false)

    const unsubscribe = subscribeToTables(() => {
      fetchTablesFromSupabase(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchTablesFromSupabase])

  const filteredTables = tables.filter((t) => {
    const matchSearch = t.number.includes(search) || t.status.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'semua' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalTersedia = tables.filter((t) => t.status === 'Tersedia').length
  const totalTerisi = tables.filter((t) => t.status === 'Penuh').length
  const totalDipesan = tables.filter((t) => t.status === 'Dipesan').length

  const handleOpenAdd = () => {
    const nextNum = String(tables.length + 1).padStart(2, '0')
    setEditingTable(null)
    setFormData({ number: nextNum, capacity: 4, status: 'Tersedia' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (table: TableData) => {
    setEditingTable(table)
    setFormData({ number: table.number, capacity: table.capacity, status: table.status })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.number.trim()) return

    if (editingTable) {
      const res = await updateTable(editingTable.id, {
        number: formData.number,
        capacity: Number(formData.capacity),
        status: formData.status,
      })
      if (res) {
        playSwalSound('success')
        Swal.fire({
          title: 'Berhasil Diperbarui',
          text: `Meja #${formData.number} telah diperbarui.`,
          icon: 'success',
          confirmButtonColor: '#3D2514',
        })
      }
    } else {
      const res = await createTable({
        number: formData.number,
        capacity: Number(formData.capacity),
        status: formData.status,
      })
      if (res) {
        playSwalSound('success')
        Swal.fire({
          title: 'Meja Ditambahkan',
          text: `Meja #${formData.number} telah ditambahkan.`,
          icon: 'success',
          confirmButtonColor: '#3D2514',
        })
      }
    }
    setIsModalOpen(false)
    fetchTablesFromSupabase(true)
  }

  const handleDelete = (table: TableData) => {
    playSwalSound('confirm')
    Swal.fire({
      title: 'Hapus Meja?',
      text: `Apakah Anda yakin ingin menghapus Meja #${table.number}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        const success = await deleteTable(table.id)
        if (success) {
          playSwalSound('success')
          Swal.fire({
            title: 'Dihapus',
            text: `Meja #${table.number} telah dihapus.`,
            icon: 'success',
            confirmButtonColor: '#3D2514',
          })
          fetchTablesFromSupabase(true)
        }
      }
    })
  }

  const getStatusBadge = (status: TableData['status']) => {
    switch (status) {
      case 'Tersedia':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60'
      case 'Penuh':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
      case 'Dipesan':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/60'
    }
  }

  const [pageSize, setPageSize] = useState(10)

  // Reset page saat pencarian berubah
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search])

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Manajemen Meja
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={handleOpenPrintOptions}
            variant="secondary"
            size="sm"
            disabled={tables.length === 0}
            className="flex items-center gap-1.5 shrink-0"
            title="Cetak Seluruh QR Code Meja"
          >
            <FiPrinter className="w-4 h-4" />
            <span>Cetak QR</span>
          </Button>

          <Button onClick={handleOpenAdd} variant="primary" size="sm" className="flex items-center gap-1.5 shrink-0">
            <FiPlus className="w-4 h-4" />
            <span>Tambah Meja</span>
          </Button>
        </div>
      </div>

      {/* Toolbar: Search, Page Size & View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        {/* Input Pencarian Bergaya Kapsul Membulat */}
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isFocused ? 'Cari nomor meja...' : 'Cari...'}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`transition-all duration-300 ease-in-out rounded-full border border-slate-200 bg-white py-2 pl-10 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 ${
              isFocused || search ? 'w-64 sm:w-96 pr-10' : 'w-28 pr-4'
            }`}
          />
          {search && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center justify-center cursor-pointer"
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Dropdown Size Page */}
          <select 
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="py-2 px-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900/50 bg-transparent cursor-pointer text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          {/* View Switcher Toggle (Table vs Grid) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FiList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FiGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredTables.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200/80 dark:border-slate-800">
          Tidak ada meja yang sesuai dengan pencarian atau filter.
        </div>
      ) : viewMode === 'grid' ? (
        /* Visual Card Grid Layout with Pagination */
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {filteredTables.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group relative"
              >
                {/* Card Header: Table Number & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="font-normal text-xs text-slate-400">#</span>{t.number}
                  </span>
                  {t.status === 'Tersedia' ? (
                    <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">Tersedia</span>
                  ) : t.status === 'Penuh' ? (
                    <span className="text-xs font-normal text-amber-600 dark:text-amber-400">Penuh</span>
                  ) : t.status === 'Dipesan' ? (
                    <span className="text-xs font-normal text-sky-600 dark:text-sky-400">Dipesan</span>
                  ) : (
                    <span className="text-xs font-normal text-rose-600 dark:text-rose-400">Tidak tersedia</span>
                  )}
                </div>

                {/* Card Body: Capacity Info */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <FiUsers className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.capacity} Orang</span>
                </div>

                {/* Card Footer: Quick Actions */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setQrModalTable(t)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <BsQrCode className="w-3 h-3" />
                    <span>QR Code</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <ActionButton
                      title={isOnline ? 'Edit Meja' : 'Membutuhkan koneksi internet'}
                      variant="edit"
                      disabled={!isOnline}
                      onClick={() => handleOpenEdit(t)}
                    >
                      <FiEdit2 className="w-3 h-3" />
                    </ActionButton>
                    <ActionButton
                      title={isOnline ? 'Hapus Meja' : 'Membutuhkan koneksi internet'}
                      variant="delete"
                      disabled={!isOnline}
                      onClick={() => handleDelete(t)}
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </ActionButton>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid View Pagination Footer */}
          {filteredTables.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2">
              <div>
                Menampilkan <span className="font-semibold text-slate-700 dark:text-slate-300">{(currentPage - 1) * pageSize + 1}</span> -{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{Math.min(currentPage * pageSize, filteredTables.length)}</span> dari{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredTables.length}</span> meja
              </div>

              {Math.ceil(filteredTables.length / pageSize) > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 font-medium">
                    {currentPage} / {Math.ceil(filteredTables.length / pageSize)}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === Math.ceil(filteredTables.length / pageSize)}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Detailed Table View via Reusable TableTable */
        <TableTable
          items={filteredTables}
          totalCount={filteredTables.length}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
          onShowQr={setQrModalTable}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          isOnline={isOnline}
        />
      )}

      {/* Modal Form Tambah / Edit Meja */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? `Edit Meja #${editingTable.number}` : 'Tambah Meja Baru'}
        size="sm"
      >
        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nomor Meja
            </label>
            <input
              type="text"
              required
              value={formData.number}
              onChange={(e) => setFormData((prev) => ({ ...prev, number: e.target.value }))}
              placeholder="misal: 01"
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-slate-400 outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Kapasitas (Orang)
            </label>
            <input
              type="number"
              min={1}
              required
              value={formData.capacity}
              onChange={(e) => setFormData((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-slate-400 outline-none text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Status Ketersediaan
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as TableData['status'] }))}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:border-slate-400 outline-none text-slate-800 dark:text-slate-200"
            >
              <option value="Tersedia">Tersedia</option>
              <option value="Penuh">Penuh</option>
              <option value="Dipesan">Dipesan</option>
              <option value="Tidak tersedia">Tidak tersedia</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal QR Code Preview */}
      <Modal
        isOpen={Boolean(qrModalTable)}
        onClose={() => {
          setQrModalTable(null)
          setIsCopied(false)
        }}
        title={`QR Code Meja`}
        size="sm"
      >
        {qrModalTable && (
          <div className="p-5 text-center space-y-4">
            <div className="mx-auto w-64 h-64 bg-white border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center space-y-3 shadow-xs">
              <QRCodeSVG value={qrModalTable.qrUrl} size={180} level="H" />
              <span className="font-extrabold text-sm text-slate-900 tracking-wider">MEJA #{qrModalTable.number}</span>
            </div>

            {/* Display URL di luar kotak QR */}
            <div className="mx-auto w-fit max-w-full bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 font-mono text-xs px-3.5 py-2 rounded-lg break-all select-all text-center">
              {qrModalTable.qrUrl}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="flex-1 flex items-center justify-center gap-1.5 transition-all"
                onClick={() => {
                  navigator.clipboard.writeText(qrModalTable.qrUrl)
                  playSound('present.mp3')
                  setIsCopied(true)
                  setTimeout(() => {
                    setIsCopied(false)
                  }, 2000)
                }}
              >
                {isCopied ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span>Disalin</span>
                  </>
                ) : (
                  <span>Salin Link</span>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1 flex items-center justify-center gap-1.5"
                onClick={() => {
                  window.print()
                }}
              >
                <FiPrinter className="w-3.5 h-3.5" />
                <span>Cetak QR</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hidden Printable Single QR Layout for Direct Printing */}
      {qrModalTable && !isPrintingAll && (
        <div id="printable-qr-container" className="hidden print:block">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { size: A4 portrait; margin: 0; }
              body * { visibility: hidden !important; }
              #printable-qr-container, #printable-qr-container * { visibility: visible !important; }
              #printable-qr-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: space-evenly !important;
                padding: 20px !important;
                background: #fff !important;
                box-sizing: border-box !important;
              }
              .print-card {
                border: 3px solid #1e293b !important;
                padding: 16px 24px 20px !important;
                border-radius: 24px !important;
                width: 100% !important;
                max-width: 440px !important;
                box-sizing: border-box !important;
                text-align: center !important;
              }
              .print-brand-header {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 8px !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                color: #334155 !important;
                text-transform: uppercase !important;
                letter-spacing: 1px !important;
                margin-bottom: 6px !important;
              }
              .print-brand-logo { width: 22px !important; height: 22px !important; object-fit: contain !important; }
              .print-subtitle { font-size: 12px !important; font-weight: 700 !important; color: #64748b !important; text-transform: uppercase !important; margin-bottom: 8px !important; letter-spacing: 1.5px !important; }
              .print-qr-container { background: #fff !important; border: 2px solid #e2e8f0 !important; padding: 12px !important; border-radius: 20px !important; display: inline-block !important; }
              .print-qr-code { width: 260px !important; height: 260px !important; }
              .print-title { font-size: 46px !important; font-weight: 900 !important; color: #0f172a !important; margin: 8px 0 0 !important; }
              .print-cut-line {
                width: 100% !important;
                max-width: 480px !important;
                border-top: 1px dashed #94a3b8 !important;
                margin: 8px 0 !important;
              }
            }
          ` }} />

          {/* Card 1 (Top) */}
          <div className="print-card">
            <div className="print-brand-header">
              <img src="/img/logo-login.webp" alt="Logo" className="print-brand-logo" />
              <span>{storeProfile.storeName}</span>
            </div>
            <div className="print-subtitle">Scan untuk Pesan Menu</div>
            <div className="print-qr-container">
              <QRCodeSVG value={qrModalTable.qrUrl} size={260} level="H" />
            </div>
            <h1 className="print-title">MEJA #{qrModalTable.number}</h1>
          </div>

          <div className="print-cut-line"></div>

          {/* Card 2 (Bottom) */}
          <div className="print-card">
            <div className="print-brand-header">
              <img src="/img/logo-login.webp" alt="Logo" className="print-brand-logo" />
              <span>{storeProfile.storeName}</span>
            </div>
            <div className="print-subtitle">Scan untuk Pesan Menu</div>
            <div className="print-qr-container">
              <QRCodeSVG value={qrModalTable.qrUrl} size={260} level="H" />
            </div>
            <h1 className="print-title">MEJA #{qrModalTable.number}</h1>
          </div>
        </div>
      )}

      {/* Modal Pilihan Format Cetak QR */}
      <Modal
        isOpen={isPrintOptionsOpen}
        onClose={() => setIsPrintOptionsOpen(false)}
        title="Pilihan Cetak QR Code"
        size="sm"
      >
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            {/* Card Kiri: Tanpa Nomor Meja */}
            <button
              type="button"
              onClick={() => handlePrintAllQRs('no_table')}
              className="relative overflow-hidden p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/70 dark:bg-slate-900/80 text-left transition-all group cursor-pointer flex items-center min-h-[84px]"
            >
              {/* Icon Tipis (Saru sebagai BG) */}
              <FiPrinter className="absolute -right-3 -bottom-3 w-20 h-20 text-slate-400 dark:text-slate-500 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none" />

              <div className="relative z-10 font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-slate-900 dark:group-hover:text-white">
                Tanpa Nomor Meja
              </div>
            </button>

            {/* Card Kanan: Dengan Nomor Meja */}
            <button
              type="button"
              onClick={() => handlePrintAllQRs('with_table')}
              className="relative overflow-hidden p-4 sm:p-5 rounded-xl border border-amber-200 dark:border-amber-900/60 hover:border-amber-400 dark:hover:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30 text-left transition-all group cursor-pointer flex items-center min-h-[84px]"
            >
              {/* Icon Tipis (Saru sebagai BG) */}
              <BsQrCode className="absolute -right-3 -bottom-3 w-20 h-20 text-amber-600 dark:text-amber-400 opacity-15 group-hover:opacity-25 transition-opacity pointer-events-none" />

              <div className="relative z-10 font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-amber-950 dark:group-hover:text-amber-200">
                Dengan Nomor Meja
              </div>
            </button>
          </div>
        </div>
      </Modal>

      {/* Hidden Printable All Tables QR Layout (2 Cards per A4 Sheet) */}
      {isPrintingAll && (
        <div id="printable-all-qr-container" className="hidden print:block">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { size: A4 portrait; margin: 0; }
              body * { visibility: hidden !important; }
              #printable-all-qr-container, #printable-all-qr-container * { visibility: visible !important; }
              #printable-all-qr-container {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100vw !important;
                background: #fff !important;
                box-sizing: border-box !important;
              }
              .print-all-page {
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: space-evenly !important;
                padding: 20px !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
              }
              .print-all-card {
                border: 3px solid #1e293b !important;
                padding: 16px 24px 20px !important;
                border-radius: 24px !important;
                width: 100% !important;
                max-width: 440px !important;
                box-sizing: border-box !important;
                text-align: center !important;
              }
              .print-all-brand-header {
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 8px !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                color: #334155 !important;
                text-transform: uppercase !important;
                letter-spacing: 1px !important;
                margin-bottom: 6px !important;
              }
              .print-all-brand-logo { width: 22px !important; height: 22px !important; object-fit: contain !important; }
              .print-all-subtitle { font-size: 12px !important; font-weight: 700 !important; color: #64748b !important; text-transform: uppercase !important; margin-bottom: 8px !important; letter-spacing: 1.5px !important; }
              .print-all-qr-container { background: #fff !important; border: 2px solid #e2e8f0 !important; padding: 12px !important; border-radius: 20px !important; display: inline-block !important; }
              .print-all-title { font-size: 46px !important; font-weight: 900 !important; color: #0f172a !important; margin: 8px 0 0 !important; }
              .print-all-cut-line {
                width: 100% !important;
                max-width: 480px !important;
                border-top: 1px dashed #94a3b8 !important;
                margin: 8px 0 !important;
              }
            }
          ` }} />

          {tablePairs.map((pair, index) => {
            const card0Url = printMode === 'no_table' ? `${getCustomerBaseUrl()}/menu` : pair[0].qrUrl
            const card0Title = printMode === 'no_table' ? storeProfile.storeName.toUpperCase() : `MEJA #${pair[0].number}`

            const card1Url = pair[1] ? (printMode === 'no_table' ? `${getCustomerBaseUrl()}/menu` : pair[1].qrUrl) : ''
            const card1Title = pair[1] ? (printMode === 'no_table' ? storeProfile.storeName.toUpperCase() : `MEJA #${pair[1].number}`) : ''

            return (
              <div key={index} className="print-all-page">
                {/* Card Top */}
                <div className="print-all-card">
                  <div className="print-all-brand-header">
                    <img src="/img/logo-login.webp" alt="Logo" className="print-all-brand-logo" />
                    <span>{storeProfile.storeName}</span>
                  </div>
                  <div className="print-all-subtitle">Scan untuk Pesan Menu</div>
                  <div className="print-all-qr-container">
                    <QRCodeSVG value={card0Url} size={260} level="H" />
                  </div>
                  <h1 className="print-all-title">{card0Title}</h1>
                </div>

                {pair[1] && <div className="print-all-cut-line"></div>}

                {/* Card Bottom */}
                {pair[1] && (
                  <div className="print-all-card">
                    <div className="print-all-brand-header">
                      <img src="/img/logo-login.webp" alt="Logo" className="print-all-brand-logo" />
                      <span>{storeProfile.storeName}</span>
                    </div>
                    <div className="print-all-subtitle">Scan untuk Pesan Menu</div>
                    <div className="print-all-qr-container">
                      <QRCodeSVG value={card1Url} size={260} level="H" />
                    </div>
                    <h1 className="print-all-title">{card1Title}</h1>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
