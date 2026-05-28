'use strict'

import StonfiProtocolTon from './index.js'

// Mock WDK Wallet Account for Demo simulation
class MockWalletAccount {
  constructor (address) {
    this.address = address
  }

  async getAddress () {
    return this.address
  }

  // Simulates broadcasting the generated payload
  async sendTransaction (tx) {
    console.log('\n--- Simulated Transaction Broadcast ---')
    console.log('Sending transaction payload to:', tx.to)
    console.log('Transaction Value (nanotons):', tx.value.toString())
    console.log('Payload Cell (BOC) compiled successfully!')
    return {
      hash: 'mock_tx_hash_' + Math.random().toString(36).substring(2, 15),
      fee: 50000000n // 0.05 TON
    }
  }

  // Simulates querying the transaction costs
  async quoteSendTransaction (tx) {
    return {
      fee: 20000000n // 0.02 TON
    }
  }
}

async function runDemo () {
  console.log('====================================================')
  console.log('  WDK Ston.fi Swap Protocol Demo (TON Blockchain)   ')
  console.log('====================================================')

  // Real, valid contract address to avoid checksum failures
  const userAddress = 'EQBv2cEJ-T-1GNRdzaY_JYoJvpAISuFHOKmJZPQnoUqEHTlU'
  const account = new MockWalletAccount(userAddress)

  // Initialize the protocol
  const stonfiProtocol = new StonfiProtocolTon(account)

  // Token configuration: Native TON & Official USDT Master Address on TON Mainnet
  const tonAddress = 'ton'
  const usdtAddress = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'

  try {
    console.log('\n1. Fetching Live Quote: Swapping 1 TON to USDT...')
    const quoteOptions = {
      tokenIn: tonAddress,
      tokenOut: usdtAddress,
      tokenInAmount: 1000000000n // 1 TON (9 decimals)
    }

    const quote = await stonfiProtocol.quoteSwap(quoteOptions)
    console.log('----------------------------------------------------')
    console.log('✔ Live Quote Retrieved Successfully!')
    console.log('- Offer Amount: 1.00 TON')

    // USDT has 6 decimals on TON blockchain
    const expectedUsdt = Number(quote.tokenOutAmount) / 1e6
    console.log(`- Expected Return: ${expectedUsdt.toFixed(4)} USDT`)
    console.log(`- Estimated Gas Fee: ${Number(quote.fee) / 1e9} TON`)

    console.log('\n2. Simulating Swap Transaction (TON -> USDT)...')
    const swapOptions = {
      tokenIn: tonAddress,
      tokenOut: usdtAddress,
      tokenInAmount: 1000000000n
    }

    const swapResult = await stonfiProtocol.swap(swapOptions)
    console.log('----------------------------------------------------')
    console.log('✔ Swap Simulation Complete!')
    console.log(`- Transaction Hash: ${swapResult.hash}`)
    console.log(`- Total Fee: ${Number(swapResult.fee) / 1e9} TON`)
    console.log('- Tokens Sold: 1.00 TON')
    console.log(`- Tokens Bought: ${(Number(swapResult.tokenOutAmount) / 1e6).toFixed(4)} USDT`)
    console.log('====================================================')
  } catch (error) {
    console.error('Demo Error:', error.message)
  }
}

runDemo()
