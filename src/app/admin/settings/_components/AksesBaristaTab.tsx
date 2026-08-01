'use client'

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/Button";
import { playSwalSound } from "@/utils/sound";
import { FiKey, FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { getBaristaPin, updateBaristaPin } from "@/services/supabase/authService";

interface AksesBaristaTabProps {
  onShowSuccessAlert: (title: string, text: string) => void;
}

export const AksesBaristaTab: React.FC<AksesBaristaTabProps> = ({ onShowSuccessAlert }) => {
  const [pin, setPin] = useState("");
  const [savedPin, setSavedPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPin() {
      setLoading(true);
      const activePin = await getBaristaPin();
      setPin(activePin);
      setSavedPin(activePin);
      setLoading(false);
    }
    fetchPin();
  }, []);

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || pin.length !== 6) {
      playSwalSound("error");
      Swal.fire({
        icon: "error",
        title: "PIN Tidak Valid",
        text: "PIN Barista wajib terdiri dari 6 digit angka.",
        confirmButtonColor: "#3D2514",
      });
      return;
    }

    playSwalSound("confirm");
    Swal.fire({
      title: "Simpan PIN Barista?",
      text: "Apakah Anda yakin ingin memperbarui 6-digit PIN masuk Barista di Supabase?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-popup" },
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoading(true);
        const success = await updateBaristaPin(pin);
        setLoading(false);

        if (success) {
          setSavedPin(pin);
          setIsEditing(false);
          onShowSuccessAlert("Disimpan!", "PIN Masuk Barista berhasil diperbarui di Supabase.");
        } else {
          playSwalSound("error");
          Swal.fire({
            icon: "error",
            title: "Gagal Menyimpan",
            text: "Terjadi kesalahan saat memperbarui PIN di Supabase.",
            confirmButtonColor: "#ef4444",
          });
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setPin(savedPin);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Formulir PIN Barista */}
      <div className="space-y-4">
        <div className="space-y-1">
          <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block">
            PIN Masuk Barista (6 Digit)
          </span>
        </div>

        {loading ? (
          <div className="text-xs text-zinc-400 py-4">Memuat PIN...</div>
        ) : (
          <form onSubmit={handleSavePin} className="space-y-3 max-w-xl">
            <div className="relative">
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                disabled={!isEditing}
                placeholder=". . . . . ."
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
                className={`w-full rounded-lg border pl-9 pr-10 py-2 text-sm outline-none font-mono tracking-widest transition-all duration-200 ${
                  isEditing
                    ? "border-zinc-300 bg-white focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-sky-400"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300 cursor-default"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                title={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
              >
                {showPin ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {isEditing ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="cursor-pointer"
                    onClick={handleCancelEdit}
                  >
                    Batal
                  </Button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all duration-150 outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none px-3.5 py-2 text-xs bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-600 cursor-pointer"
                  >
                    <FiCheck className="h-3.5 w-3.5" />
                    <span>Simpan PIN Baru</span>
                  </button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  Ubah PIN
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AksesBaristaTab;
