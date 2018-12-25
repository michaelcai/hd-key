import crypto from 'crypto'

const LEN = 78

export const hash160 = (buf: Buffer): Buffer => {
  const sha = crypto
    .createHash('sha256')
    .update(buf)
    .digest()
  return crypto
    .createHash('rmd160')
    .update(sha)
    .digest()
}

export const serialize = (
  version: number,
  key: Buffer,
  depth: number,
  index: number,
  parentFingerprint: number,
  chainCode: Buffer
) => {
  // => version(4) || depth(1) || fingerprint(4) || index(4) || chain(32) || key(33)

  const buffer = Buffer.allocUnsafe(LEN)

  buffer.writeUInt32BE(version, 0)
  buffer.writeUInt8(depth, 4)

  const fingerprint = depth ? parentFingerprint : 0x00000000

  buffer.writeUInt32BE(fingerprint, 5)
  buffer.writeUInt32BE(index, 9)

  chainCode.copy(buffer, 13)
  key.copy(buffer, 45)

  return buffer
}
