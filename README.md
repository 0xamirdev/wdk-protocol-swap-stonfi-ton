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
|---------|-------------|
| 🔄 Swap Support | TON ↔ Jetton and Jetton ↔ Jetton swaps |
| 🛣 Smart Routing | Automatically discovers the best route using STON.fi REST API |
| ⚡ Bare Runtime Compatible | Zero heavy Node.js dependencies |
| 🧪 Offline Testing | `brittle`-based unit tests with full core-path coverage |
| 🔐 Security Hardened | Address validation, slippage checks, fee limits, recipient verification |
| 📋 WDK Integration | Supports WDK Manager metadata discovery |

---

## 📦 Installation

Install the package inside your WDK project:

```bash
npm install wdk-protocol-swap-stonfi-ton
```

---

## ⚙️ Configuration & Initialization

This protocol requires a valid initialized TON wallet account.

```javascript
import { WalletAccountTon } from '@tetherto/wdk-wallet-ton'
import StonfiProtocolTon from 'wdk-protocol-swap-stonfi-ton'

// Initialize TON wallet account
const account = new WalletAccountTon(seedPhrase, "0'/0/0")

// Initialize protocol
const stonfiProtocol = new StonfiProtocolTon(account, {
  tonRpcEndpoint: 'https://toncenter.com/api/v2/jsonRPC',
  slippageTolerance: 0.5,          // 0.5% default
  swapMaxFee: 500000000n            // 0.5 TON max fee
})
```

---

## 🚀 Usage Examples

### 1️⃣ TON → Jetton Swap

Swap exactly "1 TON" into wrapped USDT.

```javascript
const result = await stonfiProtocol.swap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR',
  tokenInAmount: 1000000000n
})

console.log('Transaction Hash:', result.hash)
console.log('Fee Paid:', result.fee.toString())
console.log('Received:', result.tokenOutAmount.toString())
```
### 2️⃣ Jetton → TON Swap

Buy exactly "2 TON" using USDT.

```javascript
const result = await stonfiProtocol.swap({
  tokenIn: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR',
  tokenOut: 'ton',
  tokenOutAmount: 2000000000n
})
```

### 3️⃣ Quote Simulation

Retrieve estimated output amount and fees before executing a transaction.

```javascript
const quote = await stonfiProtocol.quoteSwap({
  tokenIn: 'ton',
  tokenOut: 'EQCxE6mUtXCcTKVVGvEv_8HP_U88H_0HDN8aHDN8aHDN8paR',
  tokenInAmount: 1000000000n
})

console.log(`Output: ${quote.tokenOutAmount}`)
console.log(`Estimated Fee: ${quote.fee}`)
```

### 4️⃣ Protocol Metadata

Retrieve WDK protocol metadata.

```javascript
const info = stonfiProtocol.getProtocolInfo()
console.log(info)
```

Example output:

```json
{
  "name": "StonfiProtocolTon",
  "chain": "ton",
  "dex": "ston.fi",
  "supports": ["swap", "quote"],
  "dexVersions": ["v1", "v2.1"]
}
```

---

## 🛠 API Reference

### StonfiProtocolTon

Extends the standard WDK SwapProtocol class.

### Constructor

```typescript
constructor(account: IWalletAccount | IWalletAccountReadOnly, config?: StonfiProtocolConfig)
```

### Methods

| Method | Parameters | Return Type | Description |
|----------|----------|----------|----------|
| `swap` | `options: StonfiSwapOptions` | `Promise<StonfiSwapResult>` | Execute token swap |
| `quoteSwap` | `options: StonfiSwapOptions` | `Promise<StonfiQuoteResult>` | Simulate swap quote |
| `getProtocolInfo` | none | `ProtocolMetadata` | Retrieve protocol metadata |

### StonfiProtocolConfig

| Field | Type | Default | Description |
|----------|----------|----------|----------|
| `swapMaxFee` | `number \| bigint` | `500000000n` | Maximum allowed fee (nanotons) |
| `tonRpcEndpoint` | `string` | public endpoint | Custom TON RPC URL |
| `slippageTolerance` | `number` | `0.5` | Slippage tolerance percentage (e.g., 0.5 = 0.5%) |

### StonfiSwapOptions

| Field | Type | Required | Description |
|----------|----------|----------|----------|
| `tokenIn` | `string` | ✅ | Input token address or `ton` |
| `tokenOut` | `string` | ✅ | Output token address or `ton` |
| `to` | `string` | ❌ | Recipient address (defaults to account) |
| `tokenInAmount` | `bigint` | optional* | Exact input amount (nanotons) |
| `tokenOutAmount` | `bigint` | optional* | Exact output amount (nanotons) |
| `slippageTolerance` | `number` | ❌ | Override default slippage |

