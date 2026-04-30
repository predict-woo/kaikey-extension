import {
  base64UrlToBytes,
  bytesToBase64Url,
  bytesToHex,
  hexIntToBase64UrlMinimal,
  hexToBytes
} from "./encoding"

// EC P-256 keypair generation. Returns hex strings of (private_value, x||y).
// Matches reference auth CLI.generate_ec_keypair.
export async function generateEcKeypair(): Promise<{
  privateHex: string
  publicHex: string
}> {
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign"]
  )
  const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey)
  const d = base64UrlToBytes(jwk.d!)
  const x = base64UrlToBytes(jwk.x!)
  const y = base64UrlToBytes(jwk.y!)
  const padTo32 = (b: Uint8Array): Uint8Array => {
    if (b.length === 32) return b
    if (b.length > 32) return b.slice(b.length - 32)
    const out = new Uint8Array(32)
    out.set(b, 32 - b.length)
    return out
  }
  const dPad = padTo32(d)
  const xPad = padTo32(x)
  const yPad = padTo32(y)
  const pub = new Uint8Array(64)
  pub.set(xPad, 0)
  pub.set(yPad, 32)
  return { privateHex: bytesToHex(dPad), publicHex: bytesToHex(pub) }
}

// ECDSA P-256 SHA-256 signature in P1363 raw form (r||s) over `data`.
export async function signP1363Hex(
  privateHex: string,
  data: Uint8Array
): Promise<string> {
  const dBytes = hexToBytes(privateHex)
  if (dBytes.length !== 32) throw new Error("EC private key must be 32 bytes.")

  // We need a JWK with x and y too. Recompute from the private scalar by
  // generating a fresh key and replacing d won't work; derive x,y via subtle
  // from a temporary import + sign trick is not possible. Instead compute the
  // public point manually using BigInt-based scalar multiplication.
  const { x, y } = scalarMultBaseP256(BigInt("0x" + privateHex))

  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: bytesToBase64Url(dBytes),
    x: bytesToBase64Url(bigintTo32Bytes(x)),
    y: bytesToBase64Url(bigintTo32Bytes(y)),
    ext: true
  }
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  )
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    data
  )
  // WebCrypto already returns raw P1363 (r||s).
  return bytesToHex(new Uint8Array(sig))
}

// RSA-OAEP-SHA256 encrypt with the server public key in `exponent^modulus` or
// `exponent:modulus` hex format. Matches reference auth CLI.parse_rsa_public_key +
// rsa_oaep_sha256_encrypt.
export async function rsaOaepSha256Encrypt(
  data: Uint8Array,
  serverPublicKeyText: string
): Promise<Uint8Array> {
  const normalized = serverPublicKeyText.trim().replace(/\^/g, ":")
  if (!normalized.includes(":")) {
    throw new Error("Expected RSA public key in exponent^modulus hex format.")
  }
  const [first, second] = normalized.split(":", 2).map((s) => s.trim())
  const a = BigInt("0x" + first)
  const b = BigInt("0x" + second)
  const bitLen = (n: bigint): number => n.toString(2).length
  let exponentHex: string, modulusHex: string
  if (bitLen(a) <= 32) {
    exponentHex = first
    modulusHex = second
  } else if (bitLen(b) <= 32) {
    exponentHex = second
    modulusHex = first
  } else {
    exponentHex = first
    modulusHex = second
  }
  const jwk: JsonWebKey = {
    kty: "RSA",
    n: hexIntToBase64UrlMinimal(modulusHex),
    e: hexIntToBase64UrlMinimal(exponentHex),
    alg: "RSA-OAEP-256",
    ext: true
  }
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  )
  const ct = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, key, data)
  return new Uint8Array(ct)
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data))
}

// --- P-256 scalar multiplication (only base point, used to derive pubkey) ---
// NIST P-256 parameters.
const P256_P = BigInt(
  "0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff"
)
const P256_A = BigInt(
  "0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc"
)
const P256_B = BigInt(
  "0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b"
)
const P256_GX = BigInt(
  "0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296"
)
const P256_GY = BigInt(
  "0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5"
)
const P256_N = BigInt(
  "0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551"
)

const mod = (a: bigint, m: bigint): bigint => {
  const r = a % m
  return r >= 0n ? r : r + m
}

// Modular inverse via extended Euclidean algorithm.
const modInverse = (a: bigint, m: bigint): bigint => {
  let [old_r, r] = [mod(a, m), m]
  let [old_s, s] = [1n, 0n]
  while (r !== 0n) {
    const q = old_r / r
    ;[old_r, r] = [r, old_r - q * r]
    ;[old_s, s] = [s, old_s - q * s]
  }
  return mod(old_s, m)
}

type Point = { x: bigint; y: bigint } | null

const pointAdd = (P: Point, Q: Point): Point => {
  if (!P) return Q
  if (!Q) return P
  if (P.x === Q.x) {
    if (mod(P.y + Q.y, P256_P) === 0n) return null
    return pointDouble(P)
  }
  const slope = mod((Q.y - P.y) * modInverse(Q.x - P.x, P256_P), P256_P)
  const x = mod(slope * slope - P.x - Q.x, P256_P)
  const y = mod(slope * (P.x - x) - P.y, P256_P)
  return { x, y }
}

const pointDouble = (P: Point): Point => {
  if (!P) return null
  const slope = mod(
    (3n * P.x * P.x + P256_A) * modInverse(2n * P.y, P256_P),
    P256_P
  )
  const x = mod(slope * slope - 2n * P.x, P256_P)
  const y = mod(slope * (P.x - x) - P.y, P256_P)
  return { x, y }
}

const scalarMult = (k: bigint, P: Point): Point => {
  let result: Point = null
  let addend: Point = P
  while (k > 0n) {
    if (k & 1n) result = pointAdd(result, addend)
    addend = pointDouble(addend)
    k >>= 1n
  }
  return result
}

function scalarMultBaseP256(scalar: bigint): { x: bigint; y: bigint } {
  const k = mod(scalar, P256_N)
  if (k === 0n) throw new Error("EC private scalar must be nonzero.")
  const result = scalarMult(k, { x: P256_GX, y: P256_GY })
  if (!result) throw new Error("EC scalar multiplication produced point at infinity.")
  return result
}

function bigintTo32Bytes(n: bigint): Uint8Array {
  let hex = n.toString(16)
  if (hex.length % 2) hex = "0" + hex
  const bytes = hexToBytes(hex)
  if (bytes.length === 32) return bytes
  if (bytes.length > 32) return bytes.slice(bytes.length - 32)
  const out = new Uint8Array(32)
  out.set(bytes, 32 - bytes.length)
  return out
}
// Reference suppression for tree-shakers.
void P256_B
