'use client'

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Button } from "@/components/ui/Button";
import { playSwalSound } from "@/utils/sound";
import { FiGlobe, FiCheck } from "react-icons/fi";
import { getAppUrlSettings, updateAppUrlSettings } from "@/services/supabase/settingService";

export const UrlMasukTab: React.FC = () => {
  const [customerUrl, setCustomerUrl] = useState("");
  const [savedCustomerUrl, setSavedCustomerUrl] = useState("");
  const [staffUrl, setStaffUrl] = useState("");
  const [savedStaffUrl, setSavedStaffUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const settings = await getAppUrlSettings();
      setCustomerUrl(settings.customerUrl);
      setSavedCustomerUrl(settings.customerUrl);
      setStaffUrl(settings.staffUrl);
      setSavedStaffUrl(settings.staffUrl);
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUrl.trim() || !staffUrl.trim()) {
      playSwalSound("error");
      Swal.fire({
        icon: "error",
        title: "URL Tidak Valid",
        text: "URL Pelanggan dan Staff tidak boleh kosong.",
        confirmButtonColor: "#3D2514",
      });
      return;
    }

    const cleanCustomer = customerUrl.trim().replace(/\/+$/, "");
    const cleanStaff = staffUrl.trim().replace(/\/+$/, "");

    playSwalSound("confirm");
    Swal.fire({
      title: "Simpan URL Masuk?",
      text: "Konfigurasi URL akan diperbarui di Supabase dan dijadikan dasar pembuatan QR Code Meja.",
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
        await updateAppUrlSettings({
          customerUrl: cleanCustomer,
          staffUrl: cleanStaff,
        });

        setCustomerUrl(cleanCustomer);
        setSavedCustomerUrl(cleanCustomer);
        setStaffUrl(cleanStaff);
        setSavedStaffUrl(cleanStaff);
        setIsEditing(false);
        setLoading(false);

        playSwalSound("success");
        Swal.fire({
          icon: "success",
          title: "Disimpan!",
          text: "Konfigurasi URL masuk berhasil diperbarui di Supabase.",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    });
  };

  const handleCancelEdit = () => {
    setCustomerUrl(savedCustomerUrl);
    setStaffUrl(savedStaffUrl);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <form onSubmit={handleSaveUrl} className="space-y-5 max-w-xl">
          {/* Field 1: URL Pelanggan */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block">
              URL Masuk Pelanggan (Dasar QR Code Meja)
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerUrl}
                onChange={(e) => setCustomerUrl(e.target.value)}
                disabled={!isEditing}
                placeholder="https://kedaikopi.ahadi.my.id"
                className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none font-mono transition-all duration-200 ${
                  isEditing
                    ? "border-zinc-300 bg-white focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-sky-400"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300 cursor-default"
                }`}
              />
              <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          {/* Field 2: URL Staff */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 block">
              URL Masuk Staff (Barista & Admin)
            </label>
            <div className="relative">
              <input
                type="text"
                value={staffUrl}
                onChange={(e) => setStaffUrl(e.target.value)}
                disabled={!isEditing}
                placeholder="https://kedaikopi.ahadi.my.id"
                className={`w-full rounded-lg border pl-9 pr-3 py-2 text-sm outline-none font-mono transition-all duration-200 ${
                  isEditing
                    ? "border-zinc-300 bg-white focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-sky-400"
                    : "border-zinc-200 bg-zinc-50/50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300 cursor-default"
                }`}
              />
              <FiGlobe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2">
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
                  <span>Simpan URL Baru</span>
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
                Ubah URL
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UrlMasukTab;
