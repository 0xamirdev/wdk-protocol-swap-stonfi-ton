'use strict'

import { SwapProtocol } from '@tetherto/wdk-wallet/protocols'
import { StonApiClient } from '@ston-fi/api'
import { dexFactory } from '@ston-fi/sdk'
import { TonClient } from '@ton/ton'

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */
/** @typedef {import('@tetherto/wdk-wallet').IWalletAccountReadOnly} IWalletAccountReadOnly */

/** @typedef {import('@tetherto/wdk-wallet/protocols').SwapOptions} SwapOptions */
/** @typedef {import('@tetherto/wdk-wallet/protocols').SwapResult} SwapResult */

/**
 * @typedef {Object} StonfiProtocolConfig
 * @property {number | bigint} [swapMaxFee] - The maximum fee amount for swap operations.
 * @property {string} [tonRpcEndpoint] - Optional fallback TON RPC endpoint.
 */

const PTON_ADDRESS = 'EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez'

function formatAddress (address) {
  const normalized = address.toLowerCase().trim()
  if (normalized === 'native' || normalized === 'ton' || normalized === 'base' || normalized === 'eqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaam9c' || normalized === PTON_ADDRESS.toLowerCase()) {
    return PTON_ADDRESS
  }
  return address
}

export default class StonfiProtocolTon extends SwapProtocol {
  /**
   * Creates a new read-only interface to the stonfi protocol for the ton blockchain.
   *
   * @overload
   * @param {IWalletAccountReadOnly} account - The wallet account to use to interact with the protocol.
   * @param {StonfiProtocolConfig} [config] - The stonfi protocol configuration.
   */

  /**
   * Creates a new interface to the stonfi protocol for the ton blockchain.
   *
   * @overload
   * @param {IWalletAccount} account - The wallet account to use to interact with the protocol.
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
    const userAddress = await this._account.getAddress()
    const offerAddress = formatAddress(options.tokenIn)
    const askAddress = formatAddress(options.tokenOut)

    const slippageTolerance = '0.01' // Default 1% slippage

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
    if (offerAddress === PTON_ADDRESS) {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapTonToJettonTxParams({
        userWalletAddress: userAddress,
        proxyTon,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    } else if (askAddress === PTON_ADDRESS) {
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
    const offerAddress = formatAddress(options.tokenIn)
    const askAddress = formatAddress(options.tokenOut)
    const slippageTolerance = '0.01'

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
    if (offerAddress === PTON_ADDRESS) {
      const proxyTon = dexContracts.pTON.create(routerInfo.ptonMasterAddress)
      txParams = await router.getSwapTonToJettonTxParams({
        userWalletAddress: userAddress,
        proxyTon,
        offerAmount: BigInt(offerUnits),
        askJettonAddress: askAddress,
        minAskAmount: BigInt(minAskUnits)
      })
    } else if (askAddress === PTON_ADDRESS) {
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

    return {
      fee: quoteResult.fee,
      tokenInAmount: BigInt(offerUnits),
      tokenOutAmount: BigInt(askUnits)
    }
  }
}