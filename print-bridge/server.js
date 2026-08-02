/**
 * Local Print Bridge for RPP02N 58mm Thermal Printer
 * Supports Linux /dev/rfcomm0 Bluetooth SPP & USB
 * Full CORS & Private Network Access (PNA) support for Dev & Production Cloud Web POS
 */

const http = require('http')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PORT = process.env.PORT || 5000
const DEVICE_PATH = process.env.PRINTER_DEVICE_PATH || '/dev/rfcomm0'

// ESC/POS Commands Constants
const ESC = '\x1b'
const GS = '\x1d'

const CMD_INIT = `${ESC}@`
const CMD_ALIGN_LEFT = `${ESC}a\x00`
const CMD_ALIGN_CENTER = `${ESC}a\x01`
const CMD_ALIGN_RIGHT = `${ESC}a\x02`
const CMD_BOLD_ON = `${ESC}E\x01`
const CMD_BOLD_OFF = `${ESC}E\x00`
const CMD_FONT_NORMAL = `${ESC}!\x00`
const CMD_FONT_SMALL = `${ESC}!\x01`
const CMD_FONT_HEADER = `${ESC}!\x08`
const CMD_FEED_AND_CUT = `\n\n`

function formatRupiah(num) {
  return 'Rp ' + Math.floor(num).toLocaleString('id-ID')
}

/**
 * Formats data into RPP02N 58mm (32 characters per line) ESC/POS raw bytes.
 */
