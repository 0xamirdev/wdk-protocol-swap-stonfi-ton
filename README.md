# @tetherto/wdk-protocol-swap-stonfi-ton

[![NPM Version](https://img.shields.io/npm/v/wdk-protocol-swap-stonfi-ton.svg)](https://npmjs.org/package/wdk-protocol-swap-stonfi-ton)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Runtime: Bare Compatibility](https://img.shields.io/badge/Runtime-Bare_Compatible-success.svg)](#)
[![WDK Version Compatibility](https://img.shields.io/badge/WDK_Wallet-1.0.0--beta.1-orange.svg)](https://docs.wallet.tether.io)

An enterprise-grade, high-performance **WDK Swap Protocol** implementation for the **TON (The Open Network)** blockchain, leveraging the **Ston.fi DEX (V1 & V2.1)**. This module enables any WDK-compatible wallet account (such as `@tetherto/wdk-wallet-ton`) to execute trustless, non-custodial swaps and simulate exchange quotes in both Node.js and lightweight Bare runtimes.

---

## 🚀 Features

- 🔄 **Comprehensive Swapping Capabilities**: Seamlessly execute TON-to-Jetton, Jetton-to-TON, and Jetton-to-Jetton swap paths.
- 🛣️ **Dynamic Router Discovery**: Automatically queries the official Ston.fi REST API to calculate and fetch the optimal swap route across V1/V2 contract pools.
- ⚡ **Bare Runtime Native**: Developed with strict zero-node-dependency patterns to ensure lightweight execution in Bare runtime environments.
- 🧪 **TAP-Compliant Testing**: Unit tests written using the official `brittle` test framework with fully mocked simulation vectors.
- 🔐 **Security Hardened**: Explicit verification of all address structures using strict `@ton/core` CRC16 checksum evaluation.

---

## 📦 Installation

Install the package via npm inside your WDK project:

```bash
npm install wdk-protocol-swap-stonfi-ton

⚙️ Configuration & Initialization

This protocol requires a valid, initialized WDK TON wallet account to interact
with on-chain resources.

import { WalletAccountTon } from '@tetherto/wdk-wallet-ton'
import StonfiProtocolTon from 'wdk-protocol-swap-stonfi-ton'

// Instantiate your TON wallet account
const account = new WalletAccountTon(seedPhrase, "0'/0/0")

// Initialize the Ston.fi swap protocol
const stonfiProtocol = new StonfiProtocolTon(account, {
  tonRpcEndpoint: 'https://toncenter.com/api/v2/jsonRPC' // Optional RPC endpoint fallback
})

💡 Usage Examples

1. Perform a TON to Jetton Swap (Exact Input Amount)

Sell exactly 1 TON to buy native wrapped USDT.

const result = await stonfiProtocol.swap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR', // USDT Master on TON
  tokenInAmount: 1000000000n // 1 TON in nanotons (9 decimals)
})

console.log('✔ Transaction Hash:', result.hash)
console.log('✔ Network Fee Paid:', result.fee.toString())
console.log('✔ Output Tokens Received:', result.tokenOutAmount.toString())

2. Swap Jettons for TON (Exact Output Amount)

Buy exactly 2 TON by selling the equivalent value in USDT.

const result = await stonfiProtocol.swap({
  tokenIn: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8paR', // USDT
  tokenOut: 'ton',
  tokenOutAmount: 2000000000n // Buy exactly 2 TON
})

3. Retrieve Real-Time Pricing Quote

Always fetch rates, optimal routes, and transaction fee predictions before
broadcasting.

const quote = await stonfiProtocol.quoteSwap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8paR',
  tokenInAmount: 1000000000n
})

console.log(`Rate: 1 TON yields ${quote.tokenOutAmount} USDT`)
console.log(`Estimated contract gas fee: ${quote.fee} nanotons`)

🛠️ API Reference

StonfiProtocolTon Class

Extends WDK's standard SwapProtocol class.

| Method        | Parameters          | Return Type                         | Description                                               |
| :------------ | :------------------ | :---------------------------------- | :-------------------------------------------------------- |
| `constructor` | `account`, `config` | `StonfiProtocolTon`                 | Initializes a new interface instance.                     |
| `swap`        | `options`           | `Promise<SwapResult>`               | Executes an on-chain token swap transaction.              |
| `quoteSwap`   | `options`           | `Promise<Omit<SwapResult, 'hash'>>` | Generates execution quote, estimated output, and gas fee. |

SwapOptions Structure

| Field            | Type     | Required   | Description                                                  |
| :--------------- | :------- | :--------- | :----------------------------------------------------------- |
| `tokenIn`        | `string` | **Yes**    | Contract address of input token or `'ton'`                   |
| `tokenOut`       | `string` | **Yes**    | Contract address of output token or `'ton'`                  |
| `to`             | `string` | *No*       | Destination recipient address (defaults to sender)           |
| `tokenInAmount`  | `bigint` | *Optional* | Exact input amount to swap (exclusive with `tokenOutAmount`) |
| `tokenOutAmount` | `bigint` | *Optional* | Exact output amount to buy (exclusive with `tokenInAmount`)  |

🧪 Testing

This module ships with robust, offline unit-testing coverage built specifically
with Brittle.

Run the testing suite:

npm test

📄 License

This project is licensed under the Apache License, Version 2.0 (Apache-2.0). See
the LICENSE file for details.