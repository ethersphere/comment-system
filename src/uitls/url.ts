import { Utils } from '@ethersphere/bee-js'
import { Bytes } from '@ethersphere/bee-js/dist/types/utils/bytes'
import { Wallet, hexlify } from 'ethers'

/** Extracts path of a bzz link. For example:
    http://localhost:1633/bzz/<hash>/c/2023/development-updates/July.html => 
    <hash>/c/2023/development-updates/July.html
*/
const bzzPathRegex = /https?:\/\/.+\/bzz\/(.+)/

export function getIdentifierFromUrl(url: string): string | null {
  const result = bzzPathRegex.exec(url)

  return result && result[1] ? result[1] : null
}

export function getPrivateKeyFromUrl(url: string): Bytes<32> {
  const identifier = getIdentifierFromUrl(url)

  if (!identifier) {
    throw new Error('Cannot generate private key from an invalid URL')
  }

  return Utils.keccak256Hash(identifier)
}

export function getAddressFromUrl(url: string): string {
  const privateKey = getPrivateKeyFromUrl(url)

  const wallet = new Wallet(hexlify(privateKey))

  return wallet.address
}
