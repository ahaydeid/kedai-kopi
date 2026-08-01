/**
 * Client-side Image Compression Utility based on HTML5 Canvas API.
 * Resizes and iteratively compresses images for super lightweight uploads and optimal storage usage.
 */

export type CompressOpts = {
  maxWidth: number
  maxHeight: number
  maxSizeKB: number
  initialQuality: number
  minQuality: number
  qualityStep: number
}

export const PRODUCT_COMPRESS_PREF: CompressOpts = {
  maxWidth: 800,
  maxHeight: 800,
  maxSizeKB: 150, // Strict 150KB target for super fast loading
  initialQuality: 0.80,
  minQuality: 0.35,
  qualityStep: 0.08,
}

const COMPRESS_THRESHOLD_BYTES = 150 * 1024 // 150KB

function getTargetSize(srcW: number, srcH: number, maxW: number, maxH: number) {
  let w = srcW
  let h = srcH
  if (w > maxW || h > maxH) {
    const ratio = Math.min(maxW / w, maxH / h)
    w = Math.floor(w * ratio)
    h = Math.floor(h * ratio)
  }
  return { width: w, height: h }
}

function blobFromCanvas(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas.toBlob failed'))),
      'image/jpeg',
      quality
    )
  })
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image file'))
    }
    img.src = url
  })
}

/**
 * Compresses an image File down to target dimensions and file size.
 * Returns a new compressed File object.
 */
export async function compressImage(
  file: File,
  options: Partial<CompressOpts> = {}
): Promise<File> {
  const prefs = { ...PRODUCT_COMPRESS_PREF, ...options }
  const startSizeKB = Math.round(file.size / 1024)

  // If file is already smaller than threshold and is JPEG, skip compression
  if (file.size <= COMPRESS_THRESHOLD_BYTES && file.type === 'image/jpeg') {
    return file
  }

  try {
    const img = await loadImageFromFile(file)
    const { width, height } = getTargetSize(
      img.naturalWidth || img.width,
      img.naturalHeight || img.height,
      prefs.maxWidth,
      prefs.maxHeight
    )

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    let quality = prefs.initialQuality
    let resultBlob = await blobFromCanvas(canvas, quality)
    let currentKB = Math.round(resultBlob.size / 1024)

    while (currentKB > prefs.maxSizeKB && quality > prefs.minQuality) {
      quality -= prefs.qualityStep
      resultBlob = await blobFromCanvas(canvas, quality)
      currentKB = Math.round(resultBlob.size / 1024)
    }

    const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
    const compressedFile = new File([resultBlob], compressedFileName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })

    console.log(
      `[ImageCompression] ${file.name} compressed: ${startSizeKB}KB -> ${currentKB}KB (${width}x${height}px, q:${quality.toFixed(2)})`
    )

    return compressedFile
  } catch (err) {
    console.error('[ImageCompression] Error during compression:', err)
    return file
  }
}
