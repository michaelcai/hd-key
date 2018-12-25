import assert from 'assert'
import cs from 'coinstring'
import crypto from 'crypto'
import secp256k1 from 'secp256k1'

import { hash160, serialize } from './utils'

const DEFAULT_VERSIONS: Versions = { private: 0x0488ade4, public: 0x0488b21e }
const DEFAULT_MASTER_SECRET = Buffer.from('Bitcoin seed', 'utf8')

class HDKey {
  public static HARDENED_OFFSET = 0x80000000

  public static fromMasterSeed(
    seed: Buffer,
    masterSecret?: string,
    versions = DEFAULT_VERSIONS
  ): HDKey {
    const secret = masterSecret
      ? Buffer.from(masterSecret, 'utf8')
      : DEFAULT_MASTER_SECRET

    const I = crypto
      .createHmac('sha512', secret)
      .update(seed)
      .digest()
    const IL = I.slice(0, 32)
    const IR = I.slice(32)

    const hdkey = new HDKey(versions)
    hdkey.chainCode = IR
    hdkey.privateKey = IL

    return hdkey
  }

  public static fromExtendedKey(
    base58Key: string,
    versions = DEFAULT_VERSIONS
  ): HDKey {
    // => version(4) || depth(1) || fingerprint(4) || index(4) || chain(32) || key(33)
    const hdkey = new HDKey(versions)

    const keyBuffer = cs.decode(base58Key)

    const version = keyBuffer.readUInt32BE(0)
    assert(
      version === versions.private || version === versions.public,
      'Version mismatch: does not match private or public'
    )

    hdkey._depth = keyBuffer.readUInt8(4)
    hdkey._parentFingerprint = keyBuffer.readUInt32BE(5)
    hdkey._index = keyBuffer.readUInt32BE(9)
    hdkey._chainCode = keyBuffer.slice(13, 45)

    const key = keyBuffer.slice(45)
    if (key.readUInt8(0) === 0) {
      // private
      assert(
        version === versions.private,
        'Version mismatch: version does not match private'
      )
      hdkey.privateKey = key.slice(1) // cut off first 0x0 byte
    } else {
      assert(
        version === versions.public,
        'Version mismatch: version does not match public'
      )
      hdkey.publicKey = key
    }

    return hdkey
  }

  public static fromJSON(obj: HDKeyJSON): HDKey {
    return HDKey.fromExtendedKey(obj.xpriv)
  }

  private _versions: Versions
  private _depth: number
  private _index: number
  private _privateKey: Buffer
  private _publicKey: Buffer
  private _chainCode: Buffer
  private _fingerprint: number
  private _parentFingerprint: number
  private _identifier: Buffer

  constructor(versions = DEFAULT_VERSIONS) {
    this._versions = versions
    this._depth = 0
    this._index = 0
    this._privateKey = null
    this._publicKey = null
    this._chainCode = null
    this._fingerprint = 0
    this._parentFingerprint = 0
  }

  get versions(): Versions {
    return this._versions
  }

  get depth(): number {
    return this._depth
  }

  get index(): number {
    return this._index
  }

  get parentFingerprint(): number {
    return this._parentFingerprint
  }

  get fingerprint(): number {
    return this._fingerprint
  }

  get identifier(): Buffer {
    return this._identifier
  }

  get pubKeyHash(): Buffer {
    return this._identifier
  }

  get privateKey(): Buffer {
    return this._privateKey
  }

  set privateKey(key: Buffer) {
    assert.equal(key.length, 32, 'Private key must be 32 bytes.')
    assert(secp256k1.privateKeyVerify(key) === true, 'Invalid private key')

    this._privateKey = key
    this._publicKey = secp256k1.publicKeyCreate(key, true)
    this._identifier = hash160(this._publicKey)
    this._fingerprint = this._identifier.slice(0, 4).readUInt32BE(0)
  }

  get publicKey(): Buffer {
    return this._publicKey
  }

  set publicKey(key: Buffer) {
    assert(
      key.length === 33 || key.length === 65,
      'Public key must be 33 or 65 bytes.'
    )
    assert(secp256k1.publicKeyVerify(key) === true, 'Invalid public key')

    this._publicKey = secp256k1.publicKeyConvert(key, true) // force compressed point
    this._identifier = hash160(this.publicKey)
    this._fingerprint = this._identifier.slice(0, 4).readUInt32BE(0)
    this._privateKey = null
  }

