'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { FiEye, FiEdit2, FiCheck, FiUpload, FiImage } from 'react-icons/fi'
import { PopupAdConfig } from '@/core/types/popup'
import Toggle from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { SupabasePopupService } from '@/services/supabase/popup.service'
import Swal from 'sweetalert2'
import useSWR, { useSWRConfig } from 'swr'

interface PopupTabProps {
  onTestShowPreview: (config: PopupAdConfig) => void
}

export default function PopupTab({ onTestShowPreview }: PopupTabProps) {
  const popupService = useMemo(() => new SupabasePopupService(), [])
  const { mutate } = useSWRConfig()

  const { data: config, isLoading } = useSWR<PopupAdConfig>(
    'popup-config',
    () => popupService.getPopupConfig(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<PopupAdConfig>({
    isActive: false, title: '', description: '',
    imageUrl: '', buttonText: 'Belanja Sekarang', targetUrl: '/',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEnterEdit = () => {
    if (!config) return
    setDraft(config)
    setPreviewImageUrl(config.imageUrl)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setPreviewImageUrl('')
  }

  // Fungsi kompresi gambar client-side (target <= 200KB)
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(file)
            return
          }

          // Batasi resolusi maksimal 800px untuk lebar/tinggi
          const maxDim = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          canvas.width = width
          canvas.height = height
          ctx.drawImage(img, 0, 0, width, height)

          // Coba kompresi dengan quality awal 0.8
          let quality = 0.8
          
          const attemptCompress = (q: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  resolve(file)
                  return
                }

                const sizeKB = blob.size / 1024
                
                // Jika masih > 200KB dan quality masih bisa diturunkan
                if (sizeKB > 200 && q > 0.15) {
                  attemptCompress(q - 0.1)
                } else {
                  // Buat file baru bertipe JPEG hasil kompresi
                  const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  })
                  resolve(compressedFile)
                }
              },
              'image/jpeg',
              q
            )
          }

          attemptCompress(quality)
        }
        img.onerror = () => resolve(file)
      }
      reader.onerror = () => resolve(file)
    })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    try {
      // Jalankan kompresi otomatis client-side
      const processedFile = await compressImage(file)

      // Local preview dari file terkompresi
      const localUrl = URL.createObjectURL(processedFile)
      setPreviewImageUrl(localUrl)

      // Upload ke Supabase
      const publicUrl = await popupService.uploadBannerImage(processedFile)
      setDraft(prev => ({ ...prev, imageUrl: publicUrl }))
      setPreviewImageUrl(publicUrl)
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal Upload', text: err?.message, confirmButtonColor: '#0369a1' })
      setPreviewImageUrl(config?.imageUrl || '')
    } finally {
      setIsUploading(false)
    }
  }

  const handleToggleActive = async (nextActive: boolean) => {
    if (!config) return
    const updated = { ...config, isActive: nextActive }
    mutate('popup-config', updated, false)
    try {
      await popupService.savePopupConfig(updated)
      mutate('popup-config')
    } catch {
      mutate('popup-config') // rollback
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await popupService.savePopupConfig(draft)
      mutate('popup-config', draft, false)
      setIsEditing(false)
      setPreviewImageUrl('')
      Swal.fire({ icon: 'success', title: 'Tersimpan', text: 'Konfigurasi popup berhasil diperbarui.', confirmButtonColor: '#0369a1' })
      mutate('popup-config')
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err?.message, confirmButtonColor: '#0369a1' })
    } finally {
      setIsSaving(false)
    }
  }

  const currentImageUrl = isEditing ? previewImageUrl : config?.imageUrl

  if (isLoading || !config) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-400 text-sm">
        Memuat konfigurasi popup...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Form */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Konfigurasi Iklan Popup</span>
            <div className="flex items-center gap-2">
              <Toggle
                leftLabel="Nonaktif"
                rightLabel="Aktif"
                checked={!config.isActive}
                onChange={(checked) => handleToggleActive(!checked)}
                leftActiveColorClass="bg-zinc-400 dark:bg-zinc-600"
                rightActiveColorClass="bg-emerald-500"
              />
            </div>
          </div>

          {/* Read Mode */}
          {!isEditing && (
            <div className="space-y-4 text-sm">
              {[
                { label: 'Judul Promo', value: config.title },
                { label: 'Deskripsi', value: config.description },
                { label: 'Teks Tombol CTA', value: config.buttonText },
                { label: 'Link Tujuan', value: config.targetUrl },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium break-all">
                    {value || <span className="text-zinc-400 dark:text-zinc-600 italic font-normal">Belum diisi</span>}
                  </span>
                </div>
              ))}
              <div className="flex gap-2.5 pt-1">
                <Button variant="secondary" size="sm" onClick={handleEnterEdit} className="rounded">
                  <FiEdit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => onTestShowPreview(config)} className="rounded">
                  <FiEye className="h-3.5 w-3.5" /> Uji Coba Tampilan
                </Button>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Judul Iklan Promo</label>
                <input type="text" value={draft.title}
                  onChange={e => setDraft({ ...draft, title: e.target.value })}
                  placeholder="Masukkan Judul Promo"
                  className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium" />
              </div>

              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Deskripsi Singkat Promo</label>
                <textarea rows={3} value={draft.description}
                  onChange={e => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Masukkan penjelasan promo..."
                  className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none font-medium" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Teks Tombol CTA</label>
                  <input type="text" value={draft.buttonText}
                    onChange={e => setDraft({ ...draft, buttonText: e.target.value })}
                    placeholder="Contoh: Belanja Sekarang"
                    className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">Link Tujuan Redirect</label>
                  <input type="text" value={draft.targetUrl}
                    onChange={e => setDraft({ ...draft, targetUrl: e.target.value })}
                    placeholder="Contoh: /product/id"
                    className="w-full rounded border border-zinc-200 dark:border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium" />
                </div>
              </div>

              {/* Upload Banner */}
              <div>
                <label className="block font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Gambar Banner Popup
                </label>
                <div
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed py-5 cursor-pointer transition-colors ${
                    isUploading
                      ? 'border-sky-300 bg-sky-50/30 cursor-wait'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-sky-400 hover:bg-sky-50/10'
                  }`}
                >
                  {isUploading ? (
                    <p className="text-xs text-sky-600 font-semibold animate-pulse">Mengupload...</p>
                  ) : previewImageUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewImageUrl} alt="Preview banner" className="h-24 object-contain rounded" />
                      <p className="text-xs text-zinc-400">Klik untuk ganti gambar</p>
                    </>
                  ) : (
                    <>
                      <FiImage className="h-8 w-8 text-zinc-300" />
                      <p className="text-xs text-zinc-400">Klik untuk upload gambar banner</p>
                      <p className="text-[10px] text-zinc-300">PNG, JPEG, WebP · Maks 1.5MB · Rasio 1:1</p>
                    </>
                  )}
                  <FiUpload className="absolute top-2 right-2 h-3.5 w-3.5 text-zinc-300" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange} className="hidden" />
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button type="button" variant="secondary" size="sm" onClick={handleCancel} className="rounded">
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" className="rounded"
                  disabled={isSaving || isUploading}>
                  <FiCheck className="h-3.5 w-3.5" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white dark:bg-zinc-900 p-5 rounded">
          <h3 className="font-bold text-zinc-800 dark:text-zinc-200 border-b border-zinc-100 dark:border-zinc-800 pb-3 text-sm mb-4">
            Preview Asset Banner
          </h3>
          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-50 dark:bg-zinc-950 group">
            {currentImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentImageUrl} alt="Banner Preview"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-zinc-300">
                <FiImage className="h-12 w-12" />
                <p className="text-xs">Belum ada gambar</p>
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
            <p className="font-semibold text-zinc-500 dark:text-zinc-400">Rekomendasi Format Gambar:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Rasio <b>persegi (1:1)</b> — tampil optimal di semua perangkat</li>
              <li>Ekstensi: PNG, JPEG, atau WebP</li>
              <li>Ukuran file maksimum: 1.5MB</li>
            </ul>
          </div>
        </div>

        <div className="bg-sky-50/50 dark:bg-zinc-900/30 p-5 rounded">
          <h4 className="font-bold text-sky-900 dark:text-sky-400 text-sm mb-2">Tentang Iklan Popup</h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Iklan popup akan muncul satu kali setiap pengunjung pertama kali membuka web toko (homepage). Sangat efektif untuk mempromosikan diskon besar, voucher baru, atau perilisan produk eksklusif.
          </p>
        </div>
      </div>
    </div>
  )
}
