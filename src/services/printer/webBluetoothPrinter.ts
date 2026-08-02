// Real WebBluetooth & WebUSB ESC/POS Printer Service for 58mm / 80mm Thermal Printers

export interface BluetoothDeviceRef {
  name: string
  id: string
  deviceObj: any
  characteristic?: any
}

let activeBluetoothDevice: BluetoothDeviceRef | null = null

export function getActiveBluetoothDevice(): BluetoothDeviceRef | null {
  return activeBluetoothDevice
}

export function isWebBluetoothSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'bluetooth' in navigator
}

export function isWebUSBSupported(): boolean {
  if (typeof window === 'undefined') return false
  return 'usb' in navigator
}

/**
  * Requests a real Bluetooth device using Chrome's native browser Bluetooth device picker popup.
  */
export async function scanAndConnectBluetoothDevice(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  const nav = typeof window !== 'undefined' ? (navigator as any) : null
  const bluetooth = nav?.bluetooth

  if (!bluetooth) {
    return {
      success: false,
      error: 'Browser Chromium ini membatasi WebBluetooth API. Buka chrome://flags/#enable-web-bluetooth untuk mengaktifkan Bluetooth browser, atau gunakan koneksi USB / Driver OS.',
    }
  }

  try {
    const device = await bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '0000e7e0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '00001101-0000-1000-8000-00805f9b34fb',
      ],
    })

    if (!device) {
      return { success: false, error: 'Pencarian perangkat dibatalkan.' }
    }

    const deviceName = device.name || 'Bluetooth Thermal Printer'

    // Connect to GATT Server
    let characteristic: any = null
    try {
      if (device.gatt) {
        const server = await device.gatt.connect()
        const services = await server.getPrimaryServices()
        for (const service of services) {
          const characteristics = await service.getCharacteristics()
          for (const char of characteristics) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              characteristic = char
              break
            }
          }
          if (characteristic) break
        }
      }
    } catch (e) {
      console.warn('[WebBluetooth] GATT GATT Connection warning (Will fallback to Direct Print if needed):', e)
    }

    activeBluetoothDevice = {
      name: deviceName,
      id: device.id,
      deviceObj: device,
      characteristic,
    }

    return {
      success: true,
      deviceName,
    }
  } catch (err: any) {
    console.error('[WebBluetooth Error]:', err)
    if (err?.name === 'NotFoundError') {
      return { success: false, error: 'Pencarian perangkat Bluetooth dibatalkan oleh pengguna.' }
    }
    return { success: false, error: err?.message || 'Gagal terhubung dengan perangkat Bluetooth.' }
  }
}

/**
  * Requests a real USB device using WebUSB API picker popup.
  */
export async function scanAndConnectUSBDevice(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  if (!isWebUSBSupported()) {
    return {
      success: false,
      error: 'WebUSB API tidak didukung di browser ini. Gunakan driver printer OS bawaan.',
    }
  }

  try {
    const usb = (navigator as any).usb
    const device = await usb.requestDevice({ filters: [] })
    const deviceName = device.productName || 'USB Thermal Printer'

    return {
      success: true,
      deviceName,
    }
  } catch (err: any) {
    if (err?.name === 'NotFoundError') {
      return { success: false, error: 'Pencarian perangkat USB dibatalkan oleh pengguna.' }
    }
    return { success: false, error: err?.message || 'Gagal terhubung dengan printer USB.' }
  }
}

export function disconnectBluetoothDevice() {
  if (activeBluetoothDevice?.deviceObj?.gatt?.connected) {
    try {
      activeBluetoothDevice.deviceObj.gatt.disconnect()
    } catch {}
  }
  activeBluetoothDevice = null
}
