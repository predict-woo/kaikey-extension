// Passphrase-encrypted serialization of the device state, for transferring
// the same registration to another Kaikey instance (desktop ↔ mobile, etc.).
//
// Format: base64url(
//   version (1B) || salt (16B) || iv (12B) || AES-GCM ciphertext+tag
// )
// Key derivation: PBKDF2-SHA256, 250k iterations, 256-bit AES key.

const VERSION = 1
const PBKDF2_ITERATIONS = 250_000
const SALT_BYTES = 16
const IV_BYTES = 12
const GCM_TAG_BYTES = 16

async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

export async function encryptState(
  state: unknown,
  passphrase: string
): Promise<string> {
  if (!passphrase) throw new Error("Passphrase is required.")
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
  const key = await deriveKey(passphrase, salt)
  const plaintext = new TextEncoder().encode(JSON.stringify(state))
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  )
  const out = new Uint8Array(1 + SALT_BYTES + IV_BYTES + ct.length)
  out[0] = VERSION
  out.set(salt, 1)
  out.set(iv, 1 + SALT_BYTES)
  out.set(ct, 1 + SALT_BYTES + IV_BYTES)
  return base64UrlEncode(out)
}

export async function decryptState<T = unknown>(
  encoded: string,
  passphrase: string
): Promise<T> {
  if (!passphrase) throw new Error("Passphrase is required.")
  const bytes = base64UrlDecode(encoded.trim())
  if (bytes.length < 1 + SALT_BYTES + IV_BYTES + GCM_TAG_BYTES) {
    throw new Error("Share blob is too short or malformed.")
  }
  if (bytes[0] !== VERSION) {
    throw new Error(`Unsupported share format version: ${bytes[0]}.`)
  }
  const salt = bytes.slice(1, 1 + SALT_BYTES)
  const iv = bytes.slice(1 + SALT_BYTES, 1 + SALT_BYTES + IV_BYTES)
  const ct = bytes.slice(1 + SALT_BYTES + IV_BYTES)
  const key = await deriveKey(passphrase, salt)
  let pt: ArrayBuffer
  try {
    pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
  } catch {
    throw new Error("Incorrect passphrase or corrupted share blob.")
  }
  try {
    return JSON.parse(new TextDecoder().decode(pt)) as T
  } catch {
    throw new Error("Decrypted payload is not valid JSON.")
  }
}

function base64UrlEncode(bytes: Uint8Array): string {
  let s = ""
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(s: string): Uint8Array {
  let padded = s.replace(/-/g, "+").replace(/_/g, "/")
  while (padded.length % 4) padded += "="
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
