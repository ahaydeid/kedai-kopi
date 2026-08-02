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

export async function printThermalReceipt(data: ReceiptData) {
  if (typeof window === 'undefined') return

  const settings = getPrinterSettings()
  const bridgeUrl = settings.bridgeUrl || process.env.NEXT_PUBLIC_PRINT_BRIDGE_URL || 'http://127.0.0.1:5000'

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
          .text-center { text-align: center; }
          .header-title { font-size: 14px; font-weight: bold; }
          .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-bottom: 2px solid #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; }
          .bold { font-weight: bold; }
          letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="text-center header-title uppercase">${settings.headerText}</div>
        ${settings.addressText ? `<div class="text-center" style="font-size: 9px; margin-top: 2px;">${settings.addressText}</div>` : ''}
        
        <div class="divider"></div>

        <div class="row"><span>Tgl :</span><span>${nowStr}</span></div>
        <div class="row"><span>ID  :</span><span class="bold">${String(data.orderNumber || '').replace(/^#\s*/, '').startsWith('ORD-') ? String(data.orderNumber || '').replace(/^#\s*/, '') : `ORD-${String(data.orderNumber || '').replace(/^#\s*/, '')}`}</span></div>
        ${data.customerName ? `<div class="row"><span>Nama:</span><span>${data.customerName}</span></div>` : ''}
        ${
          String(data.orderType || '').toLowerCase() === 'takeaway' || String(data.tableNumber || '').toLowerCase() === 'takeaway' || !data.tableNumber
            ? `<div class="row"><span>Tipe:</span><span>Take Away</span></div>`
            : `<div class="row"><span>Meja:</span><span>Meja #${String(data.tableNumber).replace(/^Meja\s*#?/i, '').trim()}</span></div>`
        }

        <div class="divider"></div>

        <div>
          ${itemsHtml}
        </div>

        ${
          effectiveDiscount > 0
            ? `
            <div class="row"><span>Subtotal:</span><span>${formatRupiah(itemsSum > 0 ? itemsSum : data.totalAmount + effectiveDiscount)}</span></div>
            <div class="row"><span>Diskon:</span><span>-${formatRupiah(effectiveDiscount)}</span></div>
            `
            : ''
        }
        <div class="row bold" style="font-size: 12px; margin-top: 2px;">
          <span>TOTAL</span>
          <span>${formatRupiah(data.totalAmount)}</span>
        </div>

        ${data.paymentMethod ? `<div class="row" style="font-size: 10px; margin-top: 2px;"><span>Bayar:</span><span>${data.paymentMethod}</span></div>` : ''}

        <div class="double-divider"></div>

        <div class="text-center" style="font-size: 9px; margin-top: 4px;">${settings.footerText}</div>
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

  if (settings.connectionType === 'browser') {
    executeIframeBrowserPrint()
    return
  }

  // Connection type is 'bluetooth' (Default Direct ESC/POS Printing to /dev/rfcomm0)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${bridgeUrl}/api/print`, {
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
        console.log('[Direct Print Success]: Receipt printed via Local Print Bridge to RPP02N')
        return
      } else {
        alert(`[Local Print Bridge Error]: ${resData.error || resData.message || 'Gagal mengirim dokumen ke printer RPP02N'}`)
        return
      }
    } else {
      alert(`[Local Print Bridge Error]: Server merespons HTTP ${response.status}`)
      return
    }
  } catch (err) {
    console.error('[Print Bridge Error]: Local Print Bridge tidak dapat dijangkau di ' + bridgeUrl, err)
    alert(`Local Print Bridge tidak terjangkau di ${bridgeUrl}. Pastikan service print-bridge (node print-bridge/server.js) berjalan di komputer kasir Anda.`)
    return
  }
}
