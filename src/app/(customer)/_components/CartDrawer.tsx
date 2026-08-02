'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiPlus, FiMinus, FiCoffee, FiCheck, FiChevronDown } from 'react-icons/fi'
import { CartItem } from '@/types/customer'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  onUpdateQuantity: (id: string, qty: number) => void
  onRemoveItem?: (id: string) => void
  formatRupiah: (num: number) => string
  claimedProductId?: string | null
  claimedDiscountAmount?: number
  orderType: 'dine_in' | 'takeaway'
  onOrderTypeChange: (type: 'dine_in' | 'takeaway') => void
  tableNumber: string
  onTableNumberChange: (table: string) => void
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  formatRupiah,
  claimedProductId,
  claimedDiscountAmount,
  orderType,
  onOrderTypeChange,
  tableNumber,
  onTableNumberChange,
}) => {
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState<boolean>(false)
  const tableDropdownRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const portalRef = React.useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null)

  const toggleTableDropdown = () => {
    if (!isTableDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      })
    }
    setIsTableDropdownOpen((v) => !v)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        tableDropdownRef.current && !tableDropdownRef.current.contains(target) &&
        portalRef.current && !portalRef.current.contains(target)
      ) {
        setIsTableDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleClose = () => {
    onClose()
  }

  if (cartItems.length === 0) return null

  const handleUncheckItem = (id: string) => {
    if (cartItems.length <= 1) {
      handleClose()
    }
    if (onRemoveItem) {
      onRemoveItem(id)
    } else {
      onUpdateQuantity(id, 0)
    }
  }

  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <>
      {/* Backdrop Dimmer */}
      <div 
        className={`fixed inset-0 z-30 bg-slate-900/30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Drawer Panel: Mengintip 14px saat tertutup & meluncur naik saat dibuka */}
      <div
        className={`pointer-events-auto relative z-40 w-full bg-white dark:bg-slate-950 flex flex-col max-h-[60vh] overflow-hidden rounded-t-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-14px)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Garis Indikator Horizontal Pendek */}
        <div className="pt-2 pb-1 flex justify-center bg-white dark:bg-slate-950 shrink-0 cursor-pointer" onClick={() => !isOpen && onClose()}>
          <div className="w-8 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Kontainer Isi Modal */}
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-950">
          {/* Header Drawer */}
          <div className="flex items-center justify-between px-4 pb-2.5 pt-1 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                Keranjang Pesanan
              </h2>
              <span className="text-xs text-slate-400 font-normal">
                ({totalItemsCount} item)
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          {/* Opsi Tipe Pesanan: Dine In / Takeaway */}
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/80 dark:border-slate-800 w-full justify-center">
              <button
                type="button"
                onClick={() => onOrderTypeChange('dine_in')}
                className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer text-center ${
                  orderType === 'dine_in'
                    ? 'bg-[#3D2514] text-white dark:bg-amber-100 dark:text-[#3D2514] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Makan di Tempat
              </button>
              <button
                type="button"
                onClick={() => onOrderTypeChange('takeaway')}
                className={`flex-1 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer text-center ${
                  orderType === 'takeaway'
                    ? 'bg-[#3D2514] text-white dark:bg-amber-100 dark:text-[#3D2514] shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Bawa Pulang
              </button>
            </div>

            {/* Posisi Meja Editable (Portal Popup, melepaskan dari overflow clipping) */}
            {orderType === 'dine_in' && (
              <div className="flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400 font-medium">
                <span>Posisi Meja</span>
                <div ref={tableDropdownRef} className="relative inline-flex items-center">
                  <button
                    ref={buttonRef}
                    type="button"
                    onClick={toggleTableDropdown}
                    className="inline-flex items-center gap-1 font-bold text-sm text-[#3D2514] dark:text-amber-300 bg-transparent cursor-pointer outline-none hover:underline"
                  >
                    <span><span className="font-normal opacity-50">#</span>{tableNumber}</span>
                    <FiChevronDown className={`h-3 w-3 transition-transform ${isTableDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown popup via createPortal (z-index 9999, bebas dari overflow) */}
                  {isTableDropdownOpen && dropdownPos && typeof document !== 'undefined' && createPortal(
                    <div
                      ref={portalRef}
                      style={{
                        position: 'fixed',
                        top: dropdownPos.top,
                        right: dropdownPos.right,
                        zIndex: 9999,
                      }}
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-56 overflow-y-auto py-1 text-center divide-y divide-slate-100 dark:divide-slate-800/60 thin-scroll"
                    >
                      {Array.from({ length: 20 }, (_, i) => {
                        const num = String(i + 1).padStart(2, '0')
                        const isSelected = num === tableNumber
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              onTableNumberChange(num)
                              setIsTableDropdownOpen(false)
                            }}
                            className={`w-full py-1.5 text-xs font-semibold cursor-pointer transition-colors block ${
                              isSelected
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-[#3D2514] dark:text-amber-200'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            #{num}
                          </button>
                        )
                      })}
                    </div>,
                    document.body
                  )}
                </div>
              </div>
            )}
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 thin-scroll">
            {cartItems.map((cartItem) => {
              const hasImage = Boolean(cartItem.product.image && cartItem.product.image.trim() !== '')
              return (
                <div
                  key={cartItem.product.id}
                  className="flex items-center gap-2.5"
                >
                  {/* Checkbox Uncheck / Hapus Item dari Keranjang */}
                  <button
                    type="button"
                    onClick={() => handleUncheckItem(cartItem.product.id)}
                    className="h-5 w-5 rounded-md flex items-center justify-center border transition-colors cursor-pointer shrink-0 bg-[#3D2514] border-[#3D2514] text-white hover:bg-rose-600 hover:border-rose-600"
                    title="Klik me-uncheck/membatalkan item dari keranjang"
                  >
                    <FiCheck className="h-3.5 w-3.5 stroke-[3]" />
                  </button>

                  {/* Pembungkus Item */}
                  <div className="flex-1 flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl min-w-0">
                    <div className="h-11 w-11 bg-white dark:bg-slate-950 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {hasImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={cartItem.product.image}
                          alt={cartItem.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiCoffee className="h-5 w-5 text-slate-200 dark:text-slate-700" />
                      )}
                    </div>

                    {/* Informasi Produk */}
                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Baris 1: Nama Item Full Width */}
                      <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate leading-snug">
                        {cartItem.product.name}
                      </h4>

                      {/* Baris 2: Harga di Kiri & Counter Box (- n +) Tanpa Pembungkus Tambahan */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-1">
                          {cartItem.product.id === claimedProductId ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs font-semibold text-slate-400 line-through">
                                {formatRupiah(cartItem.product.price)}
                              </span>
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                Gratis
                              </span>
                            </div>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-[#3D2514] dark:text-amber-200">
                                {formatRupiah(cartItem.product.price)}
                              </span>
                              <span className="text-[9px] font-normal text-emerald-600 dark:text-emerald-400">
                                (+{cartItem.product.points ?? Math.floor(cartItem.product.price / 1000)} poin)
                              </span>
                            </>
                          )}
                        </div>

                        {/* Counter (- n +) Tanpa Kotak Pembungkus Tambahan */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={cartItem.quantity <= 1}
                            onClick={() =>
                              onUpdateQuantity(
                                cartItem.product.id,
                                Math.max(1, cartItem.quantity - 1)
                              )
                            }
                            className="h-5 w-5 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            title={cartItem.quantity <= 1 ? 'Kuantitas minimal 1' : 'Kurangi kuantitas'}
                          >
                            <FiMinus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 px-1 min-w-4 text-center">
                            {cartItem.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQuantity(cartItem.product.id, cartItem.quantity + 1)
                            }
                            className="h-5 w-5 rounded bg-[#3D2514] text-amber-50 flex items-center justify-center hover:bg-[#2B190E] cursor-pointer"
                            title="Tambah kuantitas"
                          >
                            <FiPlus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer Ringkasan Total (Hanya tampil jika ada diskon poin yang diclaim) */}
          {Boolean(claimedDiscountAmount && claimedDiscountAmount > 0) && (
            <div className="flex flex-col gap-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Diskon Poin</span>
                <span>-{formatRupiah(claimedDiscountAmount || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-semibold text-slate-400 line-through">
                    {formatRupiah(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0))}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-[#3D2514] dark:text-amber-200">
                    {formatRupiah(Math.max(0, cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) - (claimedDiscountAmount || 0)))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
