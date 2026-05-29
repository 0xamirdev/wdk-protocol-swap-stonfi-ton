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

function formatAddress (address) {
  const normalized = address.toLowerCase().trim()
  if (normalized === 'native' || normalized === 'ton' || normalized === 'base' || normalized === 'eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c') {
    return 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'
  }
  return address
}

function validateAddress (address) {
  const formatted = formatAddress(address)
  if (formatted === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
    return formatted
  }
  try {
    Address.parse(address)
    return formatted
  } catch {
    throw new InvalidTokenAddressError(address)
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
   * Internal helper to open TonClient.
   *
   * @private
   * @returns {TonClient}
   */
  _getTonClient () {
    if (this._account._tonClient) {
      return this._account._tonClient
    }
    return new TonClient({
      endpoint: this._config.tonRpcEndpoint || 'https://toncenter.com/api/v2/jsonRPC'
    })
  }

  /**
   * Swaps a pair of tokens.
   *
   * @param {SwapOptions} options - The swap's options.
   * @returns {Promise<SwapResult>} The swap's result.
   */
  async swap (options) {
    if (typeof this._account.sendTransaction !== 'function') {
      throw new ReadOnlyAccountError()
    }

    const userAddress = await this._account.getAddress()
    const offerAddress = validateAddress(options.tokenIn)
    const askAddress = validateAddress(options.tokenOut)

    const slippageTolerance = this._config.slippageTolerance ? this._config.slippageTolerance.toString() : '0.01'

    let simulationResult
    if (options.tokenInAmount) {
      simulationResult = await this._apiClient.simulateSwap({
        offerAddress,
        askAddress,
        offerUnits: options.tokenInAmount.toString(),
        slippageTolerance
      })
    } else if (options.tokenOutAmount) {
      simulationResult = await this._apiClient.simulateReverseSwap({
        offerAddress,
        askAddress,
        askUnits: options.tokenOutAmount.toString(),
        slippageTolerance
      })
    } else {
      throw new Error('Either tokenInAmount or tokenOutAmount must be provided')
    }

    const { router: routerInfo, offerUnits, askUnits, minAskUnits } = simulationResult
    const dexContracts = dexFactory(routerInfo)
    const tonClient = this._getTonClient()

    const router = tonClient.open(dexContracts.Router.create(routerInfo.address))

    let txParams
    if (offerAddress === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapTonToJettonTxParams({
        userWalletAddress: userAddress,
        proxyTon,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    } else if (askAddress === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapJettonToTonTxParams({
        userWalletAddress: userAddress,
        offerJettonAddress: offerAddress,
        offerAmount: BigInt(offerUnits),
        proxyTon,
        minAskAmount: BigInt(minAskUnits)
      })
    } else {
      txParams = await router.getSwapJettonToJettonTxParams({
        userWalletAddress: userAddress,
        offerJettonAddress: offerAddress,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    }

    // Estimate transaction fee before sending to enforce swapMaxFee
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
    const offerAddress = validateAddress(options.tokenIn)
    const askAddress = validateAddress(options.tokenOut)
    const slippageTolerance = this._config.slippageTolerance ? this._config.slippageTolerance.toString() : '0.01'

    let simulationResult
    if (options.tokenInAmount) {
      simulationResult = await this._apiClient.simulateSwap({
        offerAddress,
        askAddress,
        offerUnits: options.tokenInAmount.toString(),
        slippageTolerance
      })
    } else if (options.tokenOutAmount) {
      simulationResult = await this._apiClient.simulateReverseSwap({
        offerAddress,
        askAddress,
        askUnits: options.tokenOutAmount.toString(),
        slippageTolerance
      })
    } else {
      throw new Error('Either tokenInAmount or tokenOutAmount must be provided')
    }

    const { router: routerInfo, offerUnits, askUnits, minAskUnits } = simulationResult
    const dexContracts = dexFactory(routerInfo)
    const tonClient = this._getTonClient()

    const router = tonClient.open(dexContracts.Router.create(routerInfo.address))
    const userAddress = await this._account.getAddress()

    let txParams
    if (offerAddress === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapTonToJettonTxParams({
        userWalletAddress: userAddress,
        proxyTon,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    } else if (askAddress === 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c') {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapJettonToTonTxParams({
        userWalletAddress: userAddress,
        offerJettonAddress: offerAddress,
        offerAmount: BigInt(offerUnits),
        proxyTon,
        minAskAmount: BigInt(minAskUnits)
      })
    } else {
      txParams = await router.getSwapJettonToJettonTxParams({
        userWalletAddress: userAddress,
        offerJettonAddress: offerAddress,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    }

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
      tokenOutAmount: BigInt(askUnits)
    }
  }
}