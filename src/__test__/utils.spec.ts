import { hash160, serialize } from '../utils'

describe('utils', () => {
  it('hash160', () => {
    expect(
      hash160(
        Buffer.from(
          '02b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737',
          'hex'
        )
      ).toString('hex')
    ).toEqual('93ce48570b55c42c2af816aeaba06cfee1224fae')
    expect(
      hash160(
        Buffer.from(
          '2c352c06030e090b212127390803312a1d22152c1d010d2c2811242c0d0f23372f21',
          'hex'
        )
      ).toString('hex')
    ).toEqual('2314e3e15dde32f6fbcbca85c2bf2b1e24abec74')
  })

  it('serialize/without parent', () => {
    expect(
      serialize(
        0x0488ade4,
        Buffer.from(
          '02b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737',
          'hex'
        ),
        0,
        0,
        0x00000000,
        Buffer.from(
          '2c06030e090b212127390803312a1d22152c1d010d2c2811242c0d0f23372f21',
          'hex'
        )
      ).toString('hex')
    ).toEqual(
      '0488ade40000000000000000002c06030e090b212127390803312a1d22152c1d010d2c2811242c0d0f23372f2102b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737'
    )
  })

  it('serialize/with parent', () => {
    expect(
      serialize(
        0x0488ade4,
        Buffer.from(
          '02b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737',
          'hex'
        ),
        1,
        0,
        0x12345678,
        Buffer.from(
          '2c06030e090b212127390803312a1d22152c1d010d2c2811242c0d0f23372f21',
          'hex'
        )
      ).toString('hex')
    ).toEqual(
      '0488ade40112345678000000002c06030e090b212127390803312a1d22152c1d010d2c2811242c0d0f23372f2102b4632d08485ff1df2db55b9dafd23347d1c47a457072a1e87be26896549a8737'
    )
  })
})