  get chainCode(): Buffer {
    return this._chainCode
  }

  set chainCode(code: Buffer) {
    this._chainCode = code
  }

  get privateExtendedKey(): string {
    if (this._privateKey) {
      return cs.encode(
        serialize(
          this._versions.private,
          Buffer.concat([Buffer.alloc(1, 0), this._privateKey]),
          this._depth,
          this._index,
          this._parentFingerprint,
          this._chainCode
        )
      )
    }
    return null
  }

  get publicExtendedKey(): string {
    return cs.encode(
      serialize(
        this._versions.public,
        this._publicKey,
        this._depth,
        this._index,
        this._parentFingerprint,
        this._chainCode
      )
    )
  }

  public derive(path: string): HDKey {
    if (path.toLowerCase() === 'm' || path.toLowerCase() === "m'") {
      return this
    }

    path.split('/').forEach((c, index) => {
      if (index === 0) {
        assert(/^[mM]{1}/.test(c), 'Path must start with "m" or "M"')
        return
      }

      const hardened = c.length > 1 && c.includes("'")

      let childIndex = parseInt(c, 10)
      assert(childIndex < HDKey.HARDENED_OFFSET, 'Invalid index')

      if (hardened) {
        childIndex += HDKey.HARDENED_OFFSET
      }

      this.deriveChild(childIndex)
    })

    return this
  }

  public deriveChild(index: number): HDKey {
    const isHardened = index >= HDKey.HARDENED_OFFSET
    const indexBuffer = Buffer.allocUnsafe(4)
    indexBuffer.writeUInt32BE(index, 0)

    let data: Buffer

    if (isHardened) {
      // Hardened child
      assert(this._privateKey, 'Could not derive hardened child key')

      const zb = Buffer.alloc(1, 0)
      const pk = Buffer.concat([zb, this._privateKey])

      // data = 0x00 || ser256(kpar) || ser32(index)
      data = Buffer.concat([pk, indexBuffer])
    } else {
      // Normal child
      // data = serP(point(kpar)) || ser32(index)
      //      = serP(Kpar) || ser32(index)
      data = Buffer.concat([this.publicKey, indexBuffer])
    }

    const I = crypto
      .createHmac('sha512', this._chainCode)
      .update(data)
      .digest()
    const IL = I.slice(0, 32)
    const IR = I.slice(32)

    const parentFingerprint = this._fingerprint

    // Private parent key -> private child key
    if (this._privateKey) {
      // ki = parse256(IL) + kpar (mod n)
      try {
        this.privateKey = secp256k1.privateKeyTweakAdd(this.privateKey, IL)
        // throw if IL >= n || (privateKey + IL) === 0
      } catch (err) {
        // In case parse256(IL) >= n or ki == 0, one should proceed with the next value for i
        return this.deriveChild(index + 1)
      }
      // Public parent key -> public child key
    } else {
      // Ki = point(parse256(IL)) + Kpar
      //    = G*IL + Kpar
      try {
        this.publicKey = secp256k1.publicKeyTweakAdd(this.publicKey, IL, true)
        // throw if IL >= n || (g**IL + publicKey) is infinity
      } catch (err) {
        // In case parse256(IL) >= n or Ki is the point at infinity, one should proceed with the next value for i
        return this.deriveChild(index + 1)
      }
    }

    this._chainCode = IR
    this._depth = this._depth + 1
    this._parentFingerprint = parentFingerprint
    this._index = index

    return this
  }

  public sign(hash: Buffer): Buffer {
    return secp256k1.sign(hash, this.privateKey).signature
  }

  public verify(hash: Buffer, signature: Buffer): boolean {
    return secp256k1.verify(hash, signature, this._publicKey)
  }

  public wipePrivateData(): HDKey {
    if (this._privateKey) {
      crypto.randomBytes(this._privateKey.length).copy(this._privateKey)
    }
    this._privateKey = null
    return this
  }

  public toJSON(): HDKeyJSON {
    return {
      xpriv: this.privateExtendedKey,
      xpub: this.publicExtendedKey
    }
  }
}

export interface Versions {
  private: number
  public: number
}

export interface HDKeyJSON {
  xpriv: string
  xpub: string
}

export default HDKey