*Exactly one of `tokenInAmount` or `tokenOutAmount` must be provided.*

### StonfiSwapResult

| Field | Type | Description |
|----------|----------|----------|
| `hash` | `string` | Transaction hash |
| `fee` | `bigint` | Total fee paid (nanotons) |
| `tokenInAmount` | `bigint` | Actual input amount |
| `tokenOutAmount` | `bigint` | Actual output amount |

### StonfiQuoteResult

| Field | Type | Description |
|----------|----------|----------|
| `fee` | `bigint` | Estimated fee (nanotons) |
| `tokenInAmount` | `bigint` | Required input amount |
| `tokenOutAmount` | `bigint` | Expected output amount |
| `minTokenOutAmount` | `bigint` | Minimum output after slippage |
---

## ❌ Error Handling

All errors extend standard `Error` and are exported for `instanceof` checks.

### Error Types

| Error Class | When Thrown |
|------------|------------|
| `SwapMaxFeeExceededError` | Estimated fee > `swapMaxFee` |
| `InvalidTokenAddressError` | Token address format invalid or checksum mismatch |
| `ReadOnlyAccountError` | Attempted `swap()` on read-only account |
| `SwapValidationError` | Invalid parameters (zero amount, same token, missing amount, etc.) |

### Example Error Handling

```javascript
import StonfiProtocolTon, {
  SwapMaxFeeExceededError,
  InvalidTokenAddressError
} from 'wdk-protocol-swap-stonfi-ton'

try {
  await protocol.swap({
    tokenIn: 'ton',
    tokenOut: 'invalid',
    tokenInAmount: 1000000000n
  })
} catch (err) {
  if (err instanceof InvalidTokenAddressError) {
    console.error('Invalid token address:', err.message)
  } else if (err instanceof SwapMaxFeeExceededError) {
    console.error('Fee too high, increase swapMaxFee or try later')
  } else {
    throw err
  }
}
```

---

## ⚠️ Limitations

- Single-hop swaps only – Multi-hop routing is not yet supported (uses STON.fi API which returns direct pools).
- STON.fi v2.1 only – Older pool versions may not be discovered.
- No referral fee management – Referral fees are not automatically distributed.
- Bare Runtime compatibility – Verified with Bare 1.x, but some cryptographic dependencies may require native bindings on certain platforms.
- No swap history – The module does not track past swaps; use WDK's wallet history.

---

## 🔧 Troubleshooting

| Issue | Possible Solution |
|--------|--------|
| Cannot find module `@ton/ton` | Run npm install again or check Node.js version (>=18) |
| `bare` command not found | Install Bare: `npm install -g bare` then `bare example.js` |
| `SwapValidationError: Both amounts provided` | Provide only one of `tokenInAmount` or `tokenOutAmount` |
| `InvalidTokenAddressError` for valid address | Ensure address is raw TON format (starts with EQ or UQ). Spaces are trimmed automatically. |
| Quote returns zero output | Pool may not exist for the pair; try reverse order or check STON.fi liquidity. |
| `ReadOnlyAccountError` on swap | You must use a full `IWalletAccount` (with private key), not `IWalletAccountReadOnly`. |

---

## 🧪 Testing

This module includes offline unit testing using brittle.

### Run the Test Suite

```bash
npm test
```

### Expected Output

```text
# tests = 15/15 pass
# asserts = 39/39 pass
```

---

## 🏗 Project Structure

```text
src/
├── stonfi-protocol-ton.js   # Main protocol class
├── errors.js                # Custom error classes
└── utils.js                 # Address validation, helpers

tests/
└── stonfi-protocol-ton.test.js

types/
├── index.d.ts
└── src/stonfi-protocol-ton.d.ts
```

---

## 🔐 Security Notes

This module includes multiple security protections:

- CRC16 TON address validation (strict mode)
- Slippage bounds enforcement with configurable tolerance
- Fee cap validation against `swapMaxFee`
- Input sanitization (trimming whitespace, normalization)
- Recipient verification – prevents sending to wrong address
- Read-only account detection – prevents accidental writes
- No private key material stored or logged

---

## 📚 Resources

- [WDK Documentation](https://docs.wdk.tether.io)
- [STON.fi Documentation](https://docs.ston.fi)
- [TON Blockchain Documentation](https://docs.ton.org)
- [Brittle Test Framework](https://github.com/holepunchto/brittle)

---
## 🎥 Demo Video
Watch the complete demo video [**here**](https://drive.google.com/file/d/1pOJDGi97uvenpuief7JYRR2iDtUJQfE0/view?usp=drivesdk).

---

## 📄 License

Licensed under the Apache License 2.0.

See the LICENSE file for details.