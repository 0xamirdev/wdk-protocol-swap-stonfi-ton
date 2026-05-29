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

import test from 'brittle'
import { StonApiClient } from '@ston-fi/api'
import { TonClient } from '@ton/ton'
import { Address, Cell } from '@ton/core'
import StonfiProtocolTon, {
  SwapMaxFeeExceededError,
  InvalidTokenAddressError,
  ReadOnlyAccountError
} from '../src/stonfi-protocol-ton.js'

const mockRouterInfo = {
  address: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
  ptonMasterAddress: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
  majorVersion: 2,
  minorVersion: 1
}

const originalSimulateSwap = StonApiClient.prototype.simulateSwap
const originalSimulateReverseSwap = StonApiClient.prototype.simulateReverseSwap
const originalOpen = TonClient.prototype.open

function setupMocks (simulationResponse) {
  StonApiClient.prototype.simulateSwap = async () => simulationResponse
  StonApiClient.prototype.simulateReverseSwap = async () => simulationResponse

  TonClient.prototype.open = function () {
    return {
      getSwapTonToJettonTxParams: async () => {
        return {
          to: Address.parse('EQBxLXXN7xdciY11ZQi8X-rT8dxiUrdGtTc_niiczbf8ixKa'),
          value: 100000000n,
          body: Cell.EMPTY
        }
      },
      getSwapJettonToTonTxParams: async () => {
        return {
          to: Address.parse('EQBxLXXN7xdciY11ZQi8X-rT8dxiUrdGtTc_niiczbf8ixKa'),
          value: 100000000n,
          body: Cell.EMPTY
        }
      },
      getSwapJettonToJettonTxParams: async () => {
        return {
          to: Address.parse('EQBxLXXN7xdciY11ZQi8X-rT8dxiUrdGtTc_niiczbf8ixKa'),
          value: 100000000n,
          body: Cell.EMPTY
        }
      }
    }
  }
}

function restoreMocks () {
  StonApiClient.prototype.simulateSwap = originalSimulateSwap
  StonApiClient.prototype.simulateReverseSwap = originalSimulateReverseSwap
  TonClient.prototype.open = originalOpen
}

test('StonfiProtocolTon - TON to Jetton swap', async (t) => {
  setupMocks({
    router: mockRouterInfo,
    offerUnits: '1000000',
    askUnits: '2000000',
    minAskUnits: '1980000'
  })

  const account = {
    getAddress: async () => 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    quoteSendTransaction: async () => ({ fee: 100000n }),
    sendTransaction: async (tx) => {
      t.is(tx.to, 'EQBxLXXN7xdciY11ZQi8X-rT8dxiUrdGtTc_niiczbf8ixKa')
      t.ok(tx.value)
      t.ok(tx.body)
      return {
        hash: 'mock-tx-hash-1',
        fee: 500000n
      }
    }
  }

  const protocol = new StonfiProtocolTon(account)
  const result = await protocol.swap({
    tokenIn: 'ton',
    tokenOut: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    tokenInAmount: 1000000n
  })

  t.is(result.hash, 'mock-tx-hash-1')
  t.is(result.fee, 500000n)
  t.is(result.tokenInAmount, 1000000n)
  t.is(result.tokenOutAmount, 2000000n)

  restoreMocks()
})

test('StonfiProtocolTon - Jetton to TON swap', async (t) => {
  setupMocks({
    router: mockRouterInfo,
    offerUnits: '2000000',
    askUnits: '1000000',
    minAskUnits: '990000'
  })

  const account = {
    getAddress: async () => 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    quoteSendTransaction: async () => ({ fee: 100000n }),
    sendTransaction: async (tx) => {
      t.is(tx.to, 'EQBxLXXN7xdciY11ZQi8X-rT8dxiUrdGtTc_niiczbf8ixKa')
      t.ok(tx.value)
      t.ok(tx.body)
      return {
        hash: 'mock-tx-hash-2',
        fee: 600000n
      }
    }
  }

  const protocol = new StonfiProtocolTon(account)
  const result = await protocol.swap({
    tokenIn: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    tokenOut: 'ton',
    tokenInAmount: 2000000n
  })

  t.is(result.hash, 'mock-tx-hash-2')
  t.is(result.fee, 600000n)
  t.is(result.tokenInAmount, 2000000n)
  t.is(result.tokenOutAmount, 1000000n)

  restoreMocks()
})

test('StonfiProtocolTon - quoteSwap', async (t) => {
  setupMocks({
    router: mockRouterInfo,
    offerUnits: '1000000',
    askUnits: '2000000',
    minAskUnits: '1980000'
  })

  const account = {
    getAddress: async () => 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    quoteSendTransaction: async (tx) => {
      t.is(tx.to, 'EQBxLXXN7xdciY11ZQi8X-rT8dxiUrdGtTc_niiczbf8ixKa')
      t.ok(tx.value)
      t.ok(tx.body)
      return {
        fee: 150000n
      }
    }
  }

  const protocol = new StonfiProtocolTon(account)
  const result = await protocol.quoteSwap({
    tokenIn: 'ton',
    tokenOut: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    tokenInAmount: 1000000n
  })

  t.is(result.fee, 150000n)
  t.is(result.tokenInAmount, 1000000n)
  t.is(result.tokenOutAmount, 2000000n)

  restoreMocks()
})

test('StonfiProtocolTon - Reverse Swap (exact output)', async (t) => {
  setupMocks({
    router: mockRouterInfo,
    offerUnits: '3000000',
    askUnits: '4000000',
    minAskUnits: '3960000'
  })

  const account = {
    getAddress: async () => 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    quoteSendTransaction: async () => ({ fee: 100000n }),
    sendTransaction: async () => ({ hash: 'mock-tx-hash-reverse', fee: 500000n })
  }

  const protocol = new StonfiProtocolTon(account)
  const result = await protocol.swap({
    tokenIn: 'ton',
    tokenOut: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    tokenOutAmount: 4000000n
  })

  t.is(result.tokenInAmount, 3000000n)
  t.is(result.tokenOutAmount, 4000000n)

  restoreMocks()
})

test('StonfiProtocolTon - SwapMaxFeeExceededError', async (t) => {
  setupMocks({
    router: mockRouterInfo,
    offerUnits: '1000000',
    askUnits: '2000000',
    minAskUnits: '1980000'
  })

  const account = {
    getAddress: async () => 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
    quoteSendTransaction: async () => ({ fee: 999999n })
  }

  const protocol = new StonfiProtocolTon(account, { swapMaxFee: 500000n })

  await t.exception(async () => {
    await protocol.quoteSwap({
      tokenIn: 'ton',
      tokenOut: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
      tokenInAmount: 1000000n
    })
  }, SwapMaxFeeExceededError)

  restoreMocks()
})

test('StonfiProtocolTon - InvalidTokenAddressError', async (t) => {
  const account = {
    getAddress: async () => 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU'
  }

  const protocol = new StonfiProtocolTon(account)

  await t.exception(async () => {
    await protocol.quoteSwap({
      tokenIn: 'invalid-address-format-abc',
      tokenOut: 'ton',
      tokenInAmount: 1000000n
    })
  }, InvalidTokenAddressError)
})

test('StonfiProtocolTon - ReadOnlyAccountError', async (t) => {
  const account = {
    getAddress: async () => 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU'
  }

  const protocol = new StonfiProtocolTon(account)

  await t.exception(async () => {
    await protocol.swap({
      tokenIn: 'ton',
      tokenOut: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
      tokenInAmount: 1000000n
    })
  }, ReadOnlyAccountError)
})