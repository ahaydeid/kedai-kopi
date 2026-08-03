export interface ReceiptItem {
  name: string
  quantity: number
  price: number
}

export interface ReceiptData {
  orderNumber: string
  customerName?: string
  tableNumber?: string | null
  orderType?: 'dine_in' | 'takeaway' | string
  dateTime?: string
  notes?: string | null
  items: ReceiptItem[]
  totalAmount: number
  discountAmount?: number
  claimedPoints?: number
  paymentMethod?: string
}

export function getPrinterSettings() {
  const DEFAULT_SETTINGS = {
    connectionType: 'bluetooth',
    paperWidth: '58mm',
    autoPrint: true,
    printCopies: 1,
    headerText: 'Kedai Kopi',
    addressText: 'Balaraja, Tangerang',
    footerText: 'Terima kasih atas kunjungan Anda!',
  }

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('setting_thermal_printer')
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      } catch {}
    }
  }
  return DEFAULT_SETTINGS
}

function formatRupiah(num: number): string {
  return 'Rp ' + Math.floor(num).toLocaleString('id-ID')
}

function getCandidateBridgeUrls(configuredUrl?: string): string[] {
  if (configuredUrl) return [configuredUrl]
  if (process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL) return [process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL]

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost') {
      return ['http://localhost:5000', 'http://127.0.0.1:5000']
    }
    if (host === '127.0.0.1') {
      return ['http://127.0.0.1:5000', 'http://localhost:5000']
    }
    if (host) {
      return [`http://${host}:5000`, 'http://localhost:5000', 'http://127.0.0.1:5000']
    }
  }
  return ['http://localhost:5000', 'http://127.0.0.1:5000']
}

