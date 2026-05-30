// Copyright 2026 Amirhassan <oxamirdev@gmail.com>
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

import { SwapProtocol } from '@tetherto/wdk-wallet/protocols'
import { StonApiClient } from '@ston-fi/api'
import { dexFactory } from '@ston-fi/sdk'
import { TonClient } from '@ton/ton'
import { Address } from '@ton/core'

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */
/** @typedef {import('@tetherto/wdk-wallet').IWalletAccountReadOnly} IWalletAccountReadOnly */

/** @typedef {import('@tetherto/wdk-wallet/protocols').SwapOptions} SwapOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwapResult} SwapResult */

/**
 * @typedef {Object} StonfiProtocolConfig
 * @property {number | bigint} [swapMaxFee] - The maximum fee amount for swap operations.
 * @property {number | string} [slippageTolerance] - The slippage tolerance (e.g. '0.01' for 1%).
 * @property {string} [tonRpcEndpoint] - Optional fallback TON RPC endpoint.
 */

export class SwapMaxFeeExceededError extends Error {
  constructor (estimated, max) {
    super(`Estimated swap fee (${estimated}) exceeds the configured swapMaxFee (${max})`)
    this.name = 'SwapMaxFeeExceededError'
    this.code = 'SWAP_MAX_FEE_EXCEEDED'
  }
}

export class InvalidTokenAddressError extends Error {
  constructor (address) {
    super(`The token address is invalid: ${address}`)
    this.name = 'InvalidTokenAddressError'
    this.code = 'INVALID_TOKEN_ADDRESS'
  }
}

export class ReadOnlyAccountError extends Error {
  constructor () {
    super('The wallet account is read-only and cannot send transactions')
    this.name = 'ReadOnlyAccountError'
    this.code = 'READ_ONLY_ACCOUNT_ERROR'
  }
}

export class SwapValidationError extends Error {
  constructor (message) {
    super(message)
    this.name = 'SwapValidationError'
    this.code = 'SWAP_VALIDATION_ERROR'
  }
}

const NULL_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'
const DEFAULT_SLIPPAGE_TOLERANCE = '0.01'

/**
 * Normalizes user input for native TON token identifiers.
 * @param {string} address
 * @returns {string}
 */
function formatAddress (address) {
  const trimmed = address.trim()
  const normalized = trimmed.toLowerCase()
  if (normalized === 'native' || normalized === 'ton' || normalized === 'eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c') {
    return NULL_ADDRESS
  }
  return trimmed
}

/**
 * Validates a TON address. Throws InvalidTokenAddressError if invalid.
 * @param {string} address
 * @returns {string} The validated address string.
 */
function validateAddress (address) {
  const formatted = formatAddress(address)
  if (formatted === NULL_ADDRESS) {
    return formatted
  }
  try {
    Address.parse(formatted)
    return formatted
  } catch {
    throw new InvalidTokenAddressError(address)
  }
}

/**
 * Compares two TON addresses for equality, handling case and format differences.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function addressesEqual (a, b) {
  try {
    const addrA = Address.parse(a)
    const addrB = Address.parse(b)
    return addrA.toString() === addrB.toString()
  } catch {
    return a.toLowerCase().trim() === b.toLowerCase().trim()
  }
}

export default class StonfiProtocolTon extends SwapProtocol {
  /**
   * Creates a new interface to the stonfi protocol for the ton blockchain.
   *
   * @param {IWalletAccount | IWalletAccountReadOnly} account - The wallet account.
   * @param {StonfiProtocolConfig} [config] - The stonfi protocol configuration.
   */
  constructor (account, config = {}) {
    super(account, config)

    /**
     * The stonfi protocol configuration.
     *
     * @protected
     * @type {StonfiProtocolConfig}
     */
    this._config = config

    /**
     * Ston.fi API client.
     *
     * @private
     * @type {StonApiClient}
     */
    this._apiClient = new StonApiClient()
  }

  /**
   * Returns protocol metadata for WDK manager integration.
   *
   * @returns {{name: string, version: string, chain: string, supports: string[], dex: string, dexVersions: string[]}}
   */
  getProtocolInfo () {
    return {
      name: 'StonfiProtocolTon',
      version: '1.0.0-beta.1',
      chain: 'ton',
      supports: ['swap', 'quote'],
      dex: 'ston.fi',
      dexVersions: ['v1', 'v2.1']
    }
  }

  /**
   * Internal helper to open TonClient.
   * Uses configured endpoint only. Never accesses private account properties.
   *
   * @private
   * @returns {TonClient}
   */
  _getTonClient () {
    return new TonClient({
      endpoint: this._config.tonRpcEndpoint || 'https://toncenter.com/api/v2/jsonRPC'
    })
  }

  /**
   * Validates swap options before execution.
   *
   * @private
   * @param {SwapOptions} options
   */
  _validateSwapOptions (options) {
    if (!options.tokenIn || typeof options.tokenIn !== 'string') {
      throw new SwapValidationError('tokenIn is required and must be a string')
    }
    if (!options.tokenOut || typeof options.tokenOut !== 'string') {
      throw new SwapValidationError('tokenOut is required and must be a string')
    }
    if (options.tokenInAmount !== undefined && options.tokenOutAmount !== undefined) {
      throw new SwapValidationError('Cannot specify both tokenInAmount and tokenOutAmount')
    }
    if (options.tokenInAmount === undefined && options.tokenOutAmount === undefined) {
      throw new SwapValidationError('Either tokenInAmount or tokenOutAmount must be provided')
    }

    const amount = options.tokenInAmount !== undefined ? options.tokenInAmount : options.tokenOutAmount
    if (typeof amount !== 'bigint' || amount <= 0n) {
      throw new SwapValidationError('Swap amount must be a positive bigint')
    }

    if (this._config.slippageTolerance !== undefined) {
      const st = Number(this._config.slippageTolerance)
      if (Number.isNaN(st) || st < 0 || st > 1) {
        throw new SwapValidationError('slippageTolerance must be a number between 0 and 1')
      }
    }

    if (options.to !== undefined && typeof options.to !== 'string') {
      throw new SwapValidationError('Recipient address (to) must be a string when provided')
    }
  }

  /**
   * Ensures recipient address matches sender if provided.
   * Ston.fi DEX sends output tokens back to the sender wallet.
   *
   * @private
   * @param {SwapOptions} options
   * @param {string} userAddress
   */
  _validateRecipient (options, userAddress) {
    if (!options.to) return
    const recipient = validateAddress(options.to)
    if (!addressesEqual(recipient, userAddress)) {
      throw new SwapValidationError(
        'Ston.fi protocol does not support sending swapped tokens to a different recipient. ' +
        'Output tokens always return to the sender wallet address.'
      )
    }
  }

  /**
   * Simulates a swap via Ston.fi API.
   *
   * @private
   * @param {SwapOptions} options
   * @returns {Promise<{offerAddress: string, askAddress: string, result: object, slippageTolerance: string}>}
   */
  async _simulateSwap (options) {
    const offerAddress = validateAddress(options.tokenIn)
    const askAddress = validateAddress(options.tokenOut)

    if (process.env.DEBUG_STONFI) {
      console.log(`[STONFI] Simulating swap: ${offerAddress} -> ${askAddress} amount=${options.tokenInAmount || options.tokenOutAmount}`)
    }

    const slippageTolerance = this._config.slippageTolerance
      ? this._config.slippageTolerance.toString()
      : DEFAULT_SLIPPAGE_TOLERANCE

    let result
    try {
      if (options.tokenInAmount) {
        result = await this._apiClient.simulateSwap({
          offerAddress,
          askAddress,
          offerUnits: options.tokenInAmount.toString(),
          slippageTolerance
        })
      } else {
        result = await this._apiClient.simulateReverseSwap({
          offerAddress,
          askAddress,
          askUnits: options.tokenOutAmount.toString(),
          slippageTolerance
        })
      }
    } catch (err) {
      throw new SwapValidationError(`Ston.fi simulation failed: ${err.message}`)
    }

    return { offerAddress, askAddress, result, slippageTolerance }
  }

  /**
   * Builds transaction parameters from simulation result.
   *
   * @private
   * @param {string} offerAddress
   * @param {string} askAddress
   * @param {object} simulationResult
   * @param {string} userAddress
   * @returns {Promise<{txParams: object, offerUnits: string, askUnits: string, minAskUnits: string}>}
   */
  async _buildSwapTxParams (offerAddress, askAddress, simulationResult, userAddress) {
    const { router: routerInfo, offerUnits, askUnits, minAskUnits } = simulationResult
    const dexContracts = dexFactory(routerInfo)
    const tonClient = this._getTonClient()
    const router = tonClient.open(dexContracts.Router.create(routerInfo.address))

    const isTonIn = offerAddress === NULL_ADDRESS
    const isTonOut = askAddress === NULL_ADDRESS

    let txParams

    if (isTonIn && !isTonOut) {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapTonToJettonTxParams({
        userWalletAddress: userAddress,
        proxyTon,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    } else if (!isTonIn && isTonOut) {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapJettonToTonTxParams({
        userWalletAddress: userAddress,
        offerJettonAddress: offerAddress,
        offerAmount: BigInt(offerUnits),
        proxyTon,
        minAskAmount: BigInt(minAskUnits)
      })
    } else if (!isTonIn && !isTonOut) {
      txParams = await router.getSwapJettonToJettonTxParams({
        userWalletAddress: userAddress,
        offerJettonAddress: offerAddress,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    } else {
      throw new SwapValidationError('TON to TON swap is not supported by Ston.fi')
    }

    return { txParams, offerUnits, askUnits, minAskUnits }
  }

  /**
   * Swaps a pair of tokens.
   *
   * @param {SwapOptions} options - The swap's options.
   * @returns {Promise<SwapResult>} The swap's result.
   */
  async swap (options) {
    this._validateSwapOptions(options)

    const userAddress = await this._account.getAddress()
    this._validateRecipient(options, userAddress)

    if (typeof this._account.sendTransaction !== 'function') {
      throw new ReadOnlyAccountError()
    }

    const { offerAddress, askAddress, result } = await this._simulateSwap(options)
    const { txParams, offerUnits, askUnits } = await this._buildSwapTxParams(
      offerAddress, askAddress, result, userAddress
    )

    const estimatedFeeResult = await this._account.quoteSendTransaction({
      to: txParams.to.toString(),
      value: txParams.value,
      body: txParams.body
    })

    if (this._config.swapMaxFee && estimatedFeeResult.fee > BigInt(this._config.swapMaxFee)) {
      throw new SwapMaxFeeExceededError(estimatedFeeResult.fee, this._config.swapMaxFee)
    }

    const txResult = await this._account.sendTransaction({
      to: txParams.to.toString(),
      value: txParams.value,
      body: txParams.body
    })

    return {
      hash: txResult.hash,
      fee: txResult.fee,
      tokenInAmount: BigInt(offerUnits),
      tokenOutAmount: BigInt(askUnits)
    }
  }

  /**
   * Quotes the costs of a swap operation.
   *
   * @param {SwapOptions} options - The swap's options.
   * @returns {Promise<Omit<SwapResult, 'hash'>>} The swap's quote.
   */
  async quoteSwap (options) {
    this._validateSwapOptions(options)

    const userAddress = await this._account.getAddress()
    this._validateRecipient(options, userAddress)

    const { offerAddress, askAddress, result } = await this._simulateSwap(options)
    const { txParams, offerUnits, askUnits, minAskUnits } = await this._buildSwapTxParams(
      offerAddress, askAddress, result, userAddress
    )

    const quoteResult = await this._account.quoteSendTransaction({
      to: txParams.to.toString(),
      value: txParams.value,
      body: txParams.body
    })

    if (this._config.swapMaxFee && quoteResult.fee > BigInt(this._config.swapMaxFee)) {
      throw new SwapMaxFeeExceededError(quoteResult.fee, this._config.swapMaxFee)
    }

    return {
      fee: quoteResult.fee,
      tokenInAmount: BigInt(offerUnits),
      tokenOutAmount: BigInt(askUnits),
      minTokenOutAmount: BigInt(minAskUnits)
    }
  }
}