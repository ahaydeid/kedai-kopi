'use client'

import React, { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/Button";
import { playSwalSound } from "@/utils/sound";

interface PesanTabProps {
  onShowSuccessAlert: (title: string, text: string) => void;
}

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

export const PesanTab: React.FC<PesanTabProps> = ({ onShowSuccessAlert }) => {
  const [replyActive, setReplyActive] = useState(true);
  const [replyText, setReplyText] = useState(
    "Halo! Terima kasih sudah menghubungi Kedai Kopi. Ada yang bisa kami bantu?"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [savedText, setSavedText] = useState(
    "Halo! Terima kasih sudah menghubungi Kedai Kopi. Ada yang bisa kami bantu?"
  );

  const handleToggleActive = (val: boolean) => {
    playSwalSound("confirm");
    Swal.fire({
      title: val ? "Aktifkan Balasan Otomatis?" : "Nonaktifkan Balasan Otomatis?",
      text: val
        ? "Apakah kamu yakin ingin mengaktifkan fitur balas pesan otomatis?"
        : "Apakah kamu yakin ingin menonaktifkan fitur balas pesan otomatis?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Ubah",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-popup" },
    }).then((result) => {
      if (result.isConfirmed) {
        setReplyActive(val);
        if (!val) setIsEditing(false);
        onShowSuccessAlert(
          "Berhasil!",
          val ? "Balasan otomatis diaktifkan." : "Balasan otomatis dinonaktifkan."
        );
      }
    });
  };

  const handleSaveText = () => {
    playSwalSound("confirm");
    Swal.fire({
      title: "Simpan Perubahan?",
      text: "Apakah kamu yakin ingin menyimpan template balasan pesan yang baru?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0284c7",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Simpan",
      cancelButtonText: "Batal",
      customClass: { popup: "swal2-popup" },
    }).then((result) => {
      if (result.isConfirmed) {
        setSavedText(replyText);
        setIsEditing(false);
        onShowSuccessAlert("Disimpan!", "Template balasan pesan berhasil diperbarui.");
      }
    });
  };

  const handleCancelEdit = () => {
    setReplyText(savedText);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6 divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {/* Section 1: Template Balasan */}
        <div className="pt-0 space-y-2.5">
          <div className="flex items-center gap-3 py-1">
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Balas Pesan Otomatis
            </span>
            <Switch
              checked={replyActive}
              onChange={handleToggleActive}
            />
          </div>

          <div className="space-y-2 pt-1">
            <span className={`text-sm font-medium block transition-colors duration-200 ${
              replyActive ? "text-zinc-500 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-600"
            }`}>
              Isi Pesan
            </span>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              disabled={!replyActive}
              readOnly={!isEditing}
              className={`w-full max-w-xl rounded-lg border p-3 text-sm outline-none leading-relaxed font-sans transition-all duration-200
                ${!replyActive
                  ? "border-zinc-100 bg-zinc-50 text-zinc-400 cursor-not-allowed dark:border-zinc-800/50 dark:bg-zinc-900/20 dark:text-zinc-600"
                  : isEditing
                    ? "border-zinc-200 bg-white focus:border-sky-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-100 dark:focus:border-sky-400"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300 cursor-default"
                }`}
              placeholder="Tulis pesan balasan otomatis di sini..."
              required
            />
            <div className="w-full max-w-xl flex justify-end gap-2">
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
                    type="button"
                    onClick={handleSaveText}
                    className="inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all duration-150 outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none px-3 py-2 text-xs bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-500 dark:hover:bg-sky-600 cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer"
                  disabled={!replyActive}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PesanTab;