export async function printThermalReceipt(data: ReceiptData) {
  if (typeof window === 'undefined') return

  const settings = getPrinterSettings()

  const paperWidth = settings.paperWidth === '80mm' ? '80mm' : '58mm'
  const maxWidthPx = settings.paperWidth === '80mm' ? '300px' : '210px'
  const nowStr = data.dateTime || new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })

  const itemsHtml = data.items
    .map(
      (item) => `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
      <span style="flex: 1; padding-right: 4px;">${item.quantity > 1 ? `${item.quantity}x ` : ''}${item.name}</span>
      <span style="white-space: nowrap;">${formatRupiah(item.price * (item.quantity > 1 ? item.quantity : 1))}</span>
    </div>
  `
    )
    .join('')

  const itemsSum = data.items.reduce((acc, i) => acc + i.price * (i.quantity > 1 ? i.quantity : 1), 0)
  const explicitDisc = Number(data.discountAmount || data.claimedPoints || 0)
  const autoDisc = itemsSum > data.totalAmount ? itemsSum - data.totalAmount : 0
  const effectiveDiscount = explicitDisc > 0 ? explicitDisc : autoDisc

  const discountHtml =
    effectiveDiscount > 0
      ? `
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span>Subtotal</span>
      <span>${formatRupiah(itemsSum > 0 ? itemsSum : data.totalAmount + effectiveDiscount)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
      <span>Potongan Poin</span>
      <span>-${formatRupiah(effectiveDiscount)}</span>
    </div>
  `
      : ''

  const orderTypeLabel =
    String(data.orderType || '').toLowerCase() === 'takeaway' ||
    String(data.tableNumber || '').toLowerCase() === 'takeaway' ||
    !data.tableNumber
      ? 'Take Away'
      : `Meja #${String(data.tableNumber).replace(/^Meja\s*#?/i, '').trim()}`

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Print Receipt - ${data.orderNumber}</title>
        <style>
          @page {
            size: ${paperWidth} auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.3;
            width: ${maxWidthPx};
            margin: 0 auto;
            padding: 8px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; margin-top: 4px; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 13px; margin-bottom: 2px;">${settings.headerText}</div>
        ${settings.addressText ? `<div class="center" style="font-size: 9px; margin-bottom: 4px;">${settings.addressText}</div>` : ''}
        <div class="divider"></div>
        <div class="row"><span>Tgl</span><span>${nowStr}</span></div>
        <div class="row"><span>No.</span><span>${data.orderNumber}</span></div>
        ${data.customerName ? `<div class="row"><span>Nama</span><span>${data.customerName}</span></div>` : ''}
        <div class="row"><span>Tipe</span><span>${orderTypeLabel}</span></div>
        ${data.notes ? `<div class="row" style="margin-top: 2px;"><span style="font-weight: bold;">Catatan</span><span>${data.notes}</span></div>` : ''}
        ${data.paymentMethod ? `<div class="row"><span>Bayar</span><span>${data.paymentMethod}</span></div>` : ''}
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider"></div>
        ${discountHtml}
        <div class="total-row"><span>TOTAL</span><span>${formatRupiah(data.totalAmount)}</span></div>
        <div class="divider"></div>
        <div class="center" style="font-size: 9px; margin-top: 4px;">${settings.footerText}</div>
      </body>
    </html>
  `

  function executeIframeBrowserPrint() {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0px'
    iframe.style.height = '0px'
    iframe.style.border = '0px'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(receiptHtml)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1500)
      }, 250)
    }
  }

  // --- Android HP: route via RawBT direct scheme ---
  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
  if (isAndroid || settings.connectionType === 'rawbt') {
    let text = ''
    const headerStr = String(settings.headerText || 'KEDAI KOPI').substring(0, 32)
    text += `${headerStr}\n`
    if (settings.addressText) {
      text += `${String(settings.addressText).substring(0, 32)}\n`
    }
    text += `--------------------------------\n`
    text += `Tgl : ${nowStr}\n`
    const orderNo = String(data.orderNumber || '').replace(/^#\s*/, '')
    const idStr = orderNo.startsWith('ORD-') ? orderNo : `ORD-${orderNo}`
    text += `ID  : ${idStr}\n`
    if (data.customerName) {
      text += `Nama: ${String(data.customerName).substring(0, 24)}\n`
    }
    text += `Tipe: ${orderTypeLabel}\n`
    if (data.notes) {
      text += `Catatan: ${String(data.notes).substring(0, 64)}\n`
    }
    text += `--------------------------------\n`

    if (Array.isArray(data.items)) {
      data.items.forEach((item) => {
        const qtyStr = item.quantity > 1 ? `${item.quantity}x ` : ''
        const itemTitle = `${qtyStr}${item.name}`
        const priceVal = item.price * (item.quantity > 1 ? item.quantity : 1)
        const priceStr = formatRupiah(priceVal)

        if (itemTitle.length + priceStr.length + 1 <= 32) {
          const spaces = ' '.repeat(32 - itemTitle.length - priceStr.length)
          text += `${itemTitle}${spaces}${priceStr}\n`
        } else {
          const spaces = ' '.repeat(Math.max(0, 32 - priceStr.length))
          text += `${itemTitle}\n${spaces}${priceStr}\n`
        }
      })
    }

    text += `--------------------------------\n`

    if (effectiveDiscount > 0) {
      const subtotal = itemsSum > 0 ? itemsSum : data.totalAmount + effectiveDiscount
      const subLabel = 'Subtotal'
      const subStr = formatRupiah(subtotal)
      const subSpaces = ' '.repeat(Math.max(0, 32 - subLabel.length - subStr.length))
      text += `${subLabel}${subSpaces}${subStr}\n`

      const discLabel = 'Diskon'
      const discStr = `-${formatRupiah(effectiveDiscount)}`
      const discSpaces = ' '.repeat(Math.max(0, 32 - discLabel.length - discStr.length))
      text += `${discLabel}${discSpaces}${discStr}\n`
    }

    const totalLabel = 'TOTAL'
    const totalValStr = formatRupiah(data.totalAmount || 0)
    const totalSpaces = ' '.repeat(Math.max(0, 32 - totalLabel.length - totalValStr.length))
    text += `${totalLabel}${totalSpaces}${totalValStr}\n`

    if (data.paymentMethod) {
      text += `Bayar: ${data.paymentMethod}\n`
    }

    text += `--------------------------------\n`
    const footerStr = String(settings.footerText || 'Terima kasih atas kunjungan Anda!').substring(0, 32)
    text += `${footerStr}\n\n\n\n`

    const copies = Math.max(1, settings.printCopies || 1)
    let fullText = text
    if (copies > 1) {
      fullText = (text + '\n').repeat(copies)
    }

    // Skema teks murni standar RawBT (tanpa base64 binary parser)
    window.location.href = `rawbt:${encodeURIComponent(fullText)}`
    return
  }

  // --- Browser / iframe print (PC non-bluetooth) ---
  if (settings.connectionType === 'browser') {
    executeIframeBrowserPrint()
    return
  }

  // --- Default: Local Print Bridge (PC Linux → /dev/rfcomm0) ---
  const candidateUrls = getCandidateBridgeUrls(settings.bridgeUrl)
  let lastError = ''

  for (const url of candidateUrls) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch(`${url}/api/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          headerText: settings.headerText,
          addressText: settings.addressText,
          footerText: settings.footerText,
          printCopies: settings.printCopies || 1,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const resData = await response.json()
        if (resData.success) {
          console.log(`[Direct Print Success]: Printed via Local Print Bridge at ${url}`)
          return
        } else {
          lastError = resData.error || resData.message || 'Gagal mengirim dokumen ke RPP02N'
        }
      } else {
        lastError = `HTTP ${response.status}`
      }
    } catch (err: any) {
      lastError = err?.message || 'Connection refused'
    }
  }

  alert(`Local Print Bridge tidak terjangkau (${candidateUrls.join(', ')}). Pastikan service print-bridge (node print-bridge/server.js) berjalan di komputer kasir Anda.`)
}
