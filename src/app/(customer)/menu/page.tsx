'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerMenuCard } from '../_components/CustomerMenuCard'
import { CartDrawer } from '../_components/CartDrawer'
import { ImageGalleryModal } from '../_components/ImageGalleryModal'
import { MenuItem, CartItem } from '@/types/customer'
import { FiChevronUp, FiChevronRight, FiChevronDown, FiSearch, FiX, FiArrowUpRight } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { playSound, playSwalSound } from '@/utils/sound'
import { getMenuItems, hasMenuCache, subscribeToMenu, getCachedMenuItemsSync } from '@/services/supabase/menuService'
import { createOrder } from '@/services/supabase/orderService'
import { getCurrentUser } from '@/services/supabase/authService'
import { createClient } from '@/services/supabase/client'
import { CheckCircle } from '@/components/ui/CheckCircle'
import { DatabaseMenu } from '@/types/database'

function mapDatabaseMenuToCustomerMenuItem(item: DatabaseMenu): MenuItem {
  const images = item.images && item.images.length > 0 ? item.images : ['/img/kedai-kopi.jpeg']
  return {
    id: item.id,
    name: item.name,
    category: item.sub_category,
    mainCategory: item.main_category,
    price: Number(item.price),
    points: item.points ?? Math.floor(Number(item.price) / 1000),
    image: images[0],
    images,
    description: item.description || '',
    isAvailable: item.is_available,
  }
}

