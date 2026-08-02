'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from '@/components/ui/CheckCircle'
import { CrossCircle } from '@/components/ui/CrossCircle'
import { playSwalSound } from '@/utils/sound'
import { FiPrinter, FiBluetooth, FiCpu, FiRefreshCw, FiEdit2, FiX } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { Modal } from '@/components/ui/Modal'
import { printThermalReceipt } from '@/utils/printReceipt'
import { scanAndConnectBluetoothDevice, scanAndConnectUSBDevice } from '@/services/printer/webBluetoothPrinter'

interface PrinterSettings {
  printerName: string
  bridgeUrl: string
  connectionType: 'bluetooth' | 'usb'
  paperWidth: '58mm' | '80mm'
  autoPrint: boolean
  printCopies: number
  headerText: string
  addressText: string
  footerText: string
}

export function ThermalPrinterTab() {
  const DEFAULT_SETTINGS: PrinterSettings = {
    printerName: 'RPP02N Thermal Printer',
    bridgeUrl: 'http://127.0.0.1:5000',
    connectionType: 'bluetooth',
    paperWidth: '58mm',
    autoPrint: true,
    printCopies: 1,
    headerText: 'Kedai Kopi',
    addressText: 'Balaraja, Tangerang',
    footerText: 'Terima kasih atas kunjungan Anda!',
  }

  const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS)
  const [draftSettings, setDraftSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS)
  const [isEditing, setIsEditing] = useState(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [deviceName, setDeviceName] = useState<string>('RPP02N Thermal Printer')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTestPrintOpen, setIsTestPrintOpen] = useState(false)

  const checkLivePrinterStatus = useCallback(async (customUrl?: string) => {
    setIsConnecting(true)
    const urlsToTest = customUrl || settings.bridgeUrl
      ? [customUrl || settings.bridgeUrl || '']
      : typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? ['http://localhost:5000', 'http://127.0.0.1:5000']
      : ['http://127.0.0.1:5000', 'http://localhost:5000']

    for (const targetUrl of urlsToTest) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1500)

        const res = await fetch(`${targetUrl}/api/status`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()
          if (data.ready === true && data.connected === true) {
            setIsConnected(true)
            if (data.printer) {
              setDeviceName(data.printer)
            }
            setIsConnecting(false)
            return true
          }
        }
      } catch {}
    }

    setIsConnected(false)
    setIsConnecting(false)
    return false
  }, [settings.bridgeUrl])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('setting_thermal_printer')
      let activeUrl = 'http://127.0.0.1:5000'
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const pName = parsed.printerName || (parsed.deviceName && parsed.deviceName !== 'POS-58 Thermal Printer' ? parsed.deviceName : 'RPP02N Thermal Printer')
          const merged = { ...DEFAULT_SETTINGS, ...parsed, printerName: pName }
          setSettings(merged)
          setDraftSettings(merged)
          setDeviceName(pName)
          if (merged.bridgeUrl) activeUrl = merged.bridgeUrl
        } catch {
          // fallback default
        }
      }
      checkLivePrinterStatus(activeUrl)
    }
  }, [checkLivePrinterStatus])

  const updateSetting = <K extends keyof PrinterSettings>(key: K, value: PrinterSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleStartEdit = () => {
    setDraftSettings(settings)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setSettings(draftSettings)
    setIsEditing(false)
  }

  const handleConnectDevice = async () => {
    const isOnline = await checkLivePrinterStatus()
    if (isOnline) {
      playSwalSound('success')
      Swal.fire({
        title: 'Printer Terhubung!',
        text: `Local Print Bridge & printer '${settings.printerName}' siap digunakan.`,
        icon: 'success',
        confirmButtonColor: '#0284c7',
      })
    } else {
      playSwalSound('error')
      Swal.fire({
        title: 'Gagal Menghubungkan',
        text: `Local Print Bridge (${settings.bridgeUrl || 'http://127.0.0.1:5000'}) tidak merespons atau Bluetooth printer terputus pada perangkat ini.`,
        icon: 'warning',
        confirmButtonColor: '#0284c7',
      })
    }
  }

  const handleTestPrint = () => {
    setIsTestPrintOpen(true)
    printThermalReceipt({
      orderNumber: 'TEST-0001',
      customerName: 'Pelanggan Uji Coba',
      tableNumber: '05',
      orderType: 'dine_in',
      dateTime: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      items: [
        { name: 'Kopi Susu Aren', quantity: 1, price: 13000 },
        { name: 'Cireng Rujak', quantity: 1, price: 10000 },
      ],
      totalAmount: 23000,
      paymentMethod: 'Tunai / QRIS',
    })
  }

  const handleTestRawBtAndroid = () => {
    const rawText = "KEDAI KOPI\n--------------------------------\nTgl : 3 Agu 2026 00:56 WIB\nID  : ORD-TEST-RAWBT\nNama: Tes Android HP\nMeja: Meja #05\n--------------------------------\nKopi Susu Aren       Rp 13.000\nCireng Rujak         Rp 10.000\n--------------------------------\nTOTAL                Rp 23.000\n--------------------------------\nTerima Kasih!\n\n\n\n"
    const encodedText = encodeURIComponent(rawText)
    const intentUrl = `intent:#Intent;scheme=rawbt;package=ru.a404.rawbtprinter;S.txt=${encodedText};end;`
    window.location.href = intentUrl
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (typeof window !== 'undefined') {
      localStorage.setItem('setting_thermal_printer', JSON.stringify(settings))
    }
    setDraftSettings(settings)
    setIsEditing(false)
    await checkLivePrinterStatus()
    playSwalSound('success')
    Swal.fire({
      title: 'Pengaturan Disimpan!',
      text: `Konfigurasi printer '${settings.printerName}' berhasil disimpan.`,
      icon: 'success',
      confirmButtonColor: '#0284c7',
    })
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
      {/* Header Info & Status Connection Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:bg-zinc-800/50 border border-none dark:border-zinc-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <FiPrinter className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
              Status Printer
            </h3>
            {isConnected ? (
              <div className="flex items-center gap-2 mt-0.5 text-xs font-normal">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{settings.printerName || deviceName}</span>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size="sm" />
                  <span>Terhubung</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-0.5 text-xs font-normal text-rose-500 dark:text-rose-400">
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

      <div className="space-y-6">
        {/* Section 1: Tipe Koneksi */}
        <div className="pt-2 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Tipe Koneksi Printer
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!isEditing}
              onClick={() => updateSetting('connectionType', 'bluetooth')}
              className={`flex items-center gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                settings.connectionType === 'bluetooth'
                  ? 'border-sky-500 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              <FiBluetooth className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs font-bold">Bluetooth</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Nirkabel (Mobile/Tablet)</p>
              </div>
            </button>

            <button
              type="button"
              disabled={!isEditing}
              onClick={() => updateSetting('connectionType', 'usb')}
              className={`flex items-center gap-3 p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                settings.connectionType === 'usb'
                  ? 'border-sky-500 text-sky-700 dark:text-sky-300'
                  : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300'
              } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                  disabled={!isEditing}
                  onClick={() => updateSetting('paperWidth', '58mm')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border cursor-pointer transition-all whitespace-nowrap ${
                    settings.paperWidth === '58mm'
                      ? 'border-sky-500 text-sky-600 dark:text-sky-300'
                      : 'border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  58 mm (Mini Thermal)
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => updateSetting('paperWidth', '80mm')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border cursor-pointer transition-all whitespace-nowrap ${
                    settings.paperWidth === '80mm'
                      ? 'border-sky-500 text-sky-600 dark:text-sky-300'
                      : 'border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  } ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}
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
                disabled={!isEditing}
                value={settings.printCopies}
                onChange={(e) => updateSetting('printCopies', Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-70 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed"
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
            <div className="w-full sm:w-1/2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Nama Kedai
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {settings.headerText?.length || 0}/32
                </span>
              </div>
              <input
                type="text"
                disabled={!isEditing}
                maxLength={32}
                value={settings.headerText}
                onChange={(e) => updateSetting('headerText', e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-70 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Alamat
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {settings.addressText?.length || 0}/32
                </span>
              </div>
              <input
                type="text"
                disabled={!isEditing}
                maxLength={32}
                value={settings.addressText}
                onChange={(e) => updateSetting('addressText', e.target.value)}
                placeholder="Contoh: Balaraja, Tangerang"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-70 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed"
              />
            </div>
            <div className="w-full sm:w-1/2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  Teks Footer
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">
                  {settings.footerText?.length || 0}/32
                </span>
              </div>
              <input
                type="text"
                disabled={!isEditing}
                maxLength={32}
                value={settings.footerText}
                onChange={(e) => updateSetting('footerText', e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs outline-none focus:border-sky-500 text-zinc-900 dark:text-zinc-100 disabled:opacity-70 disabled:bg-zinc-50 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons: Test Print & Dynamic Actions (Edit vs Batal + Simpan) */}
      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/65 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTestPrint}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <FiPrinter className="w-4 h-4" />
            <span>Uji Coba PC</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTestRawBtAndroid}
            className="w-full sm:w-auto flex items-center justify-center gap-2 border-emerald-300 text-emerald-700 dark:text-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          >
            <FiPrinter className="w-4 h-4" />
            <span>Tes RawBT (Android HP)</span>
          </Button>
        </div>

        {!isEditing ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleStartEdit}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5"
          >
            <FiEdit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCancelEdit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5"
            >
              <FiX className="w-3.5 h-3.5" />
              <span>Batal</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Simpan Perubahan
            </Button>
          </div>
        )}
      </div>
    </form>

    {/* Modal Preview Struk Uji Coba */}
    <Modal
      isOpen={isTestPrintOpen}
      onClose={() => setIsTestPrintOpen(false)}
      title="Preview Struk Thermal"
      size="sm"
    >
      <div className="p-6">
        {/* Kertas struk dengan lebar terbatas seperti 58mm/80mm */}
        <div className="mx-auto font-mono text-xs sm:text-sm bg-white dark:bg-zinc-950 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-5 space-y-2 text-zinc-800 dark:text-zinc-200 shadow-xs"
          style={{ maxWidth: settings.paperWidth === '58mm' ? '300px' : '360px' }}
        >
          {/* Header */}
          <p className="text-center font-bold uppercase text-sm">{settings.headerText}</p>
          {settings.addressText && <p className="text-center text-[10px] text-zinc-500">{settings.addressText}</p>}

          <hr className="border-dashed border-zinc-300 dark:border-zinc-600 my-1" />

          {/* Info Order */}
          <p>Tgl&nbsp;: {new Date().toLocaleDateString('id-ID')} {new Date().toLocaleTimeString('id-ID')}</p>
          <p>No&nbsp;&nbsp;: #TEST-0001</p>
          <p>Nama: Joko Widodo</p>
          <p>Meja: 05</p>

          <hr className="border-dashed border-zinc-300 dark:border-zinc-600 my-1" />

          {/* Items */}
          <div className="flex justify-between"><span>1x Kopi Susu Aren</span><span>Rp 13.000</span></div>
          <div className="flex justify-between"><span>1x Cireng Rujak</span><span>Rp 10.000</span></div>

          <hr className="border-dashed border-zinc-300 dark:border-zinc-600 my-1" />

          {/* Total */}
          <div className="flex justify-between font-bold"><span>TOTAL</span><span>Rp 23.000</span></div>

          <hr className="border-dashed border-zinc-300 dark:border-zinc-600 my-1" />

          {/* Footer */}
          <p className="text-center text-[10px] text-zinc-500 pt-1">{settings.footerText}</p>
        </div>

        <p className="mt-4 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          Lebar kertas: {settings.paperWidth} • {settings.printCopies} salinan
        </p>
      </div>
    </Modal>
    </>
  )
}
