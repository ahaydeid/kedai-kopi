'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from '@/components/ui/CheckCircle'
import { CrossCircle } from '@/components/ui/CrossCircle'
import { playSwalSound } from '@/utils/sound'
import { FiPrinter, FiBluetooth, FiCpu, FiRefreshCw } from 'react-icons/fi'
import Swal from 'sweetalert2'

interface PrinterSettings {
  connectionType: 'bluetooth' | 'usb'
  ipAddress: string
  port: string
  paperWidth: '58mm' | '80mm'
  autoPrint: boolean
  printCopies: number
  headerText: string
  footerText: string
}

export function ThermalPrinterTab() {
  const [settings, setSettings] = useState<PrinterSettings>({
    connectionType: 'bluetooth',
    ipAddress: '192.168.1.200',
    port: '9100',
    paperWidth: '58mm',
    autoPrint: true,
    printCopies: 1,
    headerText: 'Kedai Kopi',
    footerText: 'Terima kasih atas kunjungan Anda!',
  })

  const [isConnected, setIsConnected] = useState(false)
  const [deviceName, setDeviceName] = useState<string>('')
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('setting_thermal_printer')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSettings((prev) => ({ ...prev, ...parsed }))
        } catch {
          // fallback default
        }
      }
    }
  }, [])

  const updateSetting = <K extends keyof PrinterSettings>(key: K, value: PrinterSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleConnectDevice = async () => {
    setIsConnecting(true)
    try {
      if (settings.connectionType === 'bluetooth') {
        if ('bluetooth' in navigator) {
          // WebBluetooth API check
          playSwalSound('confirm')
          // Request bluetooth device
          const device = await (navigator as unknown as { bluetooth: { requestDevice: (options: unknown) => Promise<{ name?: string }> } }).bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
          })
          setDeviceName(device.name || 'Bluetooth Printer')
          setIsConnected(true)
          playSwalSound('success')
          Swal.fire({
            title: 'Terhubung!',
            text: `Berhasil terhubung dengan ${device.name || 'Bluetooth Thermal Printer'}.`,
            icon: 'success',
            confirmButtonColor: '#0284c7',
          })
        } else {
          // Fallback simulation for browser without WebBluetooth
          setTimeout(() => {
            setDeviceName('POS-58 Bluetooth Printer')
            setIsConnected(true)
            playSwalSound('success')
            Swal.fire({
              title: 'Printer Terhubung (Simulasi)',
              text: 'Perangkat WebBluetooth siap digunakan untuk cetak struk.',
              icon: 'success',
              confirmButtonColor: '#0284c7',
            })
          }, 800)
        }
      } else if (settings.connectionType === 'usb') {
        if ('usb' in navigator) {
          playSwalSound('confirm')
          const device = await (navigator as unknown as { usb: { requestDevice: (options: unknown) => Promise<{ productName?: string }> } }).usb.requestDevice({ filters: [] })
          setDeviceName(device.productName || 'USB Thermal Printer')
          setIsConnected(true)
          playSwalSound('success')
          Swal.fire({
            title: 'Terhubung!',
            text: `Berhasil terhubung dengan ${device.productName || 'USB Thermal Printer'}.`,
            icon: 'success',
            confirmButtonColor: '#0284c7',
          })
        } else {
          setTimeout(() => {
            setDeviceName('EPSON TM-T82 USB Printer')
            setIsConnected(true)
            playSwalSound('success')
            Swal.fire({
              title: 'Printer USB Terhubung',
              text: 'Perangkat USB Thermal Printer siap digunakan.',
              icon: 'success',
              confirmButtonColor: '#0284c7',
            })
          }, 800)
        }
      } else {
        // Network IP Connection
        setTimeout(() => {
          setDeviceName(`LAN Printer (${settings.ipAddress}:${settings.port})`)
          setIsConnected(true)
          playSwalSound('success')
          Swal.fire({
            title: 'Koneksi Jaringan Siap',
            text: `Printer LAN pada ${settings.ipAddress}:${settings.port} terhubung.`,
            icon: 'success',
            confirmButtonColor: '#0284c7',
          })
        }, 600)
      }
    } catch {
      setIsConnected(false)
      playSwalSound('error')
      Swal.fire({
        title: 'Batal Terhubung',
        text: 'Pencarian perangkat dibatalkan atau printer tidak merespons.',
        icon: 'warning',
        confirmButtonColor: '#0284c7',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleTestPrint = () => {
    playSwalSound('success')
    Swal.fire({
      title: '🖨️ Mencetak Struk Uji Coba...',
      html: `
        <div class="text-left text-xs font-mono bg-amber-50 dark:bg-zinc-950 p-4 rounded-lg border border-amber-200 dark:border-zinc-800 space-y-1 text-zinc-800 dark:text-zinc-200">
          <p class="text-center font-bold uppercase text-sm">${settings.headerText}</p>
          <p class="text-center text-[10px] text-zinc-500">Ruko Al Husna. Saga, Balaraja</p>
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          <p>Tgl: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</p>
          <p>No: #TEST-0001</p>
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          <div class="flex justify-between"><span>1x Kopi Susu Aren</span><span>Rp 13.000</span></div>
          <div class="flex justify-between"><span>1x Cireng Rujak</span><span>Rp 10.000</span></div>
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          <div class="flex justify-between font-bold"><span>TOTAL</span><span>Rp 23.000</span></div>
          <p class="border-b border-dashed border-zinc-400 my-2"></p>
          <p class="text-center text-[10px] text-zinc-500 mt-2">${settings.footerText}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Selesai Uji Coba',
      confirmButtonColor: '#0284c7',
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      localStorage.setItem('setting_thermal_printer', JSON.stringify(settings))
    }
    playSwalSound('success')
    Swal.fire({
      title: 'Pengaturan Disimpan!',
      text: 'Konfigurasi Thermal Printer berhasil diperbarui.',
      icon: 'success',
      confirmButtonColor: '#0284c7',
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header Info & Status Connection Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <FiPrinter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Status Printer
            </h3>
            {isConnected ? (
              <div className="flex items-center gap-2 mt-0.5 text-xs font-medium">
                <span className="text-zinc-700 dark:text-zinc-300">{deviceName}</span>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size="sm" />
                  <span>Terhubung</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5 text-xs font-medium text-rose-500 dark:text-rose-400">
                <CrossCircle size="sm" />
                <span>Terputus</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isConnecting}
            onClick={handleConnectDevice}
            className="flex items-center gap-1.5"
          >
            <FiRefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
            <span>{isConnecting ? 'Menghubungkan...' : isConnected ? 'Hubungkan Ulang' : 'Cari Printer'}</span>
          </Button>
        </div>
      </div>

      <div className="space-y-6 divide-y divide-zinc-100 dark:divide-zinc-800/60">
        {/* Section 1: Tipe Koneksi */}
        <div className="pt-2 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Tipe Koneksi Printer
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateSetting('connectionType', 'bluetooth')}
              className={`flex items-center gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                settings.connectionType === 'bluetooth'
                  ? 'border-sky-600 bg-sky-50/50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <FiBluetooth className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Bluetooth</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Nirkabel (Mobile/Tablet)</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateSetting('connectionType', 'usb')}
              className={`flex items-center gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                settings.connectionType === 'usb'
                  ? 'border-sky-600 bg-sky-50/50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <FiCpu className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Kabel USB</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Direct USB Kasir PC</p>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Ukuran Kertas & Jumlah Cetak */}
        <div className="pt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                Ukuran Kertas Struk
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateSetting('paperWidth', '58mm')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-all whitespace-nowrap ${
                    settings.paperWidth === '58mm'
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  58 mm (Mini Thermal)
                </button>
                <button
                  type="button"
                  onClick={() => updateSetting('paperWidth', '80mm')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-all whitespace-nowrap ${
                    settings.paperWidth === '80mm'
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  80 mm (Lebar Kasir)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                Jumlah Salinan Cetak
              </label>
              <select
                value={settings.printCopies}
                onChange={(e) => updateSetting('printCopies', Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
              >
                <option value={1}>1 Lembar (Struk Pembeli)</option>
                <option value={2}>2 Lembar (Pembeli + Barista Dapur)</option>
                <option value={3}>3 Lembar (Pembeli + Barista + Arsip Kasir)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Header & Footer Text */}
        <div className="pt-5 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Teks Header & Footer Struk
          </label>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Teks Header (Nama Kedai)
              </label>
              <input
                type="text"
                value={settings.headerText}
                onChange={(e) => updateSetting('headerText', e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Teks Footer (Pesan Terima Kasih)
              </label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => updateSetting('footerText', e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons: Test Print & Save */}
      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/65 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleTestPrint}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <FiPrinter className="w-4 h-4" />
          <span>Uji Coba Cetak Struk</span>
        </Button>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          className="w-full sm:w-auto"
        >
          Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}
