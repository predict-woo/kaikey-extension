// LEA-128 block cipher (CBC) port of reference auth CLI.

const DELTA = new Uint32Array([
  0xc3efe9db, 0x44626b02, 0x79e27c8a, 0x78df30ec,
  0x715ea49e, 0xc785da0a, 0xe04ef22a, 0xe5c40957
])

const u32 = (n: number) => n >>> 0

const rotl = (value: number, bits: number) => {
  bits &= 31
  return u32((value << bits) | (value >>> (32 - bits)))
}

const rotr = (value: number, bits: number) => {
  bits &= 31
  return u32((value >>> bits) | (value << (32 - bits)))
}

const wordsLE = (data: Uint8Array): number[] => {
  const out: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    out.push(
      u32(
        (data[i]) |
          (data[i + 1] << 8) |
          (data[i + 2] << 16) |
          (data[i + 3] << 24)
      )
    )
  }
  return out
}

const wordsToBytesLE = (words: number[]): Uint8Array => {
  const out = new Uint8Array(words.length * 4)
  for (let i = 0; i < words.length; i++) {
    const w = u32(words[i])
    out[i * 4] = w & 0xff
    out[i * 4 + 1] = (w >>> 8) & 0xff
    out[i * 4 + 2] = (w >>> 16) & 0xff
    out[i * 4 + 3] = (w >>> 24) & 0xff
  }
  return out
}

export class LEA128 {
  private roundKeys: number[][]

  constructor(key: Uint8Array) {
    if (key.length !== 16) throw new Error("LEA128 requires a 16-byte key.")
    this.roundKeys = LEA128.keySchedule(key)
  }

  private static keySchedule(key: Uint8Array): number[][] {
    const t = wordsLE(key)
    const roundKeys: number[][] = []
    for (let i = 0; i < 24; i++) {
      const delta = rotl(DELTA[i & 3], i)
      t[0] = rotl(u32(rotl(delta, 0) + t[0]), 1)
      t[1] = rotl(u32(rotl(delta, 1) + t[1]), 3)
      t[2] = rotl(u32(rotl(delta, 2) + t[2]), 6)
      t[3] = rotl(u32(rotl(delta, 3) + t[3]), 11)
      roundKeys.push([t[0], t[1], t[2], t[1], t[3], t[1]])
    }
    return roundKeys
  }

  encryptBlock(block: Uint8Array): Uint8Array {
    const x = wordsLE(block)
    for (let i = 0; i < 24; i += 4) {
      let rk = this.roundKeys[i]
      x[3] = rotr(u32((x[2] ^ rk[4]) + (rk[5] ^ x[3])), 3)
      x[2] = rotr(u32((x[1] ^ rk[2]) + (rk[3] ^ x[2])), 5)
      x[1] = rotl(u32((x[0] ^ rk[0]) + (rk[1] ^ x[1])), 9)

      rk = this.roundKeys[i + 1]
      x[0] = rotr(u32((x[3] ^ rk[4]) + (x[0] ^ rk[5])), 3)
      x[3] = rotr(u32((x[2] ^ rk[2]) + (x[3] ^ rk[3])), 5)
      x[2] = rotl(u32((x[1] ^ rk[0]) + (rk[1] ^ x[2])), 9)

      rk = this.roundKeys[i + 2]
      x[1] = rotr(u32((x[0] ^ rk[4]) + (x[1] ^ rk[5])), 3)
      x[0] = rotr(u32((x[3] ^ rk[2]) + (x[0] ^ rk[3])), 5)
      x[3] = rotl(u32((x[2] ^ rk[0]) + (rk[1] ^ x[3])), 9)

      rk = this.roundKeys[i + 3]
      x[2] = rotr(u32((x[1] ^ rk[4]) + (x[2] ^ rk[5])), 3)
      x[1] = rotr(u32((x[0] ^ rk[2]) + (x[1] ^ rk[3])), 5)
      x[0] = rotl(u32((x[3] ^ rk[0]) + (rk[1] ^ x[0])), 9)
    }
    return wordsToBytesLE(x)
  }
}

export function leaCbcEncrypt(
  data: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array
): Uint8Array {
  if (key.length !== 16) throw new Error("LEA-128 key must be 16 bytes.")
  if (iv.length !== 16) throw new Error("LEA-CBC IV must be 16 bytes.")
  const cipher = new LEA128(key)
  let previous = iv
  const out = new Uint8Array(data.length)
  for (let offset = 0; offset < data.length; offset += 16) {
    const block = new Uint8Array(16)
    for (let i = 0; i < 16; i++) {
      block[i] = data[offset + i] ^ previous[i]
    }
    const encrypted = cipher.encryptBlock(block)
    out.set(encrypted, offset)
    previous = encrypted
  }
  return out
}
