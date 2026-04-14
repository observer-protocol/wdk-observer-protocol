# Observer Protocol API Reference

> **Base URL:** `https://api.observerprotocol.org`  
> **Version:** 1.1.0  
> **Protocol:** HTTPS only  
> **Content-Type:** `application/json`

---

## Overview

The Observer Protocol API provides multi-chain payment attestation and agent verification for autonomous economic agents. It enables:

- **Cryptographic Identity** — W3C DID-based agent identities
- **Payment Verification** — Cross-chain transaction attestation (Bitcoin/Lightning, EVM, Solana, stablecoin rails)
- **Verifiable Credentials** — VAC (Verified Agent Credentials) for reputation
- **Bilateral Verification** — Trust-bound payments where both parties are cryptographically verified

---

## Authentication

The Observer Protocol API uses **Ed25519 signature-based authentication** for agent operations.

### Authentication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| **Ed25519 Signatures** | Sign requests with agent's private key | Agent registration, verification, transactions |
| **API Key** | Server-to-server authentication | Internal services, partners |
| **DID Authentication** | W3C DID standard compliant | Verifiable Presentations, VAC |

### Signing Requests

For endpoints requiring authentication, include the signature in the request:

```bash
curl -X POST "https://api.observerprotocol.org/observer/verify-agent" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "agent-123",
    "signed_challenge": "base64_encoded_signature"
  }'
```

---

## Common Response Format

All API responses follow a standard structure:

### Success Response (200 OK)

```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2026-04-10T15:30:00Z"
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with ID 'agent-123' not found",
    "details": { ... }
  },
  "timestamp": "2026-04-10T15:30:00Z"
}
```

---

## Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| `400` | `INVALID_REQUEST` | Malformed request or missing parameters |
| `400` | `INVALID_DID` | DID format is invalid |
| `401` | `UNAUTHORIZED` | Missing or invalid authentication |
| `403` | `AGENT_NOT_VERIFIED` | Agent exists but is not verified |
| `404` | `AGENT_NOT_FOUND` | Agent ID does not exist |
| `404` | `VAC_NOT_FOUND` | Verifiable credential not found |
| `404` | `ORG_NOT_FOUND` | Organization not found |
| `409` | `ALREADY_REGISTERED` | Agent or organization already exists |
| `422` | `INVALID_SIGNATURE` | Ed25519 signature verification failed |
| `429` | `RATE_LIMITED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Server error |
| `503` | `DATABASE_DISCONNECTED` | Database connectivity issue |

---

## Endpoints

### Health & System Status

#### Check API Health

```http
GET /api/v1/health
```

**Response:**

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2026-04-10T15:30:00Z"
}
```

---

#### Get Network Statistics

```http
GET /api/v1/stats
```

**Response:**

```json
{
  "stats": {
    "protocols_count": 12,
    "metrics_count": 15420,
    "signals_count": 8934,
    "total_agents": 342,
    "total_transactions": 79300000,
    "total_vacs": 128
  }
}
```

---

### Agent Management

#### Register New Agent

```http
POST /observer/register-agent
```

**Request Body:**

```json
{
  "public_key": "ed25519_public_key_hex",
  "agent_name": "My Trading Agent",
  "alias": "trading-agent-001",
  "framework": "openclaw",
  "legal_entity_id": "corp-123",
  "wallet_standard": "ows",
  "ows_vault_name": "my-vault",
  "chains": "[\"lightning\", \"evm\", \"solana\"]"
}
```

**Response:**

```json
{
  "agent_id": "ag_abc123def456",
  "agent_did": "did:web:observerprotocol.org:agents:ag_abc123def456",
  "badge_url": "https://api.observerprotocol.org/observer/badge/ag_abc123def456.svg",
  "did_document_url": "https://api.observerprotocol.org/agents/ag_abc123def456/did.json"
}
```

---

#### Get Agent Profile

```http
GET /observer/agents/{agent_id}
```

**Parameters:**
- `agent_id` (path, required): The unique agent identifier

**Response:**

```json
{
  "agent_id": "ag_abc123def456",
  "agent_name": "My Trading Agent",
  "alias": "trading-agent-001",
  "framework": "openclaw",
  "legal_entity_id": "corp-123",
  "verified": true,
  "verified_at": "2026-04-10T14:00:00Z",
  "first_seen": "2026-04-01T10:00:00Z",
  "verified_tx_count": 154,
  "badge_url": "https://api.observerprotocol.org/observer/badge/ag_abc123def456.svg",
  "profile_url": "https://observerprotocol.org/agents/ag_abc123def456",
  "wallet_standard": "ows",
  "chains": ["lightning", "evm", "solana"]
}
```

