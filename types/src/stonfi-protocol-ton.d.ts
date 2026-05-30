import { SwapProtocol } from '@tetherto/wdk-wallet/protocols'
import type { IWalletAccount, IWalletAccountReadOnly } from '@tetherto/wdk-wallet'
import type { StonApiClient } from '@ston-fi/api'
import type { TonClient } from '@ton/ton'

/**
 * Configuration options for the Ston.fi protocol module.
 */
export type StonfiProtocolConfig = {
  /**
   * Maximum allowed fee for swap operations (in nanotons). If the estimated fee exceeds this, an error is thrown.
   * @default 500000000n (0.5 TON)
   */
  swapMaxFee?: number | bigint
  /**
   * Optional fallback TON RPC endpoint URL. If not provided, default public endpoint is used.
   */
  tonRpcEndpoint?: string
  /**
   * Slippage tolerance as a percentage (e.g., 0.5 for 0.5%).
   * @default 0.5
   */
  slippageTolerance?: number
}

/**
 * Options for performing a swap.
 * Extends the base SwapOptions from WDK.
 */
export interface StonfiSwapOptions {
  /** Input token address or 'ton' for native TON */
  tokenIn: string
  /** Output token address or 'ton' for native TON */
  tokenOut: string
  /** Amount of input token to swap (in nanotons or token decimals) */
  tokenInAmount?: bigint
  /** Desired output token amount (alternative to tokenInAmount) */
  tokenOutAmount?: bigint
  /** Recipient wallet address (defaults to account's address) */
  to?: string
  /** Optional slippage tolerance override (percentage) */
  slippageTolerance?: number
}

/**
 * Result of a swap operation.
 */
export interface StonfiSwapResult {
  /** Transaction hash of the executed swap */
  hash: string
  /** Total fee paid for the transaction (in nanotons) */
  fee: bigint
  /** Actual amount of input token used (in nanotons or token decimals) */
  tokenInAmount: bigint
  /** Actual amount of output token received (in nanotons or token decimals) */
  tokenOutAmount: bigint
}

/**
 * Quote result from a simulated swap.
 */
export interface StonfiQuoteResult {
  /** Estimated fee for the transaction (in nanotons) */
  fee: bigint
  /** Amount of input token required */
  tokenInAmount: bigint
  /** Amount of output token expected */
  tokenOutAmount: bigint
  /** Minimum amount of output token considering slippage */
  minTokenOutAmount: bigint
}

/**
 * Error thrown when the estimated swap fee exceeds the configured maximum.
 */
export declare class SwapMaxFeeExceededError extends Error {
  constructor(message?: string)
}

/**
 * Error thrown when a token address is invalid.
 */
export declare class InvalidTokenAddressError extends Error {
  constructor(message?: string)
}

/**
 * Error thrown when attempting a write operation on a read-only account.
 */
export declare class ReadOnlyAccountError extends Error {
  constructor(message?: string)
}

/**
 * Error thrown when swap validation fails (e.g., invalid amounts, same token, etc.).
 */
export declare class SwapValidationError extends Error {
  constructor(message?: string)
}

/**
 * Ston.fi swap protocol implementation for TON blockchain.
 * Compatible with WDK's SwapProtocol interface and Bare Runtime.
 */
export default class StonfiProtocolTon extends SwapProtocol {
  /**
   * Creates a new read-only interface to the Ston.fi protocol.
   * @param account - Read-only wallet account
   * @param config - Optional configuration
   */
  constructor(account: IWalletAccountReadOnly, config?: StonfiProtocolConfig)

  /**
   * Creates a new interface to the Ston.fi protocol.
   * @param account - Full wallet account (supports transaction sending)
   * @param config - Optional configuration
   */
  constructor(account: IWalletAccount, config?: StonfiProtocolConfig)

  /**
   * Ston.fi API client instance.
   * @internal
   */
  private _apiClient: StonApiClient

  /**
   * Internal helper to get a TonClient instance.
   * @internal
   */
  private _getTonClient(): TonClient

  /**
   * Returns metadata about the protocol.
   * @returns Protocol information object
   */
  getProtocolInfo(): {
    name: string
    chain: string
    dex: string
    supports: string[]
    dexVersions: string[]
  }

  /**
   * Simulates a swap to get a quote without executing.
   * @param options - Swap options (must provide either tokenInAmount or tokenOutAmount, not both)
   * @returns Quote result with fee and amounts
   * @throws {SwapValidationError} If parameters are invalid
   * @throws {InvalidTokenAddressError} If token address is malformed
   * @throws {SwapMaxFeeExceededError} If estimated fee exceeds config limit
   */
  quoteSwap(options: StonfiSwapOptions): Promise<StonfiQuoteResult>

  /**
   * Executes a swap transaction on the blockchain.
   * @param options - Swap options (must provide either tokenInAmount or tokenOutAmount, not both)
   * @returns Result containing transaction hash and details
   * @throws {ReadOnlyAccountError} If account is read-only
   * @throws {SwapValidationError} If parameters are invalid
   * @throws {InvalidTokenAddressError} If token address is malformed
   * @throws {SwapMaxFeeExceededError} If estimated fee exceeds config limit
   */
  swap(options: StonfiSwapOptions): Promise<StonfiSwapResult>
}