export const hexToBytes = (hex: string): Uint8Array => {
  let normalized = hex.trim()
  if (normalized.length % 2 === 1) normalized = "0" + normalized
  const out = new Uint8Array(normalized.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(normalized.substr(i * 2, 2), 16)
  }
  return out
}

export const bytesToHex = (bytes: Uint8Array): string => {
  let s = ""
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0")
  }
  return s.toUpperCase()
}

export const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export const base64UrlToBytes = (b64: string): Uint8Array => {
  const norm = b64.replace(/-/g, "+").replace(/_/g, "/")
  const pad = norm.length % 4 === 0 ? "" : "=".repeat(4 - (norm.length % 4))
  const binary = atob(norm + pad)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export const base64ToBytes = (b64: string): Uint8Array => {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

export const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s)

export const concatBytes = (...arrs: Uint8Array[]): Uint8Array => {
  const total = arrs.reduce((sum, a) => sum + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrs) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

export const randomBytes = (n: number): Uint8Array => {
  const out = new Uint8Array(n)
  crypto.getRandomValues(out)
  return out
}

// Convert a hex string representing a non-negative integer to base64url-encoded
// big-endian bytes with leading zeroes stripped.
export const hexIntToBase64UrlMinimal = (hex: string): string => {
  let h = hex.trim().toLowerCase().replace(/^0x/, "")
  if (h.length % 2 === 1) h = "0" + h
  let bytes = hexToBytes(h)
  let start = 0
  while (start < bytes.length - 1 && bytes[start] === 0) start++
  bytes = bytes.slice(start)
  return bytesToBase64Url(bytes)
}