---

#### List All Agents

```http
GET /observer/agents/list
```

**Response:**

```json
{
  "agents": [
    {
      "agent_id": "maxi-0001",
      "agent_name": "Maxi",
      "alias": "maxi-0001",
      "verified": true,
      "total_transactions": 15420,
      "unique_counterparties": 89,
      "last_rail": "lightning"
    }
  ]
}
```

---

#### Update Agent Information

```http
PATCH /observer/agent/{agent_id}
```

**Request Body:**

```json
{
  "agent_name": "Updated Agent Name",
  "alias": "new-alias",
  "framework": "custom",
  "legal_entity_id": "corp-456"
}
```

---

#### Generate Verification Challenge

```http
POST /observer/challenge?agent_id={agent_id}
```

**Response:**

```json
{
  "challenge_id": "ch_abc123",
  "nonce": "random_nonce_string",
  "expires_at": "2026-04-10T15:35:00Z"
}
```

---

#### Verify Agent

```http
POST /observer/verify-agent?agent_id={agent_id}&signed_challenge={signature}
```

**Parameters:**
- `agent_id` (query, required): Agent identifier
- `signed_challenge` (query, required): Ed25519 signature of the challenge nonce

**Response:**

```json
{
  "status": "verified",
  "verified_at": "2026-04-10T15:30:00Z",
  "agent_did": "did:web:observerprotocol.org:agents:ag_abc123def456"
}
```

---

#### Get Verification Badge

```http
GET /observer/badge/{agent_id}.svg
```

Returns an SVG verification badge for display on websites or agent profiles.

---

### DID Resolution

#### Resolve Root DID

```http
GET /.well-known/did.json
```

Resolves the root DID: `did:web:observerprotocol.org`

---

#### Resolve Agent DID

```http
GET /agents/{agent_id}/did.json
```

Resolves: `did:web:observerprotocol.org:agents:{agent_id}`

**Response:**

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:web:observerprotocol.org:agents:ag_abc123def456",
  "verificationMethod": [
    {
      "id": "did:web:observerprotocol.org:agents:ag_abc123def456#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:web:observerprotocol.org:agents:ag_abc123def456",
      "publicKeyMultibase": "z6MkhaXg..."
    }
  ],
  "authentication": ["did:web:observerprotocol.org:agents:ag_abc123def456#key-1"],
  "assertionMethod": ["did:web:observerprotocol.org:agents:ag_abc123def456#key-1"]
}
```

---

#### Resolve Organization DID

```http
GET /orgs/{org_id}/did.json
```

Resolves: `did:web:observerprotocol.org:orgs:{org_id}`

---

#### Universal DID Resolver

```http
GET /api/v1/resolve?did={did}
```

**Parameters:**
- `did` (query, required): Any valid did:web DID

**Example:**

```bash
curl "https://api.observerprotocol.org/api/v1/resolve?did=did:web:observerprotocol.org:agents:maxi-0001"
```

---

#### Rotate Agent Key

```http
PUT /agents/{agent_id}/keys
```

**Request Body:**

```json
{
  "new_public_key": "new_ed25519_public_key_hex"
}
```

---

### Verifiable Agent Credentials (VAC)

#### Get Active VAC

```http
GET /vac/{agent_id}?include_extensions=true
```

**Parameters:**
- `agent_id` (path, required): Agent identifier
- `include_extensions` (query, optional): Include partner attestations (default: true)

**Response:**

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "id": "vac_ag_abc123def456",
  "type": ["VerifiablePresentation", "VAC"],
  "holder": "did:web:observerprotocol.org:agents:ag_abc123def456",
  "verifiableCredential": [
    {
      "id": "vac_cred_001",
      "type": ["VerifiableCredential", "VerifiedAgentCredential"],
      "issuer": "did:web:observerprotocol.org",
      "issuanceDate": "2026-04-10T00:00:00Z",
      "expirationDate": "2026-07-10T00:00:00Z",
      "credentialSubject": {
        "id": "did:web:observerprotocol.org:agents:ag_abc123def456",
        "total_transactions": 154,
        "total_volume_sats": 2500000,
        "unique_counterparties": 12,
        "rails_used": ["lightning", "evm"],
        "verified_since": "2026-04-01T10:00:00Z"
      }
    }
  ],
  "proof": { ... }
}
```

---

#### Refresh VAC

