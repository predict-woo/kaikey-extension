import { leaCbcEncrypt } from "./lea"
import {
  generateEcKeypair,
  rsaOaepSha256Encrypt,
  sha256,
  signP1363Hex
} from "./crypto"
import {
  base64ToBytes,
  bytesToHex,
  concatBytes,
  hexToBytes,
  randomBytes,
  utf8
} from "./encoding"

export type QrPayload = {
  display_nm: string
  site_id: string
  base_url: string
  id_token: string
  time: string
  authenticator: string
  version?: string
}

export type DeviceState = {
  device_id: string
  push_token: string
  device_nm: string
  os_ver: string
  sites: SiteState[]
}

export type SiteState = {
  display_nm: string
  site_id: string
  site_display: string
  base_url: string
  authenticator: string
  version: string
  id_token: string
  sln_uu_id: string
  server_pubkey: string
  ecc_private_key: string
  ecc_public_key: string
}

export type RegLookupResponse = {
  result?: boolean
  errcode?: string
  pubkey?: string
  sln_uu_id?: string
}

export type AuthCheckResponse = {
  result?: boolean
  errcode?: string
  id_token?: string
  challenge?: string
}

export class AuthProtocolError extends Error {}

export const DEFAULT_OS_VERSION = "Android 15"
export const DEFAULT_DEVICE_NAME = "Chrome Extension"

export function newDeviceState(): DeviceState {
  return {
    device_id: crypto.randomUUID(),
    push_token: "manual-ext-" + crypto.randomUUID(),
    device_nm: DEFAULT_DEVICE_NAME,
    os_ver: DEFAULT_OS_VERSION,
    sites: []
  }
}

export function parseQrJson(value: string): QrPayload {
  let payload: any
  try {
    payload = JSON.parse(value)
  } catch (e) {
    throw new AuthProtocolError(`Invalid QR JSON: ${(e as Error).message}`)
  }
  const required = [
    "display_nm",
    "site_id",
    "base_url",
    "id_token",
    "time",
    "authenticator"
  ]
  const missing = required.filter((k) => !payload?.[k])
  if (missing.length) {
    throw new AuthProtocolError(
      `QR JSON is missing required field(s): ${missing.join(", ")}`
    )
  }
  if (payload.authenticator !== "push") {
    throw new AuthProtocolError(
      "These scripts currently implement only the legacy push authenticator."
    )
  }
  if (String(payload.version || "") === "2.0") {
    throw new AuthProtocolError(
      "version=2.0 uses FIDO UAF and is not implemented by this extension."
    )
  }
  return payload as QrPayload
}

async function postJson(
  baseUrl: string,
  path: string,
  payload: unknown,
  timeoutMs: number
): Promise<any> {
  const url = baseUrl.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "")
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=UTF-8" },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    })
    if (!res.ok) {
      throw new AuthProtocolError(`HTTP ${res.status} for ${url}`)
    }
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new AuthProtocolError(`Server did not return JSON for ${url}: ${text.slice(0, 200)}`)
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function regLookup(
  qr: QrPayload,
  state: DeviceState,
  timeoutMs = 20000
): Promise<RegLookupResponse> {
  const data: RegLookupResponse = await postJson(
    qr.base_url,
    "api/app/regist/check",
    {
      device_id: state.device_id,
      id_token: qr.id_token,
      device_nm: state.device_nm,
      os_ver: state.os_ver
    },
    timeoutMs
  )
  if (!data.result) {
    throw new AuthProtocolError(
      `Registration lookup failed: ${data.errcode || JSON.stringify(data)}`
    )
  }
  if (!data.pubkey || !data.sln_uu_id) {
    throw new AuthProtocolError(
      `Registration lookup response missing pubkey or sln_uu_id: ${JSON.stringify(data)}`
    )
  }
  return data
}

