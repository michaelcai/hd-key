# hd-key

Bitcoin [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) hierarchical deterministic keys Typescript implemention.

## Installing / Getting started

```shell
npm install --save hd-key
```

## Basic Usage

### HDKey.fromMasterSeed(seedBuffer[, masterSecret, versions])

```typescript
const seed =
  'a0c42a9c3ac6abf2ba6a9946ae83af18f51bf1c9fa7dacc4c92513cc4dd015834341c775dcd4c0fac73547c5662d81a9e9361a0aac604a73a321bd9103bce8af'
const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
```

### HDKey.fromExtendedKey(extendedKey[, versions])

```typescript
const key =
  'xprvA2nrNbFZABcdryreWet9Ea4LvTJcGsqrMzxHx98MMrotbir7yrKCEXw7nadnHM8Dq38EGfSh6dqA9QWTyefMLEcBYJUuekgW4BYPJcr9E7j'
const hdkey = HDKey.fromExtendedKey(key)
```

**or**

```typescript
const key =
  'xpub6FnCn6nSzZAw5Tw7cgR9bi15UV96gLZhjDstkXXxvCLsUXBGXPdSnLFbdpq8p9HmGsApME5hQTZ3emM2rnY5agb9rXpVGyy3bdW6EEgAtqt'
const hdkey = HDKey.fromExtendedKey(key)
```

### HDKey.fromJSON(obj)

Creates an `hdkey` object from an object created via `hdkey.toJSON()`.

### hdkey.derive(path)

Derives the `hdkey` at `path` from the current `hdkey`.

```typescript
const seed = 'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542'
const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))
const childkey = hdkey.derive("m/0/2147483647'/1")

console.log(childkey.privateExtendedKey)
// -> "xprv9zFnWC6h2cLgpmSA46vutJzBcfJ8yaJGg8cX1e5StJh45BBciYTRXSd25UEPVuesF9yog62tGAQtHjXajPPdbRCHuWS6T8XA2ECKADdw4Ef"
console.log(childkey.publicExtendedKey)
// -> "xpub6DF8uhdarytz3FWdA8TvFSvvAh8dP3283MY7p2V4SeE2wyWmG5mg5EwVvmdMVCQcoNJxGoWaU9DCWh89LojfZ537wTfunKau47EL2dhHKon"
```

### hdkey.sign(hash)

Signs the buffer `hash` with the private key using `secp256k1` and returns the signature as a buffer.

### hdkey.verify(hash, signature)

Verifies that the `signature` is valid for `hash` and the `hdkey`'s public key using `secp256k1`. Returns `true` for valid, `false` for invalid. Throws if the `hash` or `signature` is the wrong length.

### hdkey.wipePrivateData()

Wipes all record of the private key from the `hdkey` instance. After calling this method, the instance will behave as if it was created via `HDKey.fromExtendedKey(xpub)`.

### hdkey.toJSON()

Serializes the `hdkey` to an object that can be `JSON.stringify()`ed.

```typescript
const seed = 'fffcf9f6f3f0edeae7e4e1dedbd8d5d2cfccc9c6c3c0bdbab7b4b1aeaba8a5a29f9c999693908d8a8784817e7b7875726f6c696663605d5a5754514e4b484542'
const hdkey = HDKey.fromMasterSeed(Buffer.from(seed, 'hex'))

console.log(hdkey.toJSON())
// -> {
//      xpriv: 'xprv9s21ZrQH143K31xYSDQpPDxsXRTUcvj2iNHm5NUtrGiGG5e2DtALGdso3pGz6ssrdK4PFmM8NSpSBHNqPqm55Qn3LqFtT2emdEXVYsCzC2U',
//      xpub: 'xpub661MyMwAqRbcFW31YEwpkMuc5THy2PSt5bDMsktWQcFF8syAmRUapSCGu8ED9W6oDMSgv6Zz8idoc4a6mr8BDzTJY47LJhkJ8UB7WEGuduB'
//    }
```

### hdkey.privateKey

Getter/Setter of the `hdkey`'s private key, stored as a buffer.

### hdkey.publicKey

Getter/Setter of the `hdkey`'s public key, stored as a buffer.

### hdkey.privateExtendedKey

Getter/Setter of the `hdkey`'s `xprv`, stored as a string.

### hdkey.publicExtendedKey

Getter/Setter of the `hdkey`'s `xpub`, stored as a string.

## Developing

### Dev

```shell
yarn watch
```

### Test

```shell
yarn test
```

### Cov

```shel
yarn cov
```

## Versioning

We can maybe use [SemVer](http://semver.org/) for versioning. For the versions available, see the [link to tags on this repository](/tags).

## References

- https://github.com/cryptocoinjs/hdkey

## Licensing

State what the license is and how to find the text version of the license.
