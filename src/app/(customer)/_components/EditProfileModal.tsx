'use client'

import React, { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { FiUser, FiPhone } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { playSwalSound } from '@/utils/sound'
import { updateUserProfile } from '@/services/supabase/authService'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  initialName: string
  initialPhone: string
  onProfileUpdated: (newName: string, newPhone: string) => void
}

function cleanDigitsOnly(phoneStr: string): string {
  const digits = phoneStr.replace(/\D/g, '')
  if (digits.startsWith('62')) return digits.slice(2)
  if (digits.startsWith('0')) return digits.slice(1)
  return digits
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  initialName,
  initialPhone,
  onProfileUpdated,
}) => {
  const [fullName, setFullName] = useState(initialName)
  const [phoneDigits, setPhoneDigits] = useState(() => cleanDigitsOnly(initialPhone))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFullName(initialName || '')
      setPhoneDigits(cleanDigitsOnly(initialPhone || ''))
    }
  }, [isOpen, initialName, initialPhone])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      playSwalSound('confirm')
      Swal.fire({
        title: 'Nama Wajib Diisi',
        text: 'Silakan masukkan nama lengkap kamu.',
        icon: 'warning',
        confirmButtonColor: '#3D2514',
        customClass: { popup: 'swal2-popup' },
      })
      return
    }

    const fullPhone = phoneDigits.trim() ? `+62${phoneDigits.trim()}` : ''

    setSaving(true)
    const res = await updateUserProfile({ fullName, phone: fullPhone })
    setSaving(false)

    if (res.success) {
      onProfileUpdated(fullName.trim(), fullPhone)
      onClose()
      playSwalSound('success')
      Swal.fire({
        title: 'Profil Diperbarui',
        text: 'Nama dan nomor telepon kamu berhasil disimpan.',
        icon: 'success',
        confirmButtonColor: '#3D2514',
        confirmButtonText: 'Oke',
        customClass: { popup: 'swal2-popup' },
      })
    } else {
      playSwalSound('confirm')
      Swal.fire({
        title: 'Gagal Memperbarui',
        text: res.error || 'Terjadi kesalahan saat menyimpan profil.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'swal2-popup' },
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Edit Profil"
      bodyClassName="p-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Nama Lengkap */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FiUser className="h-3.5 w-3.5 text-slate-500" />
            <span>Nama Lengkap</span>
          </label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masukkan nama lengkap kamu"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3D2514] dark:focus:ring-amber-500/50"
          />
        </div>

        {/* Input Nomor HP / WhatsApp (+62 Prefix) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FiPhone className="h-3.5 w-3.5 text-slate-500" />
            <span>Nomor HP / WhatsApp</span>
          </label>
          <div className="flex items-center">
            <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-r-0 border-slate-200 dark:border-slate-800 rounded-l-xl text-xs font-bold text-slate-600 dark:text-slate-300 select-none shrink-0">
              +62
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={phoneDigits}
              onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ''))}
              placeholder="81234567890"
              className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#3D2514] dark:focus:ring-amber-500/50"
            />
          </div>
        </div>

        {/* Tombol Action */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
          >
            Batal
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="bg-[#3D2514] hover:bg-[#2B190E] text-white"
            disabled={saving}
          >
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