export default function CustomerMenuPage() {
  const router = useRouter()
  const [menuList, setMenuList] = useState<MenuItem[]>(() => {
    const cached = getCachedMenuItemsSync()
    return cached.map(mapDatabaseMenuToCustomerMenuItem)
  })
  const [loading, setLoading] = useState<boolean>(() => !hasMenuCache() && menuList.length === 0)
  const [selectedType, setSelectedType] = useState<'semua' | 'minuman' | 'makanan'>('semua')
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false)
  const [isSubCatOpen, setIsSubCatOpen] = useState<boolean>(false)
  const [myPoints, setMyPoints] = useState<number>(0)
  const subCatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadMyPoints() {
      const user = await getCurrentUser()
      if (user) {
        const supabase = createClient()
        const { data } = await supabase
          .from('member_points')
          .select('points')
          .eq('user_id', user.id)
          .single()
        if (data) {
          setMyPoints(data.points ?? 0)
        }
      }
    }
    loadMyPoints()
  }, [])

  const fetchMenu = useCallback(async (isSilent = false) => {
    const hasData = hasMenuCache() || menuList.length > 0
    if (!isSilent && !hasData) {
      setLoading(true)
    }
    const dbData = await getMenuItems(true)
    setMenuList(dbData.map(mapDatabaseMenuToCustomerMenuItem))
    setLoading(false)
  }, [menuList.length])

  useEffect(() => {
    const hasData = hasMenuCache() || menuList.length > 0
    fetchMenu(hasData)

    const unsubscribe = subscribeToMenu(() => {
      fetchMenu(true)
    })

    return () => {
      unsubscribe()
    }
  }, [fetchMenu, menuList.length])

  // Tutup custom dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subCatRef.current && !subCatRef.current.contains(e.target as Node)) {
        setIsSubCatOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false)

  // Image Gallery Modal state (Produk Tunggal)
  const [selectedGalleryProduct, setSelectedGalleryProduct] = useState<MenuItem | null>(null)

  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num)

  // Sub-categories list dinamis berdasarkan database & selectedType
  const availableSubCategories = useMemo(() => {
    let filtered = menuList
    if (selectedType === 'minuman') {
      filtered = menuList.filter((item) => item.mainCategory === 'Minuman')
    } else if (selectedType === 'makanan') {
      filtered = menuList.filter((item) => item.mainCategory === 'Makanan')
    }
    const categories = Array.from(new Set(filtered.map((item) => item.category).filter(Boolean)))
    return categories
  }, [menuList, selectedType])

  // Filtered menu logic (100% dinamis dari mainCategory & subCategory)
  const filteredMenu = useMemo(() => {
    return menuList.filter((item) => {
      // Filter tipe utama (Minuman vs Makanan)
      if (selectedType === 'minuman' && item.mainCategory !== 'Minuman') {
        return false
      }
      if (selectedType === 'makanan' && item.mainCategory !== 'Makanan') {
        return false
      }

      // Filter sub-kategori spesifik
      if (selectedSubCategory !== 'Semua' && item.category !== selectedSubCategory) {
        return false
      }

      // Filter pencarian
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchSearch
    })
  }, [menuList, selectedType, selectedSubCategory, searchQuery])

  // State & Observer untuk Lazy Load Batch (12 Awal, +6 saat scroll)
  const [displayLimit, setDisplayLimit] = useState<number>(12)
  const observerTargetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setDisplayLimit(12)
  }, [selectedType, selectedSubCategory, searchQuery])

  const visibleMenu = useMemo(() => {
    return filteredMenu.slice(0, displayLimit)
  }, [filteredMenu, displayLimit])

  useEffect(() => {
    if (displayLimit >= filteredMenu.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((prev) => Math.min(prev + 6, filteredMenu.length))
        }
      },
      { rootMargin: '200px' }
    )

    const currentEl = observerTargetRef.current
    if (currentEl) observer.observe(currentEl)

    return () => {
      if (currentEl) observer.unobserve(currentEl)
    }
  }, [displayLimit, filteredMenu.length])

  const handleOpenGallery = (targetItem: MenuItem) => {
    setSelectedGalleryProduct(targetItem)
  }

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === item.id)
      if (existing) {
        return prev.map((c) =>
          c.product.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { product: item, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.product.id !== id))
    } else {
      setCart((prev) =>
        prev.map((c) => (c.product.id === id ? { ...c, quantity: qty } : c))
      )
    }
  }

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== id))
  }

  const handlePesan = async () => {
    const user = await getCurrentUser()

    // Jika pemesan ANONIM (belum login), terapkan jeda 7 menit (anti-spam)
    if (!user) {
      const COOLDOWN_MS = 7 * 60 * 1000 // 7 Menit dalam milidetik
      const lastOrderTimeStr = localStorage.getItem('kedai_anon_last_order_time')

      if (lastOrderTimeStr) {
        const lastOrderTime = parseInt(lastOrderTimeStr, 10)
        const elapsedMs = Date.now() - lastOrderTime

        if (elapsedMs < COOLDOWN_MS) {
          const remainingMins = Math.ceil((COOLDOWN_MS - elapsedMs) / (60 * 1000))
          playSwalSound('confirm')
          Swal.fire({
            title: 'Harap Tunggu Sebentar',
            text: `Harap tunggu ${remainingMins} menit lagi sebelum membuat pesanan berikutnya.`,
            icon: 'info',
            confirmButtonColor: '#3D2514',
            confirmButtonText: 'Mengerti',
            customClass: {
              popup: 'swal2-popup',
            },
          })
          return
        }
      }
    }

    const defaultName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
    const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null

    playSwalSound('confirm')
    Swal.fire({
      title: 'Konfirmasi Pesanan',
      text: `${totalCartItems} item · ${formatRupiah(finalCartPrice)}`,
      input: 'text',
      inputValue: defaultName,
      inputPlaceholder: 'Masukkan nama kamu',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3D2514',
      cancelButtonColor: '#f1f5f9',
      confirmButtonText: 'Ya, Pesan!',
      cancelButtonText: 'Batal',
      reverseButtons: true,
      customClass: {
        popup: 'swal2-popup',
        cancelButton: '!text-slate-600',
        input: '!rounded-xl !border-slate-200 !text-sm !py-2.5 !mt-2 !mb-5 !shadow-none !outline-none !focus:outline-none !focus:ring-0 !focus:shadow-none !focus:border-amber-800',
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Nama pemesan wajib diisi!'
        }
      },
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton()
        const inputEl = Swal.getInput()
        if (confirmBtn && inputEl) {
          const checkInput = () => {
            const val = inputEl.value.trim()
            if (val.length > 0) {
              confirmBtn.disabled = false
              confirmBtn.style.opacity = '1'
              confirmBtn.style.cursor = 'pointer'
            } else {
              confirmBtn.disabled = true
              confirmBtn.style.opacity = '0.5'
              confirmBtn.style.cursor = 'not-allowed'
            }
          }

          checkInput()
          inputEl.addEventListener('input', checkInput)
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const customerName = result.value.trim()
        const orderItems = cart.map((c) => ({
          name: c.product.name,
          price: c.product.price,
          quantity: c.quantity,
          points: (c.product.points ?? Math.floor(c.product.price / 1000)) * c.quantity,
        }))

        const created = await createOrder({
          customerName,
          customerAvatarUrl: avatarUrl,
          userId: user?.id ?? null,
          items: orderItems,
          totalAmount: finalCartPrice,
          claimedPoints: isClaimed ? claimedDiscountAmount : 0,
        })

        // Simpan timestamp pemesanan untuk pelanggan anonim
        if (!user && created) {
          localStorage.setItem('kedai_anon_last_order_time', String(Date.now()))
        }

        // Potong poin yang diklaim di database Supabase jika logged in
        if (user && created && isClaimed && claimedDiscountAmount > 0) {
          const updatedPoints = Math.max(0, myPoints - claimedDiscountAmount)
          const supabase = createClient()
          await supabase
            .from('member_points')
            .upsert({ user_id: user.id, points: updatedPoints }, { onConflict: 'user_id' })

          setMyPoints(updatedPoints)
        }

        setIsClaimed(false)
        setCart([])
        playSwalSound('success')
        Swal.fire({
          title: 'Pesanan Terkirim!',
          text: created
            ? `Pesanan #${created.order_number} atas nama "${customerName}" telah dikirim ke barista.`
            : `Pesanan atas nama "${customerName}" telah dikirim ke barista.`,
          icon: 'success',
          confirmButtonColor: '#3D2514',
          confirmButtonText: 'Oke',
          customClass: { popup: 'swal2-popup' },
        })
      }
    })
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const totalPointsEarned = cart.reduce(
    (sum, item) => sum + (item.product.points ?? Math.floor(item.product.price / 1000)) * item.quantity,
    0
  )

  const [isClaimed, setIsClaimed] = useState<boolean>(false)

  const usablePoints = useMemo(() => {
    return Math.floor(myPoints / 1000) * 1000
  }, [myPoints])

  const canClaim = useMemo(() => {
    if (cart.length === 0) return false
    return usablePoints >= 1000
  }, [cart.length, usablePoints])

  useEffect(() => {
    if (!canClaim && isClaimed) {
      setIsClaimed(false)
    }
  }, [canClaim, isClaimed])

  const claimedDiscountAmount = isClaimed && canClaim ? Math.min(totalCartPrice, usablePoints) : 0
  const finalCartPrice = Math.max(0, totalCartPrice - claimedDiscountAmount)

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-[#3D2514] selection:text-white">
      <main className="flex-1 w-full max-w-7xl mx-auto px-2.5 sm:px-6 pt-2 sm:pt-4 pb-28 sm:pb-24">
        {/* 3 Combining Main Filters + Expandable Search Overlay (Sticky Top) */}
        <section className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-2.5 sm:py-3 -mx-2.5 px-2.5 sm:mx-0 sm:px-0 mb-3 sm:mb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="relative flex items-center justify-between gap-2 max-w-xl mx-auto">
            {/* Standard Filter Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full min-w-0">
              {/* Tombol "Minuman" */}
              <button
                type="button"
                onClick={() => {
                  const nextType = selectedType === 'minuman' ? 'semua' : 'minuman'
                  setSelectedType(nextType)
                  setSelectedSubCategory('Semua')
                }}
                className={`px-3 sm:px-4 h-9 text-xs font-semibold rounded-full transition-all cursor-pointer border shrink-0 ${
                  selectedType === 'minuman'
                    ? 'bg-[#3D2514] text-amber-50 dark:bg-amber-100 dark:text-[#3D2514] border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-amber-50/60 dark:hover:bg-slate-800'
                }`}
              >
                Minuman
              </button>

              {/* Tombol "Makanan" */}
              <button
                type="button"
                onClick={() => {
                  const nextType = selectedType === 'makanan' ? 'semua' : 'makanan'
                  setSelectedType(nextType)
                  setSelectedSubCategory('Semua')
                }}
                className={`px-3 sm:px-4 h-9 text-xs font-semibold rounded-full transition-all cursor-pointer border shrink-0 ${
                  selectedType === 'makanan'
                    ? 'bg-[#3D2514] text-amber-50 dark:bg-amber-100 dark:text-[#3D2514] border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-amber-50/60 dark:hover:bg-slate-800'
                }`}
              >
                Makanan
              </button>

              {/* Dropdown Sub-Kategori */}
              <div ref={subCatRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSubCatOpen((v) => !v)}
                  className="h-9 px-2.5 inline-flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <span>{selectedSubCategory}</span>
                  <FiChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isSubCatOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSubCatOpen && (
                  <div className="absolute top-full left-0 mt-1 z-40 min-w-[9rem] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-lg overflow-hidden py-1">
                    {['Semua', ...availableSubCategories].map((subCat) => (
                      <button
                        key={subCat}
                        type="button"
                        onClick={() => {
                          setSelectedSubCategory(subCat)
                          setIsSubCatOpen(false)
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                          selectedSubCategory === subCat
                            ? 'text-[#3D2514] dark:text-amber-200 bg-amber-50/60 dark:bg-amber-900/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {subCat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol Pencarian */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="ml-auto h-9 w-9 shrink-0 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                title="Cari Menu"
              >
                <FiSearch className="h-4 w-4" />
              </button>
            </div>

            {/* Overlay Input Pencarian */}
            {isSearchOpen && (
              <div className="absolute inset-0 z-30 flex items-center bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md">
                <div className="relative flex-1 flex items-center">
                  <FiSearch className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Cari nama atau deskripsi menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-8 text-xs font-medium bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 rounded-full focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false)
                    setSearchQuery('')
                  }}
                  className="ml-2 h-9 w-9 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Tutup Pencarian"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Loading / Product Grid */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Memuat menu...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
              {visibleMenu.map((item) => {
                const cartItem = cart.find((c) => c.product.id === item.id)
                return (
                  <CustomerMenuCard
                    key={item.id}
                    item={item}
                    cartQuantity={cartItem ? cartItem.quantity : 0}
                    onAddToCart={handleAddToCart}
                    onUpdateQuantity={handleUpdateQuantity}
                    onOpenGallery={handleOpenGallery}
                    formatRupiah={formatRupiah}
                  />
                )
              })}
            </div>

            {/* Element Sentinel untuk Trigger Lazy Load +6 */}
            {displayLimit < filteredMenu.length && (
              <div
                ref={observerTargetRef}
                className="py-6 text-center text-xs text-slate-400 font-medium animate-pulse"
              >
                Memuat menu lainnya...
              </div>
            )}
          </>
        )}

        {!loading && filteredMenu.length === 0 && (
          <div className="py-16 text-center text-slate-400 space-y-2 bg-[#FAF8F5] dark:bg-slate-900/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <p className="text-sm font-medium">Tidak ada menu yang tersedia.</p>
          </div>
        )}
      </main>

      {/* Bar Keranjang Pesanan */}
      {totalCartItems > 0 && (
        <div className="fixed bottom-14 left-0 right-0 sm:left-4 sm:right-4 z-40 w-full sm:max-w-lg sm:mx-auto flex flex-col justify-end pointer-events-none">
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            formatRupiah={formatRupiah}
            claimedProductId={null}
            claimedDiscountAmount={claimedDiscountAmount}
          />

          <div 
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="pointer-events-auto w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2.5 sm:p-3 flex items-center justify-between gap-3 relative z-40 rounded-none cursor-pointer"
            title={isCartOpen ? "Tutup rincian keranjang" : "Buka rincian keranjang"}
          >
            <div className="flex items-center gap-2 sm:gap-3 text-left group flex-1 min-w-0">
              <div className="flex flex-col items-center justify-center min-w-6 sm:min-w-8 leading-none px-0.5 shrink-0">
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  {totalCartItems}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-0.5 mt-0.5 group-hover:text-[#3D2514] transition-colors">
                  <span>Item</span>
                  {isCartOpen ? (
                    <FiChevronUp className="h-3 w-3 shrink-0 text-[#3D2514] dark:text-amber-200" />
                  ) : (
                    <FiChevronRight className="h-3 w-3 shrink-0" />
                  )}
                </span>
              </div>

              {/* Garis Vertikal Pemisah Kiri */}
              <div className="w-px h-7 bg-slate-200 dark:bg-slate-800 shrink-0 mx-0.5 sm:mx-1" />

              {/* Kolom Poin Saya */}
              <div className="flex flex-col justify-start shrink-0">
                <span className="text-[9px] sm:text-[11px] text-slate-400 block leading-none mb-1">Poin Saya</span>
                <div className="flex items-center gap-1.5 h-4.5 sm:h-5 leading-none">
                  {isClaimed ? (
                    <>
                      <span className="text-xs sm:text-sm font-extrabold text-sky-600 dark:text-sky-400">
                        {Math.max(0, myPoints - claimedDiscountAmount).toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] sm:text-xs font-normal text-slate-400 dark:text-slate-500 line-through">
                        {claimedDiscountAmount.toLocaleString('id-ID')}
                      </span>
                    </>
                  ) : (
                    <span className={`text-xs sm:text-sm font-extrabold ${canClaim ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {myPoints.toLocaleString('id-ID')}
                    </span>
                  )}
                  {isClaimed ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsClaimed(false)
                      }}
                      className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity cursor-pointer flex items-center"
                      title="Batalkan Klaim"
                    >
                      <CheckCircle size="sm" />
                    </button>
                  ) : canClaim ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        playSound('paymentacc.mp3')
                        setIsClaimed(true)
                      }}
                      className="text-[9px] sm:text-[10px] font-normal px-1.5 py-0.5 rounded transition-colors text-sky-600 dark:text-sky-400 border border-sky-600/40 dark:border-sky-400/40 hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
                    >
                      Claim
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Total Bayar (Di-push ke Kanan dengan ml-auto) */}
              <div className="flex flex-col justify-start items-end text-right ml-auto shrink-0">
                <span className="text-[9px] sm:text-[11px] text-slate-400 block leading-none mb-1">Total Bayar</span>
                <div className="flex items-center justify-end h-4.5 sm:h-5 leading-none">
                  <span className="text-xs sm:text-sm font-extrabold text-[#3D2514] dark:text-amber-200">
                    {formatRupiah(finalCartPrice)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handlePesan()
              }}
              className="flex items-center justify-center font-semibold text-xs bg-[#3D2514] text-amber-50 dark:bg-amber-100 dark:text-[#3D2514] px-3.5 sm:px-4 py-2.5 rounded-lg hover:bg-[#2B190E] transition-colors cursor-pointer shrink-0"
            >
              <span>Pesan</span>
            </button>
          </div>
        </div>
      )}

      {/* Image Lightbox Gallery Modal */}
      <ImageGalleryModal
        isOpen={Boolean(selectedGalleryProduct)}
        onClose={() => setSelectedGalleryProduct(null)}
        product={selectedGalleryProduct}
        formatRupiah={formatRupiah}
      />
    </div>
  )
}
