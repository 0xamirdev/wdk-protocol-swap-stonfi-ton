import { SwapProtocol } from '@tetherto/wdk-wallet/protocols'
import type { IWalletAccount, IWalletAccountReadOnly } from '@tetherto/wdk-wallet'
import type { StonApiClient } from '@ston-fi/api'
import type { TonClient } from '@ton/ton'

export type StonfiProtocolConfig = {
  swapMaxFee?: number | bigint
  tonRpcEndpoint?: string
  slippageTolerance?: number
}

export interface StonfiSwapOptions {
  tokenIn: string
  tokenOut: string
  tokenInAmount?: bigint
  tokenOutAmount?: bigint
  to?: string
  slippageTolerance?: number
}

export interface StonfiSwapResult {
  hash: string
  fee: bigint
  tokenInAmount: bigint
  tokenOutAmount: bigint
}

export interface StonfiQuoteResult {
  fee: bigint
  tokenInAmount: bigint
  tokenOutAmount: bigint
  minTokenOutAmount: bigint
}

export declare class SwapMaxFeeExceededError extends Error {
  constructor(message?: string)
}

export declare class InvalidTokenAddressError extends Error {
  constructor(message?: string)
}

export declare class ReadOnlyAccountError extends Error {
  constructor(message?: string)
}

export declare class SwapValidationError extends Error {
  constructor(message?: string)
}

export default class StonfiProtocolTon extends SwapProtocol {
  constructor(account: IWalletAccountReadOnly, config?: StonfiProtocolConfig)
  constructor(account: IWalletAccount, config?: StonfiProtocolConfig)

  private _apiClient: StonApiClient
  private _getTonClient(): TonClient

  getProtocolInfo(): {
    name: string
    chain: string
    dex: string
    supports: string[]
    dexVersions: string[]
  }

  quoteSwap(options: StonfiSwapOptions): Promise<StonfiQuoteResult>
  swap(options: StonfiSwapOptions): Promise<StonfiSwapResult>
}