import BigInteger from 'bigi'
import crypto from 'crypto'
import ecurve from 'ecurve'
import HDKey from '../index'
import keys from './keys'

const curve = ecurve.getCurveByName('secp256k1')

describe('hdkey', () => {
  describe('fromMasterSeed', () => {
    keys.valid.forEach(key => {
      it(`should properly derive the chain path: ${key.path}`, () => {
        const hdkey = HDKey.fromMasterSeed(Buffer.from(key.seed, 'hex'))
        const childkey = hdkey.derive(key.path)

        expect(childkey.privateExtendedKey).toEqual(key.private)
        expect(childkey.publicExtendedKey).toEqual(key.public)
      })

      describe(`> ${key.path} toJSON() / fromJSON()`, () => {
        it('should return an object read for JSON serialization', () => {
          const hdkey = HDKey.fromMasterSeed(Buffer.from(key.seed, 'hex'))
          const childkey = hdkey.derive(key.path)

          const obj = {
            xpriv: key.private,
            xpub: key.public
          }

          expect(childkey.toJSON()).toEqual(obj)

          const newKey = HDKey.fromJSON(obj)
          expect(newKey.privateExtendedKey).toEqual(key.private)
          expect(newKey.publicExtendedKey).toEqual(key.public)
        })
      })
    })
  })

  describe('- privateKey', () => {
    it('should throw an error if incorrect key size', () => {
      const hdkey = new HDKey()
      expect(() => {
        hdkey.privateKey = Buffer.from([1, 2, 3, 4])
      }).toThrow(/key must be 32/)
    })
  })

  describe('- publicKey', () => {
    it('should throw an error if incorrect key size', () => {
      expect(() => {
        const hdkey = new HDKey()
        hdkey.publicKey = Buffer.from([1, 2, 3, 4])
      }).toThrow(/key must be 33 or 65/)
    })

    it('should not throw if key is 33 bytes (compressed)', () => {
      const priv = crypto.randomBytes(32)
      const pub = curve.G.multiply(BigInteger.fromBuffer(priv)).getEncoded(true)
      expect(pub).toHaveLength(33)
      const hdkey = new HDKey()
      hdkey.publicKey = pub
    })

    it('should not throw if key is 65 bytes (not compressed)', () => {
      const priv = crypto.randomBytes(32)
      const pub = curve.G.multiply(BigInteger.fromBuffer(priv)).getEncoded(
        false
      )
      expect(pub).toHaveLength(65)
      const hdkey = new HDKey()
      hdkey.publicKey = pub
    })
  })

  describe('+ fromExtendedKey()', () => {
    describe('> when private', () => {
      it('should parse it', () => {
        // m/0/2147483647'/1/2147483646'/2
        const key =
          'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j'
        const hdkey = HDKey.fromExtendedKey(key)
        expect(hdkey.versions.private).toEqual(0x0488ade4)
        expect(hdkey.versions.public).toEqual(0x0488b21e)
        expect(hdkey.depth).toEqual(5)
        expect(hdkey.parentFingerprint).toEqual(0x31a507b8)
        expect(hdkey.index).toEqual(2)
        expect(hdkey.chainCode.toString('hex')).toEqual(
          '9452b549be8cea3ecb7a84bec10dcfd94afe4d129ebfd3b3cb58eedf394ed271'
        )
        expect(hdkey.privateKey.toString('hex')).toEqual(
          'bb7d39bdb83ecf58f2fd82b6d918341cbef428661ef01ab97c28a4842125ac23'
        )
        expect(hdkey.publicKey.toString('hex')).toEqual(
          '024d902e1a2fc7a8755ab5b694c575fce742c48d9ff192e63df5193e4c7afe1f9c'
        )
        expect(hdkey.identifier.toString('hex')).toEqual(
          '26132fdbe7bf89cbc64cf8dafa3f9f88b8666220'
        )
      })
    })

    describe('> when public', () => {
      it('should parse it', () => {
        // m/0/2147483647'/1/2147483646'/2
        const key =
          'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt'
        const hdkey = HDKey.fromExtendedKey(key)
        expect(hdkey.versions.private).toEqual(0x0488ade4)
        expect(hdkey.versions.public).toEqual(0x0488b21e)
        expect(hdkey.depth).toEqual(5)
        expect(hdkey.parentFingerprint).toEqual(0x31a507b8)
        expect(hdkey.index).toEqual(2)
        expect(hdkey.chainCode.toString('hex')).toEqual(
          '9452b549be8cea3ecb7a84bec10dcfd94afe4d129ebfd3b3cb58eedf394ed271'
        )
        expect(hdkey.privateKey).toEqual(null)
        expect(hdkey.publicKey.toString('hex')).toEqual(
          '024d902e1a2fc7a8755ab5b694c575fce742c48d9ff192e63df5193e4c7afe1f9c'
        )
        expect(hdkey.fingerprint).toEqual(638791643)
        expect(hdkey.identifier.toString('hex')).toEqual(
          '26132fdbe7bf89cbc64cf8dafa3f9f88b8666220'
        )
        expect(hdkey.pubKeyHash.toString('hex')).toEqual(
          '26132fdbe7bf89cbc64cf8dafa3f9f88b8666220'
        )
      })
    })
    describe('> when signing', () => {
      it('should work', () => {
        const key =
          'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j'
        const hdkey = HDKey.fromExtendedKey(key)

        const ma = Buffer.alloc(32, 0)
        const mb = Buffer.alloc(32, 8)
        const a = hdkey.sign(ma)
        const b = hdkey.sign(mb)
        expect(a.toString('hex')).toEqual(
          '6ba4e554457ce5c1f1d7dbd10459465e39219eb9084ee23270688cbe0d49b52b7905d5beb28492be439a3250e9359e0390f844321b65f1a88ce07960dd85da06'
        )

        expect(b.toString('hex')).toEqual(
          'dfae85d39b73c9d143403ce472f7c4c8a5032c13d9546030044050e7d39355e47a532e5c0ae2a25392d97f5e55ab1288ef1e08d5c034bad3b0956fbbab73b381'
        )

        expect(hdkey.verify(ma, a)).toBeTruthy()
        expect(hdkey.verify(mb, b)).toBeTruthy()
        expect(
          hdkey.verify(Buffer.alloc(32), Buffer.alloc(64))
        ).not.toBeTruthy()
        expect(hdkey.verify(ma, b)).not.toBeTruthy()
        expect(hdkey.verify(mb, a)).not.toBeTruthy()

        expect(() => {
          hdkey.verify(Buffer.alloc(99), a)
        }).toThrow(/message length is invalid/)

        expect(() => {
          hdkey.verify(ma, Buffer.alloc(99))
        }).toThrow(/signature length is invalid/)
      })
    })

    describe('> when deriving public key', () => {
      it('should work', () => {
        const key =
          'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8'
        const hdkey = HDKey.fromExtendedKey(key)

        const path = 'm/3353535/2223/0/99424/4/33'
        const derivedHDKey = hdkey.derive(path)

        const expected =
          'xpub6JdKdVJtdx6sC3nh87pDvnGhotXuU5Kz6Qy7Piy84vUAwWSYShsUGULE8u6gCivTHgz7cCKJHiXaaMeieB4YnoFVAsNgHHKXJ2mN6jCMbH1'
        expect(derivedHDKey.publicExtendedKey).toEqual(expected)
      })
    })

    describe('> when private key integer is less than 32 bytes', () => {
      it('should work', () => {
        const seed = '000102030405060708090a0b0c0d0e0f'
        const masterKey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

        const newKey = masterKey.derive("m/44'/6'/4'")
        const expected =
          'xprv9ymoag6W7cR6KBcJzhCM6qqTrb3rRVVwXKzwNqp1tDWcwierEv3BA9if3ARHMhMPh9u2jNoutcgpUBLMfq3kADDo7LzfoCnhhXMRGX3PXDx'
        expect(newKey.privateExtendedKey).toEqual(expected)
      })
    })

    describe('HARDENED_OFFSET', () => {
      it('should be set', () => {
        expect(HDKey.HARDENED_OFFSET).toBeTruthy()
      })
    })

    describe('> when private key has leading zeros', () => {
      it('will include leading zeros when hashing to derive child', () => {
        const key =
          'xprv9s21ZrQH143K3ckY9DgU79uMTJkQRLdbCCVDh81SnxTgPzLLGax6uHeBULTtaEtcAvKjXfT7ZWtHzKjTpujMkUd9dDb8msDeAfnJxrgAYhr'
        const hdkey = HDKey.fromExtendedKey(key)
        expect(hdkey.privateKey.toString('hex')).toEqual(
          '00000055378cf5fafb56c711c674143f9b0ee82ab0ba2924f19b64f5ae7cdbfd'
        )
        const derived = hdkey.derive("m/44'/0'/0'/0/0'")
        expect(derived.privateKey.toString('hex')).toEqual(
          '3348069561d2a0fb925e74bf198762acc47dce7db27372257d2d959a9e6f8aeb'
        )
      })
    })

    describe('> when private key is null', () => {
      it('privateExtendedKey should return null and not throw', () => {
        const seed = '000102030405060708090a0b0c0d0e0f'
        const masterKey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

        expect(masterKey.privateExtendedKey).toBeTruthy()

        masterKey.wipePrivateData()

        expect(masterKey.privateExtendedKey).not.toBeTruthy()
      })
    })

    describe(' - when the path given to derive contains only the master extended key', () => {
      const hdKeyInstance = HDKey.fromMasterSeed(
        Buffer.from(keys.valid[0].seed, 'hex')
      )

      it('should return the same hdkey instance', () => {
        expect(hdKeyInstance.derive('m')).toEqual(hdKeyInstance)
        expect(hdKeyInstance.derive('M')).toEqual(hdKeyInstance)
        expect(hdKeyInstance.derive("m'")).toEqual(hdKeyInstance)
        expect(hdKeyInstance.derive("M'")).toEqual(hdKeyInstance)
      })
    })

    describe(' - when the path given to derive does not begin with master extended key', () => {
      it('should throw an error', () => {
        expect(() => {
          const hdKey = HDKey.fromMasterSeed(
            Buffer.from(keys.valid[0].seed, 'hex')
          )
          hdKey.derive('123')
        }).toThrow(/Path must start with "m" or "M"/)
      })
    })

    describe('- after wipePrivateData()', () => {
      it('should not have private data', () => {
        const hdkey = HDKey.fromMasterSeed(
          Buffer.from(keys.valid[6].seed, 'hex')
        ).wipePrivateData()
        expect(hdkey.privateKey).toEqual(null)
        expect(hdkey.privateExtendedKey).toEqual(null)
        expect(() => {
          hdkey.sign(Buffer.alloc(32))
        }).toThrow(/private key should be a Buffer/)
        const childKey = hdkey.derive('m/0')
        expect(childKey.publicExtendedKey).toEqual(keys.valid[7].public)
        expect(hdkey.privateKey).toEqual(null)
        expect(hdkey.privateExtendedKey).toEqual(null)
      })

      it('should have correct data', () => {
        // m/0/2147483647'/1/2147483646'/2
        const key =
          'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j'
        const hdkey = HDKey.fromExtendedKey(key).wipePrivateData()
        expect(hdkey.versions.private).toEqual(0x0488ade4)
        expect(hdkey.versions.public).toEqual(0x0488b21e)
        expect(hdkey.depth).toEqual(5)
        expect(hdkey.parentFingerprint).toEqual(0x31a507b8)
        expect(hdkey.index).toEqual(2)

        expect(hdkey.chainCode.toString('hex')).toEqual(
          '9452b549be8cea3ecb7a84bec10dcfd94afe4d129ebfd3b3cb58eedf394ed271'
        )

        expect(hdkey.publicKey.toString('hex')).toEqual(
          '024d902e1a2fc7a8755ab5b694c575fce742c48d9ff192e63df5193e4c7afe1f9c'
        )

        expect(hdkey.identifier.toString('hex')).toEqual(
          '26132fdbe7bf89cbc64cf8dafa3f9f88b8666220'
        )

        expect(hdkey.pubKeyHash.toString('hex')).toEqual(
          '26132fdbe7bf89cbc64cf8dafa3f9f88b8666220'
        )
      })

      it('should be able to verify signatures', () => {
        const fullKey = HDKey.fromMasterSeed(
          Buffer.from(keys.valid[0].seed, 'hex')
        )
        // using JSON methods to clone before mutating
        const wipedKey = HDKey.fromJSON(fullKey.toJSON()).wipePrivateData()

        const hash = Buffer.alloc(32, 8)

        expect(wipedKey.verify(hash, fullKey.sign(hash))).toBeTruthy()
      })

      it('should not throw if called on hdkey without private data', () => {
        const hdkey = HDKey.fromExtendedKey(keys.valid[0].public)
        expect(() => hdkey.wipePrivateData()).not.toThrow()
        expect(hdkey.publicExtendedKey).toEqual(keys.valid[0].public)
      })
    })
  })
})