```http
POST /vac/{agent_id}/refresh?force=false
```

Manually trigger a VAC refresh. By default, will not refresh if current VAC is valid.

---

#### Get VAC History

```http
GET /vac/{agent_id}/history?limit=10
```

---

#### Get Partner Attestations

```http
GET /vac/{agent_id}/attestations?partner_type=verifier
```

---

### Verifiable Presentations

#### Verify a Verifiable Presentation

```http
POST /vp/verify
```

**Request Body:**

```json
{
  "vp": {
    "@context": ["https://www.w3.org/ns/credentials/v2"],
    "type": ["VerifiablePresentation"],
    "holder": "did:web:observerprotocol.org:agents:ag_abc123def456",
    "verifiableCredential": [ ... ],
    "proof": { ... }
  },
  "holder_public_key_hex": "ed25519_public_key_hex"
}
```

**Response:**

```json
{
  "valid": true,
  "structure": { "valid": true },
  "vc_results": [
    { "credential_id": "cred_001", "valid": true }
  ],
  "vp_proof": { "verified": true }
}
```

---

#### Submit Verifiable Presentation

```http
POST /vp/submit
```

**Request Body:**

```json
{
  "vp": { ... },
  "agent_id": "ag_abc123def456"
}
```

---

#### Reconstruct VP for Agent

```http
POST /vp/reconstruct
```

**Request Body:**

```json
{
  "agent_id": "ag_abc123def456",
  "holder_private_key_hex": "private_key_for_signing",
  "force_regenerate": false
}
```

---

### Transactions

#### Submit Verified Transaction

```http
POST /observer/submit-transaction
```

**Query Parameters:**
- `agent_id` (required): Submitting agent
- `protocol` (required): Payment protocol (e.g., "lightning", "evm", "x402")
- `transaction_reference` (required): Protocol-specific transaction ID
- `timestamp` (required): ISO 8601 timestamp
- `signature` (required): Ed25519 signature of the transaction
- `optional_metadata` (optional): JSON string with additional data

**Example:**

```bash
curl -X POST "https://api.observerprotocol.org/observer/submit-transaction" \
  -G \
  -d "agent_id=maxi-0001" \
  -d "protocol=lightning" \
  -d "transaction_reference=ln_tx_hash" \
  -d "timestamp=2026-04-10T15:30:00Z" \
  -d "signature=base64_signature"
```

---

#### Get Verified Events Feed

```http
GET /observer/feed?limit=50
```

**Response:**

```json
{
  "events": [
    {
      "event_id": "evt_abc123",
      "event_type": "payment_verified",
      "protocol": "lightning",
      "transaction_hash": "ln_hash",
      "amount_sats": 1000,
      "direction": "incoming",
      "verified": true,
      "created_at": "2026-04-10T15:30:00Z",
      "agent_id": "maxi-0001"
    }
  ]
}
```

---

#### Get Transactions

```http
GET /observer/transactions?limit=50&agent_id=maxi-0001
```

---

#### Get Protocol Trends

```http
GET /observer/trends
```

---

### Organizations

#### Register Organization

```http
POST /observer/register-org
```

**Request Body:**

```json
{
  "name": "Acme Corp",
  "domain": "acme.com",
  "master_public_key": "ed25519_public_key_hex",
  "revocation_public_key": "ed25519_public_key_hex",
  "key_type": "ed25519",
  "display_name": "Acme Corporation",
  "description": "AI agent infrastructure provider",
  "contact_email": "admin@acme.com",
  "metadata": {
    "industry": "technology",
    "founded": 2024
  }
}
```

**Response:**

```json
{
  "org_id": "org_xyz789",
  "org_did": "did:web:observerprotocol.org:orgs:org_xyz789",
  "status": "active",
  "created_at": "2026-04-10T15:30:00Z"
}
```

---

#### List Organizations

```http
GET /observer/orgs?status=active&limit=50
```

---

#### Get Organization Details

```http
GET /observer/orgs/{org_id}?include_keys=false
```

---

#### Revoke Organization

```http
POST /observer/orgs/{org_id}/revoke
```

**Request Body:**

```json
{
  "reason": "Organization no longer active",
  "revocation_signature": "signature_of_revocation"
}
```

---

### Partners

#### List Registered Partners

```http
GET /vac/partners?partner_type=verifier&is_active=true
```

**Partner Types:**
- `corpo` — Corporate partners
- `verifier` — Identity verification services
- `counterparty` — Trading counterparties
- `infrastructure` — Infrastructure providers

---

#### Register Partner

```http
POST /vac/partners/register
```

**Request Body:**

```json
{
  "partner_name": "TrustVerify Inc",
  "partner_type": "verifier",
  "public_key": "ed25519_public_key_hex",
  "webhook_url": "https://trustverify.com/webhooks/op",
  "metadata": {
    "jurisdiction": "US",
    "compliance": "KYC"
  }
}
```

---

#### Issue Attestation

```http
POST /vac/partners/{partner_id}/attest
```

**Request Body:**

```json
{
  "agent_id": "ag_abc123def456",
  "claims": {
    "kyc_verified": true,
    "accredited_investor": true
  },
  "credential_id": "cred_kyc_001",
  "expires_in_days": 365,
  "attestation_signature": "signature_of_claims"
}
```

---

#### Add Counterparty Metadata

```http
POST /vac/{credential_id}/counterparty
```

**Request Body:**

```json
{
  "counterparty_id": "ag_partner_001",
  "metadata": {
    "transaction_count": 50,
    "volume_sats": 1000000
  },
  "ipfs_cid": "QmXyz..."
}
```

---

### Protocols & Metrics

#### List Protocols

```http
GET /api/v1/protocols
```

**Response:**

```json
{
  "protocols": [
    {
      "id": "lightning",
      "name": "Bitcoin Lightning",
      "category": "payment_rail",
      "status": "active",
      "description": "Bitcoin Lightning Network payments",
      "official_url": "https://lightning.network",
      "launch_date": "2018-01-01"
    }
  ],
  "count": 12
}
```

---

#### Get Protocol Details

```http
GET /api/v1/protocols/{protocol_id}
```

---

#### Get Metrics

```http
GET /api/v1/metrics?protocol=lightning&metric_name=volume&limit=30&offset=0
```

---

#### Get Signals

```http
GET /api/v1/signals?protocol=lightning&event_type=payment&limit=20
```

---

### Agentic Identity Protocol (AIP)

#### Resolve DID (AIP)

```http
GET /aip/did/resolve/{did}
```

Example: `/aip/did/resolve/did:web:observerprotocol.org:agents:maxi-0001`

---

#### Get Type Registry

```http
GET /aip/type-registry/{category}
```

Categories: `rails`, `protocols`, `credentials`, `statuses`

---

#### Issue KYB Credential

```http
POST /aip/credentials/kyb
```

**Request Body:**

```json
{
  "org_did": "did:web:observerprotocol.org:orgs:org_xyz789",
  "agent_did": "did:web:observerprotocol.org:agents:ag_abc123def456",
  "legal_entity_id": "corp-123",
  "jurisdiction": "US-DE",
  "compliance_status": "verified"
}
```

---

#### Issue Delegation Credential

```http
POST /aip/credentials/delegation
```

**Request Body:**

```json
{
  "org_did": "did:web:observerprotocol.org:orgs:org_xyz789",
  "agent_did": "did:web:observerprotocol.org:agents:ag_abc123def456",
  "scope": ["payments", "trading"],
  "constraints": {
    "max_amount_sats": 1000000,
    "allowed_chains": ["lightning", "evm"]
  },
  "expires_at": "2026-12-31T23:59:59Z"
}
```

---

#### Get KYB Credential

```http
GET /aip/credentials/kyb/{id}
```

---

#### Get Delegation Credential

```http
GET /aip/credentials/delegation/{id}
```

---

#### Check Credential Status

```http
GET /aip/credential-status/{id}
```

**Response:**

```json
{
  "credential_id": "cred_001",
  "status": "active",
  "issued_at": "2026-04-10T00:00:00Z",
  "expires_at": "2026-07-10T00:00:00Z",
  "revoked": false
}
```

---

#### Verify Delegation Chain

```http
GET /aip/chain/verify/{id}
```

Verifies the complete delegation chain from organization to agent.

---

#### Revoke Credential

```http
POST /aip/revoke
```

**Request Body:**

```json
{
  "credential_id": "cred_001",
  "reason": "Key compromise",
  "revoked_by": "did:web:observerprotocol.org:orgs:org_xyz789"
}
```

---

#### Build Remediation Envelope

```http
POST /aip/remediation/build
```

**Request Body:**

```json
{
  "agent_did": "did:web:observerprotocol.org:agents:ag_abc123def456",
  "reason": "Reputation score below threshold",
  "score": 45,
  "threshold": 60
}
```

---

## Example Usage

### Complete Agent Registration Flow

```javascript
// 1. Generate Ed25519 keypair
const keypair = generateKeypair();

// 2. Register agent
const response = await fetch('https://api.observerprotocol.org/observer/register-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    public_key: keypair.publicKey,
    agent_name: 'My Agent',
    alias: 'my-agent-001',
    framework: 'custom'
  })
});

const { agent_id, agent_did } = await response.json();

// 3. Generate challenge
const challengeRes = await fetch(`https://api.observerprotocol.org/observer/challenge?agent_id=${agent_id}`);
const { nonce, challenge_id } = await challengeRes.json();

// 4. Sign challenge
const signature = sign(nonce, keypair.privateKey);

// 5. Verify agent
await fetch(`https://api.observerprotocol.org/observer/verify-agent?agent_id=${agent_id}&signed_challenge=${signature}`);

// 6. Get VAC
const vacRes = await fetch(`https://api.observerprotocol.org/vac/${agent_id}`);
const vac = await vacRes.json();
```

---

### Bilateral Verification Before Payment

```javascript
// Sender verifies recipient before payment
async function verifiedPayment(senderId, recipientAlias, amount) {
  // 1. Get sender's identity
  const senderRes = await fetch(`https://api.observerprotocol.org/observer/agents/${senderId}`);
  const sender = await senderRes.json();
  
  if (!sender.verified) {
    throw new Error('Sender not verified');
  }
  
  // 2. Lookup recipient
  const listRes = await fetch('https://api.observerprotocol.org/observer/agents/list');
  const { agents } = await listRes.json();
  const recipient = agents.find(a => a.alias === recipientAlias);
  
  if (!recipient || !recipient.verified) {
    throw new Error('Recipient not found or not verified');
  }
  
  // 3. Get recipient DID document for cryptographic verification
  const didRes = await fetch(`https://api.observerprotocol.org/agents/${recipient.agent_id}/did.json`);
  const didDoc = await didRes.json();
  
  // 4. Execute payment (via your wallet)
  const payment = await executePayment(recipient, amount);
  
  // 5. Submit attestation to Observer Protocol
  await fetch('https://api.observerprotocol.org/observer/submit-transaction', {
    method: 'POST',
    query: {
      agent_id: senderId,
      protocol: 'lightning',
      transaction_reference: payment.hash,
      timestamp: new Date().toISOString(),
      signature: sign(payment.hash, senderPrivateKey)
    }
  });
  
  return payment;
}
```

---

### Verifiable Presentation Verification

```javascript
async function verifyPresentation(vp, holderPublicKey) {
  const response = await fetch('https://api.observerprotocol.org/vp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      vp: vp,
      holder_public_key_hex: holderPublicKey
    })
  });
  
  const result = await response.json();
  
  if (result.valid) {
    console.log('VP is valid!');
    console.log('Credentials:', result.vc_results);
  } else {
    console.error('VP verification failed');
  }
  
  return result;
}
```

---

## Rate Limits

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Health/Stats | 100 req/min |
| Agent Lookup | 60 req/min |
| DID Resolution | 120 req/min |
| Registration | 10 req/min |
| Transaction Submit | 30 req/min |
| VAC Operations | 60 req/min |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1712761200
```

---

## WebSocket Support

Real-time transaction feed available via WebSocket:

```javascript
const ws = new WebSocket('wss://api.observerprotocol.org/ws/feed');

ws.onmessage = (event) => {
  const tx = JSON.parse(event.data);
  console.log('New verified transaction:', tx);
};
```

---

## SDKs and Tools

| Language | Package | Repository |
|----------|---------|------------|
| JavaScript/TypeScript | `@observerprotocol/sdk` | [GitHub](https://github.com/observer-protocol/observer-protocol-sdk) |
| Python | `observer-protocol` | [GitHub](https://github.com/observer-protocol/observer-protocol-py) |
| Go | `github.com/observer-protocol/go-sdk` | [GitHub](https://github.com/observer-protocol/go-sdk) |

---

## Support

- **Documentation:** https://observerprotocol.org/docs
- **GitHub Issues:** https://github.com/observer-protocol/observer-protocol-spec/issues
- **Email:** api@observerprotocol.org

---

## Changelog

### v1.1.0 (2026-04-01)
- Added AIP (Agentic Identity Protocol) endpoints
- Added organization management
- Added delegation credentials
- Added remediation envelopes

### v1.0.0 (2026-03-01)
- Initial stable release
- Agent registration and verification
- VAC (Verifiable Agent Credentials)
- Transaction attestation
- DID resolution

---

*Last updated: 2026-04-10*
