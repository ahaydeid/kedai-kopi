'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FiGlobe, FiCopy, FiCheck, FiRefreshCw, FiActivity, FiServer, FiWifi } from 'react-icons/fi'
import { Button } from '@/components/ui/Button'
import { CheckCircle } from '@/components/ui/CheckCircle'
import { CrossCircle } from '@/components/ui/CrossCircle'

interface BridgeStatus {
  status: string
  device: string
  ready: boolean
  printer: string
}

export function UrlMasukTab() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [statusData, setStatusData] = useState<BridgeStatus | null>(null)
  const [lanIp, setLanIp] = useState<string>('192.168.43.47')
  const [appUrl, setAppUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin)
      const host = window.location.hostname
      if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('vercel.app')) {
        setLanIp(host)
      }
    }
  }, [])

  const checkStatus = useCallback(async () => {
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const targetUrl = `http://${lanIp}:5000/api/status`
      const res = await fetch(targetUrl, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (res.ok) {
        const json = await res.json()
        setStatusData(json)
      } else {
        setStatusData(null)
      }
    } catch {
      // Try localhost fallback
      try {
        const res = await fetch('http://127.0.0.1:5000/api/status')
        if (res.ok) {
          const json = await res.json()
          setStatusData(json)
        } else {
          setStatusData(null)
        }
      } catch {
        setStatusData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [lanIp])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const urlsList = [
    {
      key: 'health',
      label: 'URL Health / Status Check (dites dari HP / LAN)',
      url: `http://${lanIp}:5000/api/status`,
      method: 'GET',
      desc: 'Endpoint pengujian konektivitas service Print Bridge dari perangkat di jaringan LAN / Wi-Fi.',
    },
    {
      key: 'print',
      label: 'URL / API Print (Endpoint Cetak)',
      url: `http://${lanIp}:5000/api/print`,
      method: 'POST',
      desc: 'Endpoint penerima payload ESC/POS untuk pencetakan langsung ke printer RPP02N.',
    },
    {
      key: 'web_app',
      label: 'URL Aplikasi POS (Vercel / Production)',
      url: appUrl || 'https://kedaikopi.ahadi.my.id',
      method: 'WEB',
      desc: 'Alamat utama aplikasi Web POS Kedai Kopi yang diakses oleh kasir/barista.',
    },
  ]

  return (
    <div className="space-y-6 text-zinc-900 dark:text-zinc-100">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FiGlobe className="w-5 h-5 text-sky-500" />
            <span>URL Masuk & Endpoint Jaringan</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Daftar URL dan endpoint API yang digunakan untuk akses LAN, health status, dan integrasi cetak.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={checkStatus}
          disabled={loading}
          className="self-start sm:self-auto flex items-center gap-1.5"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Cek Status</span>
        </Button>
      </div>

      {/* Status Panel Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-1">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <FiServer className="w-3.5 h-3.5" />
            <span>Print Bridge Service</span>
          </span>
          <div className="flex items-center gap-2 pt-1">
            {statusData ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">RUNNING</span>
              </>
            ) : (
              <>
                <CrossCircle className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">NOT RUNNING</span>
              </>
            )}
          </div>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-1">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <FiWifi className="w-3.5 h-3.5" />
            <span>Listening Interface</span>
          </span>
          <p className="text-sm font-bold pt-1 font-mono">0.0.0.0 (Port 5000)</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-1">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <FiActivity className="w-3.5 h-3.5" />
            <span>IP LAN Komputer Kasir</span>
          </span>
          <p className="text-sm font-bold pt-1 font-mono text-sky-600 dark:text-sky-400">{lanIp}</p>
        </div>
      </div>

      {/* URL List */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Daftar Endpoint URL</h3>

        <div className="space-y-3">
          {urlsList.map((item) => (
            <div
              key={item.key}
              className="bg-white dark:bg-zinc-950 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      item.method === 'GET'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : item.method === 'POST'
                        ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400'
                    }`}
                  >
                    {item.method}
                  </span>
                  <span className="text-xs font-bold">{item.label}</span>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => copyToClipboard(item.url, item.key)}
                  className="self-start sm:self-auto flex items-center gap-1.5 text-xs py-1 h-7"
                >
                  {copiedKey === item.key ? (
                    <>
                      <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-3.5 h-3.5" />
                      <span>Salin URL</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="font-mono text-xs p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-sky-600 dark:text-sky-400 break-all select-all">
                {item.url}
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
