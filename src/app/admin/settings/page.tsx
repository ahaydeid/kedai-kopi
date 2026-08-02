'use client'

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { FiLock, FiVolume2, FiPrinter, FiChevronLeft } from "react-icons/fi";

import { SidebarMenu, MenuItem } from "./_components/SidebarMenu";
import { SuaraNotifikasiTab } from "./_components/SuaraNotifikasiTab";
import { AksesBaristaTab } from "./_components/AksesBaristaTab";
import { ThermalPrinterTab } from "./_components/ThermalPrinterTab";
import { playSwalSound } from "@/utils/sound";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("barista");
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Inisialisasi tab aktif dari hash URL atau localStorage agar tidak ter-reset saat refresh
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      const savedTab = localStorage.getItem("settings_active_tab");
      const validTabs = ["barista", "notifikasi", "printer"];

      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
        setShowMobileDetail(true);
      } else if (savedTab && validTabs.includes(savedTab)) {
        setActiveTab(savedTab);
        setShowMobileDetail(true);
      }
    }
  }, []);

  const showSuccessBanner = (title: string, text: string) => {
    playSwalSound("success");
    Swal.fire({
      title: title,
      text: text,
      icon: "success",
      timer: 3000,
      showConfirmButton: false,
    });
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    setShowMobileDetail(true);
    if (typeof window !== "undefined") {
      window.location.hash = tab;
      localStorage.setItem("settings_active_tab", tab);
    }
  };

  const trimToWord = (text: string, max: number) => {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  };

  const menuItems: MenuItem[] = [
    {
      id: "barista",
      title: "Akses Barista",
      subtitle: "Atur PIN masuk untuk login staf barista di display dapur",
      icon: FiLock,
    },
    {
      id: "notifikasi",
      title: "Notifikasi Aplikasi",
      subtitle: "Atur preferensi suara notifikasi pesanan masuk dan stok",
      icon: FiVolume2,
    },
    {
      id: "printer",
      title: "Thermal Printer",
      subtitle: "Atur koneksi printer thermal kasir untuk cetak struk otomatis",
      icon: FiPrinter,
    },
  ];

  return (
    <div className="select-none space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 h-8">
        {showMobileDetail && (
          <button
            onClick={() => setShowMobileDetail(false)}
            className="md:hidden p-1 -ml-1 text-zinc-700 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer outline-none active:scale-95 flex items-center justify-center"
          >
            <FiChevronLeft className="w-6 h-6 shrink-0" />
          </button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
      </div>

      {/* Content Area */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Column - Sidebar Menu */}
        <div className={`${showMobileDetail ? "hidden" : "block"} md:block w-full md:w-80 flex-shrink-0`}>
          <SidebarMenu
            activeTab={activeTab}
            setActiveTab={handleSelectTab}
            menuItems={menuItems}
            trimToWord={trimToWord}
            showActive={!isMobile || showMobileDetail}
          />
        </div>

        {/* Right Column - Tab Content */}
        <div className={`flex-1 w-full ${showMobileDetail ? "block" : "hidden"} md:block`}>
          <div className="bg-white dark:bg-zinc-900 p-5 md:p-6 rounded border border-zinc-100 dark:border-zinc-800/80">
            {activeTab === "barista" && (
              <AksesBaristaTab
                onShowSuccessAlert={showSuccessBanner}
              />
            )}

            {activeTab === "notifikasi" && (
              <SuaraNotifikasiTab />
            )}

            {activeTab === "printer" && (
              <ThermalPrinterTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
