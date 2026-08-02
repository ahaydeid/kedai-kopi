'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { FiVolume2, FiVolumeX } from 'react-icons/fi'
import { playSound } from '@/utils/sound'

const SOUND_MODE_KEY = 'setting_sound_mode'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true)

  // Baca setting dari localStorage saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem(SOUND_MODE_KEY)
      setIsSoundOn(stored !== 'hening')
    }
  }, [isOpen])

  const handleToggleSound = () => {
    const next = !isSoundOn
    setIsSoundOn(next)
    if (next) {
      localStorage.removeItem(SOUND_MODE_KEY)
      // Putar suara preview
      playSound('success.mp3')
    } else {
      localStorage.setItem(SOUND_MODE_KEY, 'hening')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pengaturan" size="xs">
      <div className="px-4 py-5 space-y-1">
        {/* Row Toggle Suara */}
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-3">
            {isSoundOn ? (
              <FiVolume2 className="h-4.5 w-4.5 text-sky-600 dark:text-sky-400" />
            ) : (
              <FiVolumeX className="h-4.5 w-4.5 text-slate-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Suara
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {isSoundOn ? 'Suara notifikasi aktif' : 'Suara notifikasi dimatikan'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isSoundOn}
            onClick={handleToggleSound}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isSoundOn
                ? 'bg-sky-500'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ease-in-out ${
                isSoundOn ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </Modal>
  )
}
