```markdown
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
- 🧪 **TAP-Compliant Testing**: 15 offline unit tests using the official `brittle` test framework with 100% core path coverage.
- 🔐 **Security Hardened**: Strict `@ton/core` CRC16 address validation, input sanitization (trim), slippage bounds checking, `swapMaxFee` enforcement, and recipient address verification.
- 📋 **WDK Manager Integration**: Exposes `getProtocolInfo()` metadata for seamless registration with the WDK core orchestrator.

---

## 📦 Installation

Install the package via npm inside your WDK project:

```bash
npm install wdk-protocol-swap-stonfi-ton
```

---

⚙️ Configuration & Initialization

This protocol requires a valid, initialized WDK TON wallet account to interact with on-chain resources.

```javascript
import { WalletAccountTon } from '@tetherto/wdk-wallet-ton'
import StonfiProtocolTon from 'wdk-protocol-swap-stonfi-ton'

// Instantiate your TON wallet account
const account = new WalletAccountTon(seedPhrase, "0'/0/0")

// Initialize the Ston.fi swap protocol
const stonfiProtocol = new StonfiProtocolTon(account, {
  tonRpcEndpoint: 'https://toncenter.com/api/v2/jsonRPC', // Optional RPC endpoint fallback
  slippageTolerance: '0.01', // Optional: 1% slippage tolerance (default)
  swapMaxFee: 500000000n // Optional: maximum fee cap in nanotons
})
```

---

💡 Usage Examples

1. Perform a TON to Jetton Swap (Exact Input Amount)

Sell exactly 1 TON to buy native wrapped USDT.

```javascript
const result = await stonfiProtocol.swap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR', // USDT Master on TON
  tokenInAmount: 1000000000n // 1 TON in nanotons (9 decimals)
})

console.log('✔ Transaction Hash:', result.hash)
console.log('✔ Network Fee Paid:', result.fee.toString())
console.log('✔ Output Tokens Received:', result.tokenOutAmount.toString())
```

2. Swap Jettons for TON (Exact Output Amount)

Buy exactly 2 TON by selling the equivalent value in USDT.

```javascript
const result = await stonfiProtocol.swap({
  tokenIn: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR', // USDT
  tokenOut: 'ton',
  tokenOutAmount: 2000000000n // Buy exactly 2 TON
})
```

3. Retrieve Real-Time Pricing Quote

Always fetch rates, optimal routes, and transaction fee predictions before broadcasting.

```javascript
const quote = await stonfiProtocol.quoteSwap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR',
  tokenInAmount: 1000000000n
})

console.log(`Rate: 1 TON yields ${quote.tokenOutAmount} USDT`)
console.log(`Estimated contract gas fee: ${quote.fee} nanotons`)
```

4. Retrieve Protocol Metadata

Query protocol metadata for WDK Manager registration or UI discovery.

```javascript
const info = stonfiProtocol.getProtocolInfo()
console.log(info)
// {
//   name: 'StonfiProtocolTon',
//   version: '1.0.0-beta.1',
//   chain: 'ton',
//   supports: ['swap', 'quote'],
//   dex: 'ston.fi',
//   dexVersions: ['v1', 'v2.1']
// }
```

---

🛠️ API Reference

StonfiProtocolTon Class

Extends WDK's standard `SwapProtocol` class.

Method	Parameters	Return Type	Description	
`constructor`	`account`, `config`	`StonfiProtocolTon`	Initializes a new interface instance.	
`swap`	`options`	`Promise<SwapResult>`	Executes an on-chain token swap transaction.	
`quoteSwap`	`options`	`Promise<Omit<SwapResult, 'hash'>>`	Generates execution quote, estimated output, and gas fee.	
`getProtocolInfo`	—	`ProtocolMetadata`	Returns protocol metadata for WDK Manager integration.	

SwapOptions Structure

Field	Type	Required	Description	
`tokenIn`	`string`	Yes	Contract address of input token or `'ton'`	
`tokenOut`	`string`	Yes	Contract address of output token or `'ton'`	
`to`	`string`	No	Destination recipient address (defaults to sender; must match sender for Ston.fi)	
`tokenInAmount`	`bigint`	Optional	Exact input amount to swap (exclusive with `tokenOutAmount`)	
`tokenOutAmount`	`bigint`	Optional	Exact output amount to buy (exclusive with `tokenInAmount`)	

Error Classes

Error	Code	Trigger	
`SwapMaxFeeExceededError`	`SWAP_MAX_FEE_EXCEEDED`	Estimated fee exceeds configured `swapMaxFee`	
`InvalidTokenAddressError`	`INVALID_TOKEN_ADDRESS`	Token address fails `@ton/core` CRC16 validation	
`ReadOnlyAccountError`	`READ_ONLY_ACCOUNT_ERROR`	Account lacks `sendTransaction` capability	
`SwapValidationError`	`SWAP_VALIDATION_ERROR`	Invalid input: zero/negative amount, both amounts, invalid slippage, mismatched recipient, unsupported TON→TON	

---

🧪 Testing

This module ships with robust, offline unit-testing coverage built specifically with `brittle`.

Run the testing suite:

```bash
npm test
```

Expected output:

```text
# tests = 15/15 pass
# asserts = 39/39 pass
```

---

📄 License

This project is licensed under the Apache License, Version 2.0 (Apache-2.0). See the LICENSE file for details.

```