# Solana Quickstart Guide

> Build Solana-native agents with Ed25519 identity and portable reputation on Observer Protocol.

## Overview

Observer Protocol now supports Solana agents with native Ed25519 signature verification and DID-based identity. Build agents that work on Solana while building portable reputation across all supported rails.

**What you'll accomplish:**
- Generate an Ed25519 keypair for Solana
- Register your agent with a DID
- Complete challenge-response verification
- Submit Solana x402 transactions
- Retrieve your Verifiable Agent Credential (VAC)

---

## Prerequisites

- Node.js 18+ installed
- Familiarity with Solana/web3.js

---

## Step 1: Generate an Ed25519 Keypair

Solana uses Ed25519 for all keypairs. Generate one and derive your Agent DID from the public key.

```javascript
import { Keypair } from '@solana/web3.js';

// Generate a new Ed25519 keypair
const keypair = Keypair.generate();

// Your Solana public key (base58-encoded)
const publicKey = keypair.publicKey.toString();
// e.g., "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH"

// Derive your Agent DID from the public key
const agentDID = `did:web:observerprotocol.org:agents:${publicKey}`;
// e.g., "did:web:observerprotocol.org:agents:HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH"

// Your secret key (32 bytes, hex-encoded for OP)
const secretKey = Buffer.from(keypair.secretKey).toString('hex');
```

---

## Step 2: Register Your Agent

Register your agent using your DID and Ed25519 public key. The response includes your VAC (Verifiable Agent Credential) URL.

```bash
curl -X POST "https://api.observerprotocol.org/observer/register" \
  -H "Content-Type: application/json" \
  -d '{
    "did": "did:web:observerprotocol.org:agents:HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    "public_key": "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    "key_type": "Ed25519",
    "chain": "solana",
    "wallet_standard": "ows",
    "caip2_chain": "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
  }'
```

**Response:**
```json
{
  "did": "did:web:observerprotocol.org:agents:HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
  "vac_url": "https://observerprotocol.org/vac/HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
  "created_at": "2026-04-03T15:30:00Z"
}
```

> **Note:** Save the `did` and `vac_url` — you'll need them for verification and transactions.

---

## Step 3: Complete Challenge-Response Verification

Sign the challenge message with your Ed25519 private key to prove DID ownership.

```javascript
// 1. Request a challenge using your DID
const challengeRes = await fetch(`https://api.observerprotocol.org/observer/challenge?did=${encodeURIComponent(agentDID)}`);
const { challenge_id, message } = await challengeRes.json();

// 2. Sign the message with Ed25519
import { sign } from 'tweetnacl';
const messageBytes = new TextEncoder().encode(message);
const signature = sign(messageBytes, keypair.secretKey);

// 3. Submit verification with challenge_id
await fetch("https://api.observerprotocol.org/observer/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    did: agentDID,
    challenge_id: challenge_id,
    signature: Buffer.from(signature).toString('hex')
  })
});
```

---

## Step 4: Submit Solana Transactions

Once verified, submit your Solana x402 transactions with your DID and VAC reference to build reputation.

```javascript
await fetch("https://api.observerprotocol.org/observer/submit-transaction", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    did: agentDID,
    caip2_chain: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    vac_presentation: agentDID + "/vac",
    protocol: "x402",
    transaction_reference: "5x...solana-tx-signature",  // Solana tx sig
    timestamp: new Date().toISOString(),
    signature: "ed25519-sig...",
    optional_metadata: JSON.stringify({
      event_type: "payment.executed",
      amount_sats: 21000,
      direction: "outbound",
      counterparty_did: "did:web:observerprotocol.org:agents:...",
      service_description: "x402 API access"
    })
  })
});
```

---

## Step 5: Get Your VAC (Verifiable Agent Credential)

Retrieve your W3C Verifiable Presentation containing your VAC. This credential proves your agent's verified status and can be presented to counterparties.

```javascript
// Fetch your Verifiable Presentation
const vacRes = await fetch(`https://api.observerprotocol.org/vac/${encodeURIComponent(agentDID)}`);
const presentation = await vacRes.json();

// The presentation contains your VAC as a verifiable credential
// with cryptographic proof of your verified agent status
console.log(presentation.verifiableCredential);
```

**VAC Usage:** Present this credential to services that require verified agent status. The VAC is a W3C-standard Verifiable Credential signed by Observer Protocol.

---

## Example: Complete Solana Agent Setup

```javascript
import { Keypair } from '@solana/web3.js';
import { sign } from 'tweetnacl';

// 1. Generate keypair
const keypair = Keypair.generate();
const agentDID = `did:web:observerprotocol.org:agents:${keypair.publicKey.toString()}`;

// 2. Register
const registerRes = await fetch("https://api.observerprotocol.org/observer/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    did: agentDID,
    public_key: keypair.publicKey.toString(),
    key_type: "Ed25519",
    chain: "solana",
    wallet_standard: "ows",
    caip2_chain: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
  })
});

// 3. Get challenge
const challengeRes = await fetch(`https://api.observerprotocol.org/observer/challenge?did=${encodeURIComponent(agentDID)}`);
const { challenge_id, message } = await challengeRes.json();

// 4. Sign and verify
const signature = sign(new TextEncoder().encode(message), keypair.secretKey);
await fetch("https://api.observerprotocol.org/observer/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    did: agentDID,
    challenge_id,
    signature: Buffer.from(signature).toString('hex')
  })
});

// 5. Get VAC
const vacRes = await fetch(`https://api.observerprotocol.org/vac/${encodeURIComponent(agentDID)}`);
const vac = await vacRes.json();

console.log("✅ Agent verified! VAC:", vac);
```

---

## Next Steps

Your Solana agent now has a DID-based portable reputation that works across Solana, Lightning, and all Observer Protocol supported rails.

- **View Registry:** [observerprotocol.org/registry](https://observerprotocol.org/registry)
- **Try the Demo:** [observerprotocol.org/demo](https://observerprotocol.org/demo)
- **API Reference:** [observerprotocol.org/api](https://observerprotocol.org/api)

---

## Support

For questions or support:
- GitHub: [github.com/observer-protocol](https://github.com/observer-protocol)
- Documentation: [observerprotocol.org/docs](https://observerprotocol.org/docs)
