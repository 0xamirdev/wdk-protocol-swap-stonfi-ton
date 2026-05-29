# @tetherto/wdk-protocol-swap-stonfi-ton

<div align="center">

[![NPM Version](https://img.shields.io/npm/v/wdk-protocol-swap-stonfi-ton.svg)](https://npmjs.org/package/wdk-protocol-swap-stonfi-ton)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Runtime](https://img.shields.io/badge/Runtime-Bare_Compatible-success.svg)](#)
[![WDK](https://img.shields.io/badge/WDK_Wallet-1.0.0--beta.1-orange.svg)](https://docs.wallet.tether.io)

Enterprise-grade **WDK Swap Protocol** implementation for the **TON (The Open Network)** blockchain using **STON.fi (V1 & V2.1)**.

Built for secure, non-custodial swaps and quote simulation inside both **Node.js** and lightweight **Bare Runtime** environments.

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔄 Swap Support | TON ↔ Jetton and Jetton ↔ Jetton swaps |
| 🛣 Smart Routing | Automatically discovers the best route using STON.fi REST API |
| ⚡ Bare Runtime Compatible | Zero heavy Node.js dependencies |
| 🧪 Offline Testing | `brittle`-based unit tests with full core-path coverage |
| 🔐 Security Hardened | Address validation, slippage checks, fee limits, recipient verification |
| 📋 WDK Integration | Supports WDK Manager metadata discovery |

---

# 📦 Installation

Install the package inside your WDK project:

```bash
npm install wdk-protocol-swap-stonfi-ton

---

⚙️ Configuration & Initialization

This protocol requires a valid initialized TON wallet account.

import { WalletAccountTon } from '@tetherto/wdk-wallet-ton'
import StonfiProtocolTon from 'wdk-protocol-swap-stonfi-ton'

// Initialize TON wallet account
const account = new WalletAccountTon(seedPhrase, "0'/0/0")

// Initialize protocol
const stonfiProtocol = new StonfiProtocolTon(account, {
  tonRpcEndpoint: 'https://toncenter.com/api/v2/jsonRPC',
  slippageTolerance: '0.01',
  swapMaxFee: 500000000n
})

---

🚀 Usage Examples

1️⃣ TON → Jetton Swap

Swap exactly "1 TON" into wrapped USDT.

const result = await stonfiProtocol.swap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR',
  tokenInAmount: 1000000000n
})

console.log('Transaction Hash:', result.hash)
console.log('Fee Paid:', result.fee.toString())
console.log('Received:', result.tokenOutAmount.toString())

---

2️⃣ Jetton → TON Swap

Buy exactly "2 TON" using USDT.

const result = await stonfiProtocol.swap({
  tokenIn: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR',
  tokenOut: 'ton',
  tokenOutAmount: 2000000000n
})

---

3️⃣ Quote Simulation

Retrieve estimated output amount and fees before executing a transaction.

const quote = await stonfiProtocol.quoteSwap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR',
  tokenInAmount: 1000000000n
})

console.log(`Output: ${quote.tokenOutAmount}`)
console.log(`Estimated Fee: ${quote.fee}`)

---

4️⃣ Protocol Metadata

Retrieve WDK protocol metadata.

const info = stonfiProtocol.getProtocolInfo()

console.log(info)

Example output:

{
  name: 'StonfiProtocolTon',
  version: '1.0.0-beta.1',
  chain: 'ton',
  supports: ['swap', 'quote'],
  dex: 'ston.fi',
  dexVersions: ['v1', 'v2.1']
}

---

🛠 API Reference

"StonfiProtocolTon"

Extends the standard WDK "SwapProtocol" class.

Methods

Method| Parameters| Return Type| Description
"constructor"| "account", "config"| "StonfiProtocolTon"| Initialize protocol instance
"swap"| "options"| "Promise<SwapResult>"| Execute token swap
"quoteSwap"| "options"| "Promise<Omit<SwapResult, 'hash'>>"| Simulate swap quote
"getProtocolInfo"| —| "ProtocolMetadata"| Retrieve protocol metadata

---

SwapOptions

Field| Type| Required| Description
"tokenIn"| "string"| ✅| Input token address or "'ton'"
"tokenOut"| "string"| ✅| Output token address or "'ton'"
"to"| "string"| ❌| Recipient address
"tokenInAmount"| "bigint"| Optional| Exact input amount
"tokenOutAmount"| "bigint"| Optional| Exact output amount

---

❌ Error Classes

Error| Code| Description
"SwapMaxFeeExceededError"| "SWAP_MAX_FEE_EXCEEDED"| Fee exceeded configured limit
"InvalidTokenAddressError"| "INVALID_TOKEN_ADDRESS"| Invalid TON address
"ReadOnlyAccountError"| "READ_ONLY_ACCOUNT_ERROR"| Account cannot send transactions
"SwapValidationError"| "SWAP_VALIDATION_ERROR"| Invalid swap input

---

🧪 Testing

This module includes offline unit testing using "brittle".

Run the test suite:

npm test

Expected output:

# tests = 15/15 pass
# asserts = 39/39 pass

---

🏗 Project Structure

src/
├── protocol/
├── utils/
├── errors/
├── types/
└── index.ts

test/
└── protocol.test.ts

---

🔐 Security Notes

This module includes multiple security protections:

- CRC16 TON address validation
- Slippage bounds enforcement
- Fee cap validation
- Input sanitization
- Recipient verification
- Read-only account detection

---

📚 Resources

- WDK Documentation
  https://docs.wallet.tether.io

- STON.fi
  https://ston.fi

- TON Blockchain
  https://ton.org

---

📄 License

Licensed under the Apache License 2.0.

See the ""LICENSE"" (./LICENSE) file for details.
