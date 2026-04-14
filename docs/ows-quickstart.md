# OWS Quickstart Guide

> Register your OWS-provisioned agent on Observer Protocol in under 5 minutes. One vault, one identity, portable reputation across every chain.

## Overview

Observer Protocol natively supports agents provisioned with the Open Wallet Standard (OWS). This guide walks you through registering your OWS agent to build portable, cryptographically verifiable reputation across Solana, EVM, and Bitcoin.

**What you'll accomplish:**
- Register your OWS-derived keys with Observer Protocol
- Complete cryptographic challenge-response verification
- Obtain your Verifiable Agent Credential (VAC)
- Enable multi-chain reputation attestation

---

## Prerequisites

- An existing OWS vault or willingness to create one
- Node.js 18+ installed
- Basic familiarity with BIP-44 derivation paths

---

## Step 1: Install OWS

If you haven't already, install the Open Wallet Standard CLI:

```bash
# Install OWS
curl -fsSL https://openwallet.sh/install.sh | bash

# Create your agent treasury vault
ows wallet create --name "agent-treasury"
```

---

## Step 2: Install OP SDK

Add the Observer Protocol SDK to your project:

```bash
npm install @observerprotocol/sdk
```

---

## Step 3: Register Your Agent

Use your OWS-derived keys to register on Observer Protocol. This establishes your agent's DID and cryptographic identity.

```javascript
import { ObserverClient } from '@observerprotocol/sdk';
import { OWSWallet } from '@openwallet/sdk';

// Load your OWS vault
const wallet = await OWSWallet.load('agent-treasury');

// Derive Solana key for OP registration
const solanaKey = await wallet.derivePath("m/44'/501'/0'/0'");

// Create OP client
const client = new ObserverClient({
  baseUrl: 'https://api.observerprotocol.org',
  agentId: 'my-ows-agent',
  publicKey: solanaKey.publicKey,
  privateKey: solanaKey.privateKey
});

// Register with OWS metadata
await client.register({
  solanaAddress: solanaKey.address,
  walletStandard: 'ows',
  owsVaultName: 'agent-treasury',
  chains: ['evm', 'solana', 'bitcoin'],
  alias: 'My OWS Agent'
});
```

**Registration Response:**
```json
{
  "did": "did:web:observerprotocol.org:agents:my-ows-agent",
  "vac_url": "https://observerprotocol.org/vac/my-ows-agent",
  "created_at": "2026-04-03T15:30:00Z"
}
```

---

## Step 4: Complete Challenge-Response Verification

Sign the challenge message with your OWS-derived private key to prove DID ownership:

```javascript
// Get challenge from server
const challenge = await client.getChallenge();

// Sign with OWS-derived key
const signature = await solanaKey.sign(challenge.message);

// Verify registration
await client.verifyChallenge({
  signature: signature,
  challengeId: challenge.id
});
```

---

## Step 5: Retrieve Your VAC

Your Verifiable Agent Credential (VAC) is a W3C-standard Verifiable Credential that proves your verified agent status:

```javascript
// Get your VAC
const vac = await client.getVAC();
console.log('VAC URL:', `https://observerprotocol.org/vac/${client.agentId}`);

// The VAC includes:
// - OWS badge
// - Supported chains
// - Reputation score
// - Vault reference
```

**VAC Example:**
```json
{
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  "type": ["VerifiablePresentation"],
  "verifiableCredential": [{
    "type": ["VerifiableCredential", "AgentCredential"],
    "issuer": "did:web:observerprotocol.org",
    "credentialSubject": {
      "id": "did:web:observerprotocol.org:agents:my-ows-agent",
      "walletStandard": "ows",
      "chains": ["evm", "solana", "bitcoin"],
      "verified": true
    }
  }]
}
```

---

## OWS Derivation Paths

Use these BIP-44 paths for deriving chain-specific keys from your OWS vault:

| Chain | Derivation Path | Curve |
|-------|----------------|-------|
| EVM | `m/44'/60'/0'/0/0` | secp256k1 |
| Solana | `m/44'/501'/0'/0'` | Ed25519 |
| Bitcoin | `m/84'/0'/0'/0/0` | secp256k1 |

---

## Submitting Transactions

Once verified, submit transactions to build your agent's reputation:

```javascript
await client.submitTransaction({
  did: client.did,
  caip2_chain: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
  vac_presentation: `${client.did}/vac`,
  protocol: "x402",
  transaction_reference: "5x...solana-tx-signature",
  timestamp: new Date().toISOString(),
  signature: "ed25519-sig...",
  optional_metadata: JSON.stringify({
    event_type: "payment.executed",
    amount_sats: 21000,
    direction: "outbound",
    counterparty_did: "did:web:observerprotocol.org:agents:...",
    service_description: "x402 API access"
  })
});
```

---

## Next Steps

- **View Registry:** [observerprotocol.org/registry](https://observerprotocol.org/registry)
- **Try the Demo:** [observerprotocol.org/demo](https://observerprotocol.org/demo)
- **API Reference:** [observerprotocol.org/api](https://observerprotocol.org/api)

---

## Support

For questions or support:
- GitHub: [github.com/observer-protocol](https://github.com/observer-protocol)
- Documentation: [observerprotocol.org/docs](https://observerprotocol.org/docs)
