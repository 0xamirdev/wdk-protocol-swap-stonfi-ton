'use strict'

import test from 'brittle'
import { StonApiClient } from '@ston-fi/api'
import StonfiProtocolTon from '../index.js'

// Using a real, valid TON mainnet contract address to bypass @ton/core checksum verification
const mockRouterInfo = {
  address: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
  ptonMasterAddress: 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU',
  majorVersion: 2,
  minorVersion: 1
}

const originalSimulateSwap = StonApiClient.prototype.simulateSwap
const originalSimulateReverseSwap = StonApiClient.prototype.simulateReverseSwap

function setupMocks (simulationResponse) {
  StonApiClient.prototype.simulateSwap = async () => simulationResponse
  StonApiClient.prototype.simulateReverseSwap = async () => simulationResponse
}

function restoreMocks () {
  StonApiClient.prototype.simulateSwap = originalSimulateSwap
  StonApiClient.prototype.simulateReverseSwap = originalSimulateReverseSwap
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
    sendTransaction: async (tx) => {
      t.ok(tx.to)
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
      t.ok(tx.to)
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