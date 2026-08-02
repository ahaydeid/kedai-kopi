'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { playSound, playSwalSound } from "@/utils/sound";
import Swal from 'sweetalert2';

// iOS-style Switch component
const Switch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? "bg-sky-600 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

// Custom Toggle for Sound Mode (Normal / Hening)
const SoundModeToggle: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
}> = ({ checked, onChange }) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 cursor-pointer select-none w-44"
    >
      {/* Sliding background */}
      <div
        className="absolute top-0.5 bottom-0.5 left-0.5 rounded-md transition-all duration-200 ease-out bg-sky-600 dark:bg-zinc-200"
        style={{
          width: "calc(50% - 2px)",
          transform: checked ? "translateX(0)" : "translateX(100%)",
        }}
      />
      
      {/* Left Option */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(true);
        }}
        className={`flex-1 relative z-10 py-1 font-semibold rounded-md text-center transition-colors duration-200 cursor-pointer text-xs ${
          checked ? "text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        Normal
      </button>

      {/* Right Option */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onChange(false);
        }}
        className={`flex-1 relative z-10 py-1 font-semibold rounded-md text-center transition-colors duration-200 cursor-pointer text-xs ${
          !checked ? "text-white dark:text-zinc-950" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        Hening
      </button>
    </div>
  );
};

export function SuaraNotifikasiTab() {
  const [soundMode, setSoundMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("setting_sound_mode") !== "hening"
    }
    return true
  });
  const [notifOrder, setNotifOrder] = useState(true);

  const playPreviewSound = (id: string) => {
    if (!soundMode) return;
    let file = "";
    if (id === "order" || id === "chat") file = "notif.mp3";
    else if (id === "bayar") file = "paymentacc.mp3";
    else if (id === "stok") file = "error.mp3";

    if (file) {
      playSound(file);
    }
  };

  const handleSoundModeChange = (val: boolean) => {
    setSoundMode(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("setting_sound_mode", val ? "normal" : "hening");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("setting_sound_mode", soundMode ? "normal" : "hening");
    }
    playSwalSound('success');
    Swal.fire({
      title: 'Disimpan!',
      text: 'Preferensi suara dan notifikasi kedai berhasil diperbarui.',
      icon: 'success',
      confirmButtonColor: '#0284c7',
    });
  };

  const notificationList = [
    { id: "order", label: "Pesanan Baru", desc: "Dapatkan notifikasi instan saat pembeli membuat pesanan baru", state: notifOrder, setter: setNotifOrder },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-6 divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {/* Section 1: Mode Suara */}
        <div className="pt-0 space-y-3">
          <div className="flex flex-col gap-2 py-2">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Mode Suara Aplikasi
            </span>
            <SoundModeToggle
              checked={soundMode}
              onChange={handleSoundModeChange}
            />
          </div>
        </div>

        {/* Section 2: Notifikasi */}
        <div className="pt-5 space-y-3">
          <div className="space-y-4 divide-y divide-zinc-100/50 dark:divide-zinc-800/30">
            {notificationList.map((item, idx) => (
              <div 
                key={item.id} 
                className={`flex flex-col md:flex-row md:items-center justify-between gap-4 ${idx === 0 ? "pt-0" : "pt-4"}`}
              >
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {item.label}
                  </span>
                </div>
                <div className="pr-2 py-1 flex items-center">
                  <Switch
                    checked={item.state}
                    onChange={(val) => {
                      item.setter(val);
                      if (val) {
                        playPreviewSound(item.id);
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/65 flex justify-end gap-3">
        <Button
          type="submit"
          variant="primary"
          size="sm"
        >
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}
