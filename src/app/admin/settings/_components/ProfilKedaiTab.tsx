'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { playSwalSound } from '@/utils/sound'
import { FiEdit2 } from 'react-icons/fi'
import Swal from 'sweetalert2'
import {
  getStoreProfile,
  updateStoreProfile,
  getCachedStoreProfileSync,
  StoreProfile,
} from '@/services/supabase/storeProfileService'

export function ProfilKedaiTab() {
  const [profile, setProfile] = useState<StoreProfile>(() => getCachedStoreProfileSync())
  const [initialProfile, setInitialProfile] = useState<StoreProfile>(() => getCachedStoreProfileSync())
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    async function loadData() {
      const data = await getStoreProfile()
      setProfile(data)
      setInitialProfile(data)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleChange = (field: keyof StoreProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  const handleCancel = () => {
    setProfile(initialProfile)
    setIsEditing(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    // Mask/clean embed URL jika admin memasukkan full HTML <iframe>
    let cleanEmbed = profile.gmapsEmbedUrl.trim()
    const iframeMatch = cleanEmbed.match(/src=["']([^"']+)["']/)
    if (iframeMatch && iframeMatch[1]) {
      cleanEmbed = iframeMatch[1]
    }

    const updatedData: StoreProfile = {
      ...profile,
      storeName: profile.storeName.trim(),
      address: profile.address.trim(),
      gmapsUrl: profile.gmapsUrl.trim(),
      gmapsEmbedUrl: cleanEmbed,
      whatsapp: profile.whatsapp.trim(),
      instagramUrl: profile.instagramUrl.trim(),
      tiktokUrl: profile.tiktokUrl.trim(),
      shopeefoodUrl: profile.shopeefoodUrl.trim(),
      gofoodUrl: profile.gofoodUrl.trim(),
    }

    await updateStoreProfile(updatedData)
    setProfile(updatedData)
    setInitialProfile(updatedData)
    setSaving(false)
    setIsEditing(false)

    playSwalSound('success')
    Swal.fire({
      title: 'Disimpan!',
      text: 'Profil dan kontak kedai berhasil diperbarui.',
      icon: 'success',
      confirmButtonColor: '#0284c7',
    })
  }

  if (loading) {
    return <div className="p-4 text-center text-xs text-zinc-400">Memuat profil kedai...</div>
  }

  const inputStyle = (editing: boolean) =>
    `w-full text-xs px-3 py-2 rounded-lg outline-none transition-colors ${
      !editing
        ? 'bg-zinc-100/70 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 border-0 cursor-default font-medium'
        : 'border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
    }`

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-4">
        {/* Header Tab & Tombol Edit */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Profil & Kontak Kedai
          </h2>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          )}
        </div>

        <div className="space-y-4 pt-2">
          {/* Nama Kedai */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nama Kedai
            </label>
            <input
              type="text"
              readOnly={!isEditing}
              value={profile.storeName}
              onChange={(e) => handleChange('storeName', e.target.value)}
              placeholder="e.g. Kedai Moods"
              required
              className={inputStyle(isEditing)}
            />
          </div>

          {/* Alamat Lengkap Kedai */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Alamat Lengkap Kedai
            </label>
            <textarea
              rows={2}
              readOnly={!isEditing}
              value={profile.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="e.g. Ruko Al Husna, Saga, Balaraja, Tangerang"
              required
              className={`${inputStyle(isEditing)} resize-none`}
            />
          </div>


          {/* Iframe Embed Google Maps */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Google Maps Embed (src URL atau Kode &lt;iframe&gt;)
            </label>
            <textarea
              rows={4}
              readOnly={!isEditing}
              value={profile.gmapsEmbedUrl}
              onChange={(e) => handleChange('gmapsEmbedUrl', e.target.value)}
              placeholder='e.g. https://www.google.com/maps/embed?pb=... atau <iframe src="..."></iframe>'
              required
              className={`${inputStyle(isEditing)} font-mono resize-none`}
            />
          </div>

          {/* Link Google Maps */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Link Google Maps
            </label>
            <input
              type="text"
              readOnly={!isEditing}
              value={profile.gmapsUrl}
              onChange={(e) => handleChange('gmapsUrl', e.target.value)}
              placeholder="e.g. https://maps.app.goo.gl/2hRMrayrZaikFNJE9"
              required
              className={inputStyle(isEditing)}
            />
          </div>

          {/* Nomor WhatsApp */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nomor WhatsApp
            </label>
            <div className="flex items-center">
              <span
                className={`inline-flex items-center px-3 py-2 text-xs font-semibold transition-colors select-none ${
                  !isEditing
                    ? 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-600 dark:text-zinc-400 border-0 rounded-l-lg'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-r-0 border-zinc-200 dark:border-zinc-700 rounded-l-lg'
                }`}
              >
                +62
              </span>
              <input
                type="text"
                readOnly={!isEditing}
                value={profile.whatsapp.replace(/^(?:\+?62|0)+/, '')}
                onChange={(e) => {
                  const val = e.target.value.replace(/[\s\-\+\(\)]/g, '').replace(/^(?:62|0)+/, '')
                  handleChange('whatsapp', val ? `62${val}` : '')
                }}
                placeholder="85718820152"
                required
                className={`${inputStyle(isEditing)} rounded-l-none rounded-r-lg`}
              />
            </div>
          </div>

          {/* Link Instagram */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Link Instagram
            </label>
            <input
              type="text"
              readOnly={!isEditing}
              value={profile.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              placeholder="e.g. https://www.instagram.com/kedai.moods_/"
              className={inputStyle(isEditing)}
            />
          </div>

          {/* Link TikTok */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Link TikTok
            </label>
            <input
              type="text"
              readOnly={!isEditing}
              value={profile.tiktokUrl}
              onChange={(e) => handleChange('tiktokUrl', e.target.value)}
              placeholder="e.g. https://tiktok.com/@kedaikopi.official"
              className={inputStyle(isEditing)}
            />
          </div>

          {/* Link ShopeeFood */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Link ShopeeFood
            </label>
            <input
              type="text"
              readOnly={!isEditing}
              value={profile.shopeefoodUrl}
              onChange={(e) => handleChange('shopeefoodUrl', e.target.value)}
              placeholder="e.g. https://shopee.co.id/universal-link/now-food/shop/kedaikopi"
              className={inputStyle(isEditing)}
            />
          </div>

          {/* Link GoFood */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Link GoFood
            </label>
            <input
              type="text"
              readOnly={!isEditing}
              value={profile.gofoodUrl}
              onChange={(e) => handleChange('gofoodUrl', e.target.value)}
              placeholder="e.g. https://gofood.link/a/kedaikopi"
              className={inputStyle(isEditing)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons saat Mode Edit */}
      {isEditing && (
        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/65 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <Button type="submit" variant="primary" size="sm" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </div>
      )}
    </form>
  )
}
