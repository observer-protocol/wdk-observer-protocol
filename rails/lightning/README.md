# Lightning/L402 Rail

The Lightning Rail enables Observer Protocol agents to interact with the Bitcoin Lightning Network via the L402 protocol (formerly LSAT).

## Overview

L402 is a protocol standard for authentication and payment on the internet, combining macaroons for authentication with Lightning Network payments. This rail allows agents to:

- **Send payments** over Lightning Network
- **Receive payments** via L402-protected endpoints
- **Verify L402 tokens** cryptographically
- **Integrate with Observer Protocol** for bilateral identity verification

## Architecture

```
Agent A (Sender)                 Lightning Network              Agent B (Recipient)
     │                                    │                              │
     ├──[1. Request service]─────────────▶│                              │
     │◀──[2. 402 Payment Required]────────┤                              │
     │     + L402 macaroon                │                              │
     │                                    │                              │
     ├──[3. Verify recipient via OP]──────┼─────────────────────────────▶│
     │◀──[4. Recipient identity confirmed]┤                              │
     │                                    │                              │
     ├──[5. Pay invoice via Lightning]────┼─────────────────────────────▶│
     │                                    │                              │
     ├──[6. Present L402 token]──────────▶│                              │
     │◀──[7. Access granted]──────────────┤                              │
```

## Key Concepts

### L402 Protocol Flow

1. **Service Request** - Agent requests a protected resource
2. **402 Response** - Server responds with payment required + macaroon
3. **Payment** - Agent pays the Lightning invoice
4. **Token Presentation** - Agent presents proof-of-payment macaroon
5. **Access** - Server verifies and grants access

### Bilateral Verification

Before executing an L402 payment:
- Sender verifies their own identity on Observer Protocol
- Sender looks up and verifies recipient's identity
- Payment only proceeds if both identities are confirmed

## Integration with Observer Protocol

The Lightning Rail works with the core Observer Protocol primitives:

- `AgentWallet` - Manages Lightning node connection
- `ObserverClient` - Verifies identities on-chain
- `VerifiedPayment` - Ensures bilateral verification before payment

## Usage

```javascript
import { AgentWallet } from '@observer-protocol/core';

const wallet = new AgentWallet({
  lightning: {
    nodeUri: '03d93f27052c55ca636442f5b3432598978016738cd1cb4bd18705f1eb4552896f@localhost:9735',
    macaroon: '/path/to/admin.macaroon'
  }
});

// Send verified Lightning payment
await wallet.verifiedLightningSend({
  recipientAlias: 'maxi-0001',
  amountSats: 1000,
  memo: 'Payment for API access'
});
```

## Configuration

```env
# Lightning Node Configuration
LIGHTNING_NODE_PUBKEY=03d93f27052c55ca636442f5b3432598978016738cd1cb4bd18705f1eb4552896f
LIGHTNING_RPC_HOST=localhost:10009
LIGHTNING_MACAROON_PATH=/path/to/admin.macaroon
LIGHTNING_TLS_CERT_PATH=/path/to/tls.cert

# L402 Settings
L402_DEFAULT_TIMEOUT=30000
L402_MAX_PAYMENT_MSATS=10000000
```

## Network Support

- **Bitcoin Mainnet** - Mainnet beta payments
- **Bitcoin Testnet** - Development and testing
- **Regtest** - Local development

## References

- [L402 Protocol Specification](https://docs.lightning.engineering/the-lightning-network/l402)
- [Lightning Labs Documentation](https://lightning.engineering/)
- [Observer Protocol Core](../core/)

---

*Part of the Observer Protocol Rails Architecture*
