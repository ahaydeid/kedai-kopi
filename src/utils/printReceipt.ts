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
  paymentMethod?: string
}

export function getPrinterSettings() {
  const DEFAULT_SETTINGS = {
    connectionType: 'bluetooth',
    paperWidth: '58mm',
    autoPrint: true,
    printCopies: 1,
    headerText: 'Kedai Kopi',
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

export function printThermalReceipt(data: ReceiptData) {
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
            line-height: 1.2;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 8px 6px;
            width: ${paperWidth};
            max-width: ${maxWidthPx};
            box-sizing: border-box;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .uppercase { text-transform: uppercase; }
          .divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .double-divider {
            border-top: 2px dashed #000;
            margin: 6px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
          }
          .header-title {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.5px;
          }
        </style>
      </head>
      <body>
        <div class="text-center header-title uppercase">${settings.headerText}</div>
        <div class="text-center" style="font-size: 9px; margin-top: 2px;">Balaraja, Tangerang</div>
        
        <div class="divider"></div>

        <div class="row"><span>Tgl :</span><span>${nowStr}</span></div>
        <div class="row"><span>No  :</span><span class="bold">${data.orderNumber}</span></div>
        ${data.customerName ? `<div class="row"><span>Nama:</span><span>${data.customerName}</span></div>` : ''}
        ${data.tableNumber ? `<div class="row"><span>Meja:</span><span>${data.tableNumber}</span></div>` : ''}
        ${data.orderType ? `<div class="row"><span>Tipe:</span><span>${data.orderType === 'takeaway' ? 'Take Away' : 'Dine In'}</span></div>` : ''}

        <div class="divider"></div>

        <div>
          ${itemsHtml}
        </div>

        <div class="divider"></div>

        <div class="row bold" style="font-size: 12px; margin-top: 2px;">
          <span>TOTAL</span>
          <span>${formatRupiah(data.totalAmount)}</span>
        </div>

        ${data.paymentMethod ? `<div class="row" style="font-size: 10px; margin-top: 2px;"><span>Bayar:</span><span>${data.paymentMethod}</span></div>` : ''}

        <div class="double-divider"></div>

        <div class="text-center" style="font-size: 9px; margin-top: 4px;">${settings.footerText}</div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `

  const printWindow = window.open('', '_blank', 'width=380,height=600')
  if (printWindow) {
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
  } else {
    // Fallback iframe print if popup is blocked
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.write(receiptHtml)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 250)
    }
  }
}
