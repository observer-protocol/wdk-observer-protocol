# Tether WDK Integration for Observer Protocol

Mainnet beta integration between Tether's Wallet Development Kit (WDK) and Observer Protocol, enabling self-custodial USDT and Bitcoin payments with cryptographic identity verification.

## Features

- **Self-custodial wallets**: No third-party custody of funds
- **Multi-chain support**: Ethereum, Polygon, and Bitcoin
- **USDT transfers**: Native USDT support on EVM chains
- **Bilateral verification**: Verify both sender and recipient identities before payment
- **ARP compatible**: Full Agent Reporting Protocol integration for reputation tracking

## Installation

```bash
npm install @observerprotocol/sdk
npm install @tetherto/wdk @tetherto/wdk-wallet-evm @tetherto/wdk-wallet-btc
```

## Quick Start

```javascript
import { AgentWallet } from '@observerprotocol/sdk';

// Initialize wallet with seed phrase
const wallet = new AgentWallet({
  seedPhrase: process.env.WDK_SEED_PHRASE,
  agentId: 'my-agent-001',
  alias: 'trading-bot-alpha'
});

// Initialize WDK
await wallet.initializeWDK();

// Initialize chain wallets
const ethWallet = await wallet.initWallet('ethereum');
const polyWallet = await wallet.initWallet('polygon');
const btcWallet = await wallet.initWallet('bitcoin');

console.log('ETH:', ethWallet.address);
console.log('BTC:', btcWallet.address);
```

## Sending Payments

### Verified Send (Bilateral Verification)

Send payments only to verified agents registered on Observer Protocol:

```javascript
const payment = await wallet.verifiedSend({
  recipientAlias: 'merchant-bot-beta',
  amount: '10.00',
  chain: 'polygon',
  token: 'USDT'
});

console.log('Transaction hash:', payment.payment.txid);
```

### Direct Send

Send to any address without verification:

```javascript
const result = await wallet.send({
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  amount: '5.00',
  chain: 'ethereum',
  token: 'USDT'
});
```

## Settlement Verification

Verify transactions on-chain and submit to ARP:

```javascript
import { WDKVerificationAdapter } from '@observerprotocol/sdk';

const adapter = new WDKVerificationAdapter();

// Verify transaction
const verification = await adapter.verifyTransaction(
  'polygon',
  payment.payment.txid,
  { recipient: '0x...', amount: '10.00', token: 'USDT' }
);

// Format for ARP
const arpEvent = adapter.formatForARP(verification, paymentDetails);

// Submit to Observer Protocol
await adapter.submitToObserver(agentId, apiKey, arpEvent);
```

## Configuration

### Environment Variables

```bash
# Required
WDK_SEED_PHRASE="your twelve word seed phrase here"

# Optional - Custom RPC endpoints
ETHEREUM_RPC_URL="https://your-ethereum-node.com"
POLYGON_RPC_URL="https://your-polygon-node.com"

# Optional - Block explorer API keys
ETHERSCAN_API_KEY="your-etherscan-key"
POLYGONSCAN_API_KEY="your-polygonscan-key"
```

### USDT Contract Addresses

- **Ethereum Mainnet**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Polygon Mainnet**: `0xc2132D05D31c914a87C6611C10748AEb04B58e8F`
- **Ethereum Sepolia**: `0xE9F183FCA0D6868E1F026A31E9AE3C64BE1D7ed3`

## Test

Run the integration test:

```bash
cd observer-protocol/core
node test-wdk-integration.mjs
```

## Protocol Identifier

For ARP events, use protocol: `tether_wdk`

Settlement reference format: `wdk:{chain}:{tx_hash}`

Example: `wdk:ethereum:0x1234567890abcdef...`

## Security Notes

1. **Seed phrases**: Store securely using environment variables or KMS
2. **Private keys**: Never logged or stored externally - kept in memory only
3. **Provider connections**: Use your own RPC endpoints in mainnet beta
4. **Transaction verification**: Always verify on-chain before considering complete

## Supported Chains

| Chain | Native Token | USDT | Notes |
|-------|-------------|------|-------|
| Ethereum | ETH | ✅ | Higher fees, max security |
| Polygon | MATIC | ✅ | Low fees, fast finality |
| Bitcoin | BTC | N/A | Native Bitcoin only |

## License

MIT
