'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Avatar from '@/components/ui/Avatar'
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '@/components/ui/Table'
import { FiSearch, FiX, FiChevronLeft, FiChevronRight, FiEdit2, FiCheck, FiX as FiCancel } from 'react-icons/fi'
import { ActionButton } from '@/components/ui/ActionButton'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { createClient } from '@/services/supabase/client'

export interface MemberData {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  joinedAt: string
  totalOrders: number
  totalSpend: number
  totalPoints: number
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

// Client-side in-memory cache untuk instant 0ms render saat navigasi ulang
let memberClientCache: {
  members: MemberData[]
  totalCount: number
  key: string
} | null = null

function formatJoinedDate(isoString: string): string {
  if (!isoString) return '-'
  const date = new Date(isoString)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

export function MemberManagement() {
  const [search, setSearch] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const cacheKey = `${currentPage}-${pageSize}-${search}`

  const [members, setMembers] = useState<MemberData[]>(() => 
    memberClientCache && memberClientCache.key === cacheKey ? memberClientCache.members : (memberClientCache?.members || [])
  )
  const [totalCount, setTotalCount] = useState<number>(() => 
    memberClientCache && memberClientCache.key === cacheKey ? memberClientCache.totalCount : (memberClientCache?.totalCount || 0)
  )
  const [loading, setLoading] = useState<boolean>(!memberClientCache)
  const [isFetching, setIsFetching] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // State inline edit poin
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPoints, setEditPoints] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const fetchMembers = useCallback(async (isSilent = false) => {
    const key = `${currentPage}-${pageSize}-${search}`
    const hasExistingData = memberClientCache !== null || members.length > 0

    if (!isSilent && !hasExistingData) {
      setLoading(true)
    } else {
      setIsFetching(true)
    }

    setError(null)
    try {
      const res = await fetch(
        `/api/admin/members?page=${currentPage}&pageSize=${pageSize}&search=${encodeURIComponent(search)}`
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal memuat data')

      const fetchedMembers = json.members || []
      const fetchedTotal = json.totalCount || 0

      setMembers(fetchedMembers)
      setTotalCount(fetchedTotal)
      memberClientCache = { members: fetchedMembers, totalCount: fetchedTotal, key }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }, [currentPage, pageSize, search, members.length])

  useEffect(() => {
    fetchMembers(memberClientCache !== null)
  }, [fetchMembers])

  // Reset ke halaman 1 jika search atau pageSize berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [search, pageSize])

  const totalPages = Math.ceil(totalCount / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize

  const handleStartEdit = (member: MemberData) => {
    setEditingId(member.id)
    setEditPoints(String(member.totalPoints))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditPoints('')
  }

  const handleSavePoints = (member: MemberData) => {
    const newPoints = parseInt(editPoints, 10)
    if (isNaN(newPoints) || newPoints < 0) return

    playSwalSound('confirm')
    Swal.fire({
      title: 'Simpan Perubahan Poin?',
      text: `Ubah poin member "${member.name}" menjadi ${newPoints.toLocaleString('id-ID')} poin?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup',
        cancelButton: '!text-slate-700 !font-semibold',
        confirmButton: '!font-semibold',
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        setSaving(true)
        try {
          const supabase = createClient()
          const { error: upsertError } = await supabase
            .from('member_points')
            .upsert(
              { user_id: member.id, points: newPoints, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            )

          if (upsertError) throw upsertError

          // Update lokal secara instan & bersihkan client cache
          setMembers((prev) =>
            prev.map((m) => (m.id === member.id ? { ...m, totalPoints: newPoints } : m))
          )
          if (memberClientCache) {
            memberClientCache.members = memberClientCache.members.map((m) =>
              m.id === member.id ? { ...m, totalPoints: newPoints } : m
            )
          }
          setEditingId(null)
          setEditPoints('')

          playSwalSound('success')
          Swal.fire({
            title: 'Berhasil!',
            text: `Poin ${member.name} berhasil diperbarui menjadi ${newPoints.toLocaleString('id-ID')} poin.`,
            icon: 'success',
            confirmButtonColor: '#0284c7',
            customClass: { popup: 'swal2-popup' },
          })
        } catch (err) {
          console.error('Error updating member points:', err)
          playSwalSound('confirm')
          Swal.fire({
            title: 'Gagal',
            text: 'Terjadi kesalahan saat mengupdate poin member.',
            icon: 'error',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'swal2-popup' },
          })
        } finally {
          setSaving(false)
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Member
          </h1>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isFocused ? 'Cari nama atau email...' : 'Cari...'}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`transition-all duration-300 ease-in-out rounded-full border border-slate-200 bg-white py-2 pl-10 text-sm outline-none focus:border-sky-500 dark:border-slate-800 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 ${
              isFocused ? 'w-64 sm:w-96 pr-10' : 'w-28 pr-4'
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

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <select 
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="py-2 px-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900/50 bg-transparent cursor-pointer text-slate-700 dark:text-slate-300"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Konten */}
      {loading ? (
        <div className="p-8 text-center text-sm text-slate-500">Memuat data member...</div>
      ) : error && members.length === 0 ? (
        <div className="p-8 text-center text-sm text-rose-500">{error}</div>
      ) : members.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-400 bg-white dark:bg-slate-900/40 rounded-lg border border-slate-200/80 dark:border-slate-800">
          {search ? `Tidak ada member dengan kata kunci "${search}"` : 'Belum ada member terdaftar.'}
        </div>
      ) : (
        <div className={`transition-opacity duration-200 ${isFetching ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell scope="col" className="text-center w-12 whitespace-nowrap">No</TableHeaderCell>
                <TableHeaderCell scope="col" className="whitespace-nowrap">Member</TableHeaderCell>
                <TableHeaderCell scope="col" className="whitespace-nowrap">Email</TableHeaderCell>
                <TableHeaderCell scope="col" className="whitespace-nowrap">Bergabung</TableHeaderCell>
                <TableHeaderCell scope="col" className="text-center whitespace-nowrap">Total Order</TableHeaderCell>
                <TableHeaderCell scope="col" className="text-right whitespace-nowrap pr-6">
                  Total Spend <span className="font-normal italic text-slate-400 dark:text-slate-500">(Rp)</span>
                </TableHeaderCell>
                <TableHeaderCell scope="col" className="text-right whitespace-nowrap pr-6">Total Poin</TableHeaderCell>
                <TableHeaderCell scope="col" className="text-center whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10">Aksi</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {members.map((member, idx) => {
                const isEditing = editingId === member.id
                return (
                  <TableRow key={member.id}>
                    {/* No */}
                    <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300 w-12 text-center whitespace-nowrap">
                      {startIndex + idx + 1}
                    </TableCell>

                    {/* Member */}
                    <TableCell className="text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar name={member.name} photo={member.avatarUrl} size="small" />
                        <span className="text-xs font-medium text-slate-900 dark:text-slate-100">{member.name}</span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-xs font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {member.email}
                    </TableCell>

                    {/* Bergabung */}
                    <TableCell className="text-xs font-normal text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatJoinedDate(member.joinedAt)}
                    </TableCell>

                    {/* Total Order */}
                    <TableCell className="text-xs font-normal text-slate-900 dark:text-slate-100 text-center whitespace-nowrap">
                      {member.totalOrders}
                    </TableCell>

                    {/* Total Spend */}
                    <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100 text-right pr-6 whitespace-nowrap">
                      <span className="text-slate-400 dark:text-slate-500 pr-0.5">Rp</span> {(member.totalSpend || 0).toLocaleString('id-ID')}
                    </TableCell>

                    {/* Total Poin — editable saat mode edit */}
                    <TableCell className="text-xs font-normal text-slate-900 dark:text-slate-100 text-right pr-6 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={editPoints}
                          onChange={(e) => setEditPoints(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSavePoints(member)
                            if (e.key === 'Escape') handleCancelEdit()
                          }}
                          autoFocus
                          className="w-20 text-right text-xs border border-sky-500 dark:border-sky-400 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                          {member.totalPoints.toLocaleString('id-ID')}
                        </span>
                      )}
                    </TableCell>

                    {/* Aksi Sticky */}
                    <TableCell className={`text-center whitespace-nowrap sticky right-0 z-10 ${idx % 2 === 1 ? 'bg-slate-50 dark:bg-slate-900' : 'bg-white dark:bg-slate-900'}`}>
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <ActionButton
                            variant="delete"
                            onClick={handleCancelEdit}
                            title="Batal"
                          >
                            <FiCancel className="h-4 w-4 text-white" />
                          </ActionButton>
                          <ActionButton
                            variant="edit"
                            onClick={() => handleSavePoints(member)}
                            disabled={saving}
                            title="Simpan"
                          >
                            <FiCheck className="h-4 w-4 text-white" />
                          </ActionButton>
                        </div>
                      ) : (
                        <ActionButton
                          variant="edit"
                          onClick={() => handleStartEdit(member)}
                          title="Edit Poin"
                        >
                          <FiEdit2 className="h-4 w-4 text-white" />
                        </ActionButton>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-2 pr-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800/80 cursor-pointer"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1.5 text-xs select-none">
              <span className="font-bold text-slate-900 dark:text-slate-100">{currentPage}</span>
              <span className="font-normal text-slate-400 dark:text-slate-500">/{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800/80 cursor-pointer"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