function buildEscPosBuffer(data) {
  const chunks = []

  // Initialize Printer
  chunks.push(Buffer.from(CMD_INIT, 'latin1'))

  // Header (Centered)
  chunks.push(Buffer.from(CMD_ALIGN_CENTER, 'latin1'))

  // Logo (if logo-bytes.bin exists)
  const logoBinPath = path.join(__dirname, 'logo-bytes.bin')
  if (fs.existsSync(logoBinPath)) {
    chunks.push(fs.readFileSync(logoBinPath))
    chunks.push(Buffer.from('\n', 'latin1'))
  }

  // Header Text
  chunks.push(Buffer.from(CMD_BOLD_ON + CMD_FONT_HEADER, 'latin1'))
  const headerStr = String(data.storeName || data.headerText || 'Kedai Kopi').substring(0, 32)
  chunks.push(Buffer.from(`${headerStr}\n`, 'latin1'))
  chunks.push(Buffer.from(CMD_FONT_NORMAL + CMD_BOLD_OFF, 'latin1'))
  if (data.addressText || data.storeAddress) {
    const addressStr = String(data.addressText || data.storeAddress).substring(0, 32)
    chunks.push(Buffer.from(`${addressStr}\n`, 'latin1'))
  }
  chunks.push(Buffer.from(`--------------------------------\n`, 'latin1'))

  // Metadata
  chunks.push(Buffer.from(CMD_ALIGN_LEFT, 'latin1'))
  const nowStr = data.dateTime || new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  const orderNumStr = String(data.orderNumber || '').replace(/^#\s*/, '').trim()
  const displayOrderNum = orderNumStr.startsWith('ORD-') ? orderNumStr : `ORD-${orderNumStr}`
  chunks.push(Buffer.from(`Tgl : ${nowStr}\n`, 'latin1'))
  chunks.push(Buffer.from(`ID  : ${displayOrderNum}\n`, 'latin1'))
  if (data.customerName) chunks.push(Buffer.from(`Nama: ${data.customerName}\n`, 'latin1'))

  const rawType = String(data.orderType || '').toLowerCase()
  const rawTable = String(data.tableNumber || '').trim()
  const isTakeaway = rawType === 'takeaway' || rawTable.toLowerCase() === 'takeaway' || !rawTable

  if (isTakeaway) {
    chunks.push(Buffer.from(`Tipe: Take Away\n`, 'latin1'))
  } else {
    const cleanTable = rawTable.replace(/^Meja\s*#?/i, '').trim()
    chunks.push(Buffer.from(`Meja: Meja #${cleanTable}\n`, 'latin1'))
  }
  chunks.push(Buffer.from(`--------------------------------\n`, 'latin1'))

  // Items List
  if (Array.isArray(data.items)) {
    data.items.forEach((item) => {
      const qtyStr = item.quantity > 1 ? `${item.quantity}x ` : ''
      const itemTitle = `${qtyStr}${item.name}`
      const priceVal = item.price * (item.quantity > 1 ? item.quantity : 1)
      const priceStr = formatRupiah(priceVal)

      let itemLine = ''
      if (itemTitle.length + priceStr.length + 1 <= 32) {
        const spaces = ' '.repeat(32 - itemTitle.length - priceStr.length)
        itemLine = `${itemTitle}${spaces}${priceStr}\n`
      } else {
        const spaces = ' '.repeat(Math.max(0, 32 - priceStr.length))
        itemLine = `${itemTitle}\n${spaces}${priceStr}\n`
      }
      chunks.push(Buffer.from(itemLine, 'latin1'))
    })
  }

  chunks.push(Buffer.from(`--------------------------------\n`, 'latin1'))

  let itemsSubtotal = 0
  if (Array.isArray(data.items)) {
    itemsSubtotal = data.items.reduce((acc, item) => acc + item.price * (item.quantity > 1 ? item.quantity : 1), 0)
  }

  const explicitDiscount = Number(data.discountAmount || data.claimedPoints || data.discount || 0)
  const autoDiscount = itemsSubtotal > (data.totalAmount || 0) ? itemsSubtotal - (data.totalAmount || 0) : 0
  const discountVal = explicitDiscount > 0 ? explicitDiscount : autoDiscount

  if (discountVal > 0) {
    const subtotal = itemsSubtotal > 0 ? itemsSubtotal : (data.totalAmount || 0) + discountVal
    const subLabel = 'Subtotal'
    const subStr = formatRupiah(subtotal)
    const subSpaces = ' '.repeat(Math.max(0, 32 - subLabel.length - subStr.length))
    chunks.push(Buffer.from(`${subLabel}${subSpaces}${subStr}\n`, 'latin1'))

    const discLabel = 'Diskon'
    const discStr = `-${formatRupiah(discountVal)}`
    const discSpaces = ' '.repeat(Math.max(0, 32 - discLabel.length - discStr.length))
    chunks.push(Buffer.from(`${discLabel}${discSpaces}${discStr}\n`, 'latin1'))
  }

  // Total
  chunks.push(Buffer.from(CMD_BOLD_ON, 'latin1'))
  const totalLabel = 'TOTAL'
  const totalValStr = formatRupiah(data.totalAmount || 0)
  const totalSpaces = ' '.repeat(Math.max(0, 32 - totalLabel.length - totalValStr.length))
  chunks.push(Buffer.from(`${totalLabel}${totalSpaces}${totalValStr}\n`, 'latin1'))
  chunks.push(Buffer.from(CMD_BOLD_OFF, 'latin1'))

  if (data.paymentMethod) {
    chunks.push(Buffer.from(`Bayar: ${data.paymentMethod}\n`, 'latin1'))
  }

  chunks.push(Buffer.from(`--------------------------------\n`, 'latin1'))

  // Footer
  chunks.push(Buffer.from(CMD_ALIGN_CENTER, 'latin1'))
  const footerStr = String(data.footerText || 'Terima kasih atas kunjungan Anda!').substring(0, 32)
  chunks.push(Buffer.from(`${footerStr}\n`, 'latin1'))

  // Feed & Cut
  chunks.push(Buffer.from(CMD_FEED_AND_CUT, 'latin1'))

  return Buffer.concat(chunks)
}

function isBluetoothPrinterHardwareReady() {
  if (!fs.existsSync(DEVICE_PATH)) {
    return false
  }

  // 1. Check Linux OS Bluetooth Radio Power State (rfkill)
  try {
    const rfkill = execSync('rfkill list bluetooth 2>&1', { encoding: 'utf8', timeout: 1000 })
    if (rfkill.includes('Soft blocked: yes') || rfkill.includes('Hard blocked: yes')) {
      return false
    }
  } catch {}

  // 2. Check active Bluetooth HCI adapter availability
  try {
    const hcitool = execSync('hcitool dev 2>&1', { encoding: 'utf8', timeout: 1000 })
    if (!hcitool.includes('hci')) {
      return false
    }
  } catch {}

  // 3. Check RFCOMM binding existence
  try {
    const rfcomm = execSync('rfcomm -a 2>&1', { encoding: 'utf8', timeout: 1000 })
    if (!rfcomm.includes('rfcomm0')) {
      return false
    }
  } catch {}

  return true
}

// Create HTTP Server with CORS & Private Network Access (PNA) Headers
const server = http.createServer((req, res) => {
  const remoteIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown'
  console.log(`[${new Date().toLocaleTimeString('id-ID')}] Incoming ${req.method} ${req.url} from ${remoteIp}`)

  // CORS & PNA Headers for Cloud HTTPS -> Localhost HTTP calls
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Private-Network': 'true',
    })
    res.end()
    return
  }

  const url = req.url || '/'

  // Status check endpoint
  if (req.method === 'GET' && (url === '/api/status' || url === '/status')) {
    const isReady = isBluetoothPrinterHardwareReady()
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'online',
        device: DEVICE_PATH,
        ready: isReady,
        connected: isReady,
        printer: 'RPP02N Thermal Printer 58mm',
      })
    )
    return
  }

  // Print endpoint
  if (req.method === 'POST' && (url === '/api/print' || url === '/print')) {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}')
        const copies = Math.max(1, parseInt(payload.copies || payload.printCopies || 1, 10))
        const singleBuffer = buildEscPosBuffer(payload)

        let escPosBuffer = singleBuffer
        if (copies > 1) {
          const buffers = []
          for (let i = 0; i < copies; i++) {
            buffers.push(singleBuffer)
          }
          escPosBuffer = Buffer.concat(buffers)
        }

        // Write directly to /dev/rfcomm0 or serial/usb device
        fs.writeFile(DEVICE_PATH, escPosBuffer, (err) => {
          if (err) {
            console.error('[Print Bridge Error Writing to Device]:', err)
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(
              JSON.stringify({
                success: false,
                error: `Gagal mengirim ke ${DEVICE_PATH}: ${err.message}`,
              })
            )
            return
          }

          console.log(`[Print Bridge Success] Printed order ${payload.orderNumber || ''} to ${DEVICE_PATH}`)
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              success: true,
              message: 'Berhasil dicetak ke RPP02N',
              device: DEVICE_PATH,
            })
          )
        })
      } catch (err) {
        console.error('[Print Bridge Payload Error]:', err)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(
          JSON.stringify({
            success: false,
            error: 'Payload JSON tidak valid.',
          })
        )
      }
    })
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Endpoint tidak ditemukan' }))
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`)
  console.log(`[Kedai Kopi] Local Print Bridge Running!`)
  console.log(`URL    : http://127.0.0.1:${PORT}`)
  console.log(`Device : ${DEVICE_PATH}`)
  console.log(`Status : READY for RPP02N 58mm Direct Printing`)
  console.log(`====================================================`)
})
