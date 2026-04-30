import jsQR from "jsqr"

export async function decodeQrFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const { data, width, height } = drawToImageData(img)
    const result = jsQR(data, width, height)
    if (!result) throw new Error("Could not detect a QR code in the image.")
    return result.data
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to load image."))
    img.src = url
  })
}

function drawToImageData(img: HTMLImageElement): ImageData {
  const maxSide = 1500
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get 2D canvas context.")
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}