export async function registerSite(
  qr: QrPayload,
  lookup: RegLookupResponse,
  state: DeviceState,
  timeoutMs = 20000
): Promise<SiteState> {
  const { privateHex, publicHex } = await generateEcKeypair()
  const sign = await signP1363Hex(
    privateHex,
    utf8(state.device_id + qr.id_token)
  )
  const payload = {
    device_id: state.device_id,
    id_token: qr.id_token,
    push_token: state.push_token,
    app_pubkey: publicHex,
    device_nm: state.device_nm,
    os_ver: state.os_ver,
    authenticator: qr.authenticator,
    sign
  }
  const encrypted = await encryptForServer(payload, lookup.pubkey!)
  const data = await postJson(qr.base_url, "api/app/regist", encrypted, timeoutMs)
  if (!data.result) {
    throw new AuthProtocolError(
      `Registration failed: ${data.errcode || JSON.stringify(data)}`
    )
  }
  return {
    display_nm: qr.display_nm,
    site_id: qr.site_id,
    site_display: qr.site_id,
    base_url: qr.base_url,
    authenticator: qr.authenticator,
    version: String(qr.version || ""),
    id_token: qr.id_token,
    sln_uu_id: lookup.sln_uu_id!,
    server_pubkey: lookup.pubkey!,
    ecc_private_key: privateHex,
    ecc_public_key: publicHex
  }
}

export function upsertSite(state: DeviceState, site: SiteState): void {
  const sites = state.sites
  for (let i = 0; i < sites.length; i++) {
    const ex = sites[i]
    if (
      ex.site_id === site.site_id &&
      ex.sln_uu_id === site.sln_uu_id &&
      ex.authenticator === site.authenticator
    ) {
      sites[i] = site
      return
    }
  }
  sites.push(site)
}

export async function authCheck(
  site: SiteState,
  state: DeviceState,
  timeoutMs = 20000
): Promise<AuthCheckResponse> {
  return await postJson(
    site.base_url,
    "api/app/auth/check",
    {
      sln_uu_id: site.sln_uu_id,
      device_id: state.device_id,
      device_nm: state.device_nm,
      os_ver: state.os_ver
    },
    timeoutMs
  )
}

export async function approveAuth(
  site: SiteState,
  state: DeviceState,
  idToken: string,
  timeoutMs = 20000
): Promise<any> {
  const sign = await signP1363Hex(
    site.ecc_private_key,
    utf8(state.device_id + idToken)
  )
  const payload = {
    device_id: state.device_id,
    id_token: idToken,
    authtype: "finger",
    device_nm: state.device_nm,
    os_ver: state.os_ver,
    sign
  }
  const encrypted = await encryptForServer(payload, site.server_pubkey)
  return await postJson(site.base_url, "api/app/auth", encrypted, timeoutMs)
}

async function encryptForServer(
  payload: unknown,
  serverPubKey: string
): Promise<{ E1: string; E2: string }> {
  const envelope = randomBytes(68)
  const leaKey = envelope.slice(0, 16)
  const iv = envelope.slice(32, 48)
  const plaintext = utf8(JSON.stringify(payload))
  const padded = protocolPad(plaintext)
  const e1 = bytesToHex(leaCbcEncrypt(padded, leaKey, iv))
  const e2 = bytesToHex(await rsaOaepSha256Encrypt(envelope, serverPubKey))
  return { E1: e1, E2: e2 }
}

function protocolPad(plaintext: Uint8Array): Uint8Array {
  const prefix = randomBytes(10)
  const padLen = 16 - ((plaintext.length + 10) % 16)
  const tail = new Uint8Array(padLen)
  tail[padLen - 1] = padLen
  return concatBytes(prefix, plaintext, tail)
}

// ----- Verification number derivation -----

export async function generateVnumber(
  challenge: string,
  version: string | undefined
): Promise<string> {
  const body = challenge.split("^")[0]
  const keyMaterial =
    version === "2.0" ? base64ToBytes(body) : legacyHexDecode(body)
  const digest = await sha256(keyMaterial)
  return dynamicTruncate(digest, 2)
}

function legacyHexDecode(value: string): Uint8Array {
  let v = value.trim()
  if (v.length % 2) v = "0" + v
  return hexToBytes(v)
}

function dynamicTruncate(digest: Uint8Array, digits: number): string {
  const offset = digest[digest.length - 1] & 0x0f
  let binary = 0
  for (let i = 0; i < 4; i++) {
    binary = (binary << 8) | (digest[offset + i] & 0xff)
  }
  const value = (binary & 0x7fffffff) % 10 ** digits
  return String(value).padStart(digits, "0")
}

export function vnumberChoices(real: string): string[] {
  const choices = new Set<string>([real])
  while (choices.size < 3) {
    const n = Math.floor(Math.random() * 100)
    choices.add(String(n).padStart(2, "0"))
  }
  const arr = Array.from(choices)
  // Fisher-Yates.
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
