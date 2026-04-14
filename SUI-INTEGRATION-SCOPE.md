# Sui Integration — Observer Protocol Scope of Work

## Date: March 19, 2026
## Status: Pre-scoping (no commitment made)

---

## Executive Summary

This document assesses the technical effort required to extend Observer Protocol verification support to the Sui blockchain. Sui presents a unique cryptographic model (Move-based, multi-scheme signatures, object-centric) that differs significantly from our current Lightning (L402 preimage) and EVM (EIP-191 ECDSA) implementations. While technically feasible, the integration requires careful consideration of signature scheme diversity, address derivation complexity, and strategic fit within our multi-rail thesis.

---

## 1. Sui's Cryptographic Model

### 1.1 Core Signature Schemes

Sui supports **multiple signature schemes** for transaction authentication, unlike Bitcoin (ECDSA only) or Ethereum (ECDSA only, with EIP-191):

| Scheme | Flag | Signature Format | Public Key Format | Notes |
|--------|------|------------------|-------------------|-------|
| **Pure Ed25519** | 0x00 | 64 bytes compressed | 32 bytes compressed | Default, most common |
| **ECDSA Secp256k1** | 0x01 | 64 bytes non-recoverable | 33 bytes compressed | Bitcoin-compatible curve |
| **ECDSA Secp256r1** | 0x02 | 64 bytes non-recoverable | 33 bytes compressed | NIST curve, passkey-friendly |
| **Multisig** | 0x03 | BCS serialized, variable | BCS serialized pubkeys | Multi-weight threshold sigs |
| **zkLogin** | 0x05 | BCS serialized ZK proof | iss + address seed | Zero-knowledge OAuth |
| **Passkey** | 0x06 | BCS serialized WebAuthn | 33 bytes compressed | WebAuthn/CTAP2 |

**Critical implication:** Observer Protocol must handle **at minimum** Ed25519 and Secp256k1 to cover the majority of Sui transactions. Supporting zkLogin and Passkey would require additional architectural changes.

### 1.2 Address Derivation

Sui addresses are derived differently than EVM or Bitcoin:

```
Sui Address = BLAKE2b_256(flag || public_key)
```

Where:
- `flag` is 1 byte indicating the signature scheme (0x00 for Ed25519, 0x01 for Secp256k1, etc.)
- `public_key` is the compressed public key bytes
- Output is a 32-byte address rendered as hex with `0x` prefix

**Key differences from Observer Protocol's current model:**
- EVM: Address = last 20 bytes of Keccak256(pubkey)
- Lightning: Pubkey is the identity (no hashing)
- Sui: Address = BLAKE2b_256(scheme_flag || pubkey)

This means **Sui addresses are not directly comparable** to our current `public_key_hash` canonical identity model without transformation.

### 1.3 Transaction Structure & Signing

Sui transactions use **Programmable Transaction Blocks (PTBs)** with the following signing process:

1. **Transaction Data**: BCS-serialized `TransactionData` struct containing:
   - Sender address
   - Gas input (object reference to SUI coin)
   - Gas price and budget
   - Transaction commands (Move calls, transfers, etc.)
   - Epoch and expiration

2. **Intent Message**: 3-byte intent prefix + BCS transaction data
   - Intent bytes: `[0, 0, 0]` for standard transactions
   - Intent = `[IntentScope, Version, AppId]`

3. **Hash**: Blake2b_256(intent_message)

4. **Signature**: Sign(hash) using chosen scheme

5. **Serialized Signature Format**: `flag || sig || pk`
   - 1 byte flag
   - 64-65 bytes signature (depending on scheme)
   - 32-33 bytes public key

### 1.4 On-Chain Verification

Sui Move provides native signature verification functions:

```move
// Ed25519
sui::ed25519::ed25519_verify(&sig, &pk, &msg);

// Secp256k1
sui::ecdsa_k1::secp256k1_verify(&sig, &pk, &msg, hash_function);

// Secp256k1 with pubkey recovery
sui::ecdsa_k1::secp256k1_ecrecover(&sig, &msg, hash_function);
```

**Note:** Sui uses **Blake2b** for transaction hashing, but signature schemes internally use:
- Ed25519: SHA-512
- ECDSA: SHA-256

---

## 2. What Observer Protocol Needs to Verify a Sui Payment

### 2.1 Required Fields from Agent

To cryptographically verify a Sui payment, Observer Protocol requires:

| Field | Type | Description |
|-------|------|-------------|
| `tx_digest` | String (hex) | 32-byte transaction digest (Blake2b hash of effects) |
| `sender_address` | String (hex) | Sui address of the sender (0x...) |
| `signature` | String (base64/hex) | Serialized signature: `flag || sig || pk` |
| `tx_bytes` | String (base64) | BCS-serialized TransactionData (optional, can fetch from RPC) |
| `amount` | Integer (u64) | Amount in MIST (1 SUI = 10^9 MIST) |
| `recipient` | String (hex) | Recipient Sui address |
| `coin_type` | String | Coin type (e.g., `0x2::sui::SUI` for native SUI) |

### 2.2 Verification Flow

```
1. Receive attestation request with tx_digest, signature, sender_address
2. Fetch transaction from Sui RPC (or verify provided tx_bytes)
   - Query: `sui_getTransactionBlock` with options.showInput = true
3. Extract TransactionData from response
4. Reconstruct intent message: intent_bytes || bcs(tx_data)
5. Hash with Blake2b_256
6. Parse signature: extract flag, sig, pk from serialized format
7. Verify signature against hash using appropriate scheme
8. Verify recovered pubkey derives to sender_address (BLAKE2b_256(flag || pk))
9. Verify tx.from == sender_address
10. Extract payment amount and recipient from transaction events/balanceChanges
11. Record attestation with trust tier calculation
```

### 2.3 RPC Requirements

Observer Protocol would need access to a Sui full node or RPC provider:

**Options:**
1. **Mysten Labs Public RPC** (rate-limited, free)
2. **Self-hosted Sui full node** (infrastructure overhead)
3. **Commercial RPC providers** (e.g., QuickNode, Alchemy — check for Sui support)

**Required RPC methods:**
- `sui_getTransactionBlock` — fetch transaction details
- `sui_getObject` — verify coin objects if needed
- `sui_getLatestCheckpointSequenceNumber` — for confirmation depth

---

## 3. Integration Components & Effort

### 3a. Backend: `/observer/sui-attest` Endpoint

**Description:** New FastAPI endpoint to accept and verify Sui payment attestations.

**Implementation details:**
- Route: `POST /observer/sui-attest`
- Request body: SuiAttestationRequest schema
- Response: AttestationResponse with trust tier
- Database: New `sui_transactions` table or extend existing transaction schema

**Key code components:**
```python
# New schema
class SuiAttestationRequest(BaseModel):
    tx_digest: str  # 0x... format
    signature: str  # base64 encoded flag||sig||pk
    sender_address: str  # 0x... format
    
class SuiVerificationResult(BaseModel):
    verified: bool
    sender_address: str
    recipient: str
    amount_mist: int
    coin_type: str
    checkpoint: int
    timestamp_ms: int
```

**Effort: M (Medium)**
- 2-3 days for endpoint scaffolding
- 2-3 days for RPC integration and transaction parsing
- 1-2 days for testing and edge cases

### 3b. Signature Verification

**Description:** Cryptographic verification of Sui signatures in Python.

**Technical challenge:** Sui uses multiple signature schemes with custom serialization.

**Options evaluated:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **PyNaCl** | Well-maintained, fast Ed25519 | No Secp256k1 support | Partial solution |
| **coincurve** | Secp256k1 support | No Ed25519 | Partial solution |
| **pysui** | Sui-native, full support | Heavy dependency, less maintained | Consider |
| **Roll our own** | Full control, lightweight | Implementation risk, audit burden | Preferred with care |

**Recommended approach:**
Use **PyNaCl** for Ed25519 + **coincurve** for Secp256k1, with custom BLAKE2b address derivation.

**Dependencies:**
```
pynacl>=1.5.0
coincurve>=18.0.0
blake3>=0.3.0  # or hashlib.blake2b (stdlib)
bcs>=0.2.0  # for BCS deserialization
```

**Core verification function:**
```python
def verify_sui_signature(
    signature_b64: str,
    tx_bytes: bytes,
    expected_address: str
) -> bool:
    """
    Verify a Sui serialized signature.
    
    signature format: flag (1) || sig (64/65) || pk (32/33)
    """
    sig_bytes = base64.b64decode(signature_b64)
    flag = sig_bytes[0]
    
    if flag == 0x00:  # Ed25519
        sig = sig_bytes[1:65]
        pk = sig_bytes[65:97]
        # Verify Ed25519 signature
        verify_key = nacl.signing.VerifyKey(pk)
        verify_key.verify(tx_bytes, sig)
        # Derive address
        addr_input = bytes([flag]) + pk
        derived = blake2b(addr_input, digest_size=32).digest()
        
    elif flag == 0x01:  # Secp256k1
        sig = sig_bytes[1:65]
        pk = sig_bytes[65:98]
        # Verify ECDSA signature
        # ... coincurve verification ...
        # Derive address
        addr_input = bytes([flag]) + pk
        derived = blake2b(addr_input, digest_size=32).digest()
    
    return derived.hex() == expected_address.removeprefix('0x')
```

**Effort: M (Medium)**
- 2-3 days for Ed25519 verification
- 2-3 days for Secp256k1 verification  
- 2-3 days for address derivation and edge cases
- 2 days for comprehensive testing with real transactions

**Risk:** Medium. Signature verification is security-critical. Requires test vectors from Sui testnet.

### 3c. Identity Model Compatibility

**Description:** Map Sui addresses to Observer Protocol's `public_key_hash` canonical identity.

**Current OP model:**
```
agent_id = SHA256(primary_pubkey)
```

**Challenge:** Sui addresses are already hashed (BLAKE2b), and the original pubkey is recoverable from signatures but not from the address alone.

**Options:**

| Approach | Implementation | Trade-offs |
|----------|---------------|------------|
| **A: Store Sui address as key_value** | `key_type='sui'`, `key_value='0x...'` | Loses pubkey for future verification |
| **B: Extract pubkey from signature** | Parse `pk` from serialized signature, store raw pubkey | Requires signature present for registration |
| **C: Dual storage** | Store both Sui address and recovered pubkey | More complex, most flexible |

**Recommendation:** Approach B with fallback to A.

When an agent registers a Sui credential:
1. Require a signed message (like EIP-191 for EVM) OR
2. Extract pubkey from their first transaction signature
3. Store raw pubkey in `agent_keys` table
4. Derive canonical `public_key_hash` from raw pubkey

**Database changes:**
```sql
-- Extend agent_keys table
ALTER TABLE agent_keys ADD COLUMN scheme_flag SMALLINT;  -- 0x00, 0x01, etc.
ALTER TABLE agent_keys ADD COLUMN raw_pubkey BYTEA;  -- original pubkey bytes
```

**Effort: S (Small)**
- 1 day for schema changes
- 1-2 days for registration flow updates

### 3d. Docs & Frontend

**Description:** Update documentation and frontend to support Sui as a verified rail.

**Required updates:**

1. **API Documentation:**
   - New `/observer/sui-attest` endpoint
   - Sui-specific request/response schemas
   - Signature format specification

2. **Technical Paper:**
   - Section on Sui verification model
   - Comparison with L402 and x402
   - Security considerations

3. **Frontend (if applicable):**
   - Sui address display format
   - Transaction explorer links (Suiscan, SuiVision)
   - Wallet connection (Sui Wallet, Suiet)

4. **SDK Updates:**
   - TypeScript SDK: Sui attestation client
   - Python SDK: Sui verification helpers

**Effort: S (Small)**
- 1 day for API docs
- 1-2 days for technical paper updates
- 2-3 days for SDK updates (if needed)

---

## 4. Total Effort Estimate

| Component | Effort | Notes |
|-----------|--------|-------|
| Backend API (`/observer/sui-attest`) | M | 5-8 days |
| Signature Verification Library | M | 8-12 days |
| Identity Model Changes | S | 2-3 days |
| Documentation & Frontend | S | 3-5 days |
| Testing & Integration | M | 5-7 days |
| **Total** | **M-L** | **~3-4 weeks engineer time** |

**T-shirt sizing:**
- **S** = 1-3 days
- **M** = 1-2 weeks
- **L** = 3-4 weeks
- **XL** = 1-2 months

**Overall: M-L (Medium-Large)** — approximately 3-4 weeks of focused engineering effort for a mainnet beta-ready implementation covering Ed25519 and Secp256k1.

---

## 5. Open Questions Before Starting

### Technical Questions

1. **Signature Scheme Scope:**
   - Do we need to support zkLogin (0x05) and Passkey (0x06) signatures?
   - These require significantly more complexity (ZK proof verification, WebAuthn)

2. **Transaction Type Scope:**
   - Native SUI transfers only, or any payment token (USDC on Sui, etc.)?
   - Programmable Transaction Blocks can contain complex logic — do we verify all transfers or just direct payments?

3. **Confirmation Finality:**
   - Sui uses checkpoint-based finality (typically 2-3 seconds)
   - Do we require a minimum checkpoint depth (e.g., 1-2 checkpoints) before attestation?

4. **RPC Infrastructure:**
   - Do we run our own Sui full node or use commercial RPC?
   - What's the cost/rate-limit implications?

5. **Testnet vs Mainnet:**
   - Sui Testnet available for testing
   - Do we need separate attestation endpoints for testnet?

### Business Questions

6. **Sui Ecosystem Traction:**
   - What's the actual demand from Sui-based agents?
   - Are there specific partners/projects requesting this?

7. **Resource Priority:**
   - Does this take precedence over Solana integration (also Ed25519-based)?
   - Does this take precedence over Fedimint ecash support?

8. **Maintenance Commitment:**
   - Sui is rapidly evolving (Move language updates, new signature schemes)
   - Are we prepared for ongoing maintenance?

---

## 6. Strategic Fit Assessment

### 6.1 The Opportunity

**Sui's Agent Ecosystem is Growing:**

1. **Talus Integration (Feb 2025):** Talus, a next-gen AI agent platform, chose Sui as its primary chain and is building:
   - Nexus: Onchain agentic framework
   - Idol.fun: AI consumer platform
   - Tokenized AI agents for DeFAI, GameFAI, SocialFAI

2. **Walrus Storage:** Sui's decentralized storage protocol (from Mysten Labs) is purpose-built for AI agents:
   - Store large AI models onchain
   - Data retrieval for agent decision-making
   - Trusted onchain history for training

3. **zkLogin:** Sui's unique zero-knowledge OAuth login enables:
   - Agents with social identity (Google, Apple, etc.)
   - Lower friction onboarding for non-crypto-native agents
   - Potential bridge between Web2 and Web3 agent identity

**Technical Differentiation:**
- Move language offers better safety guarantees than Solidity
- Parallel execution = higher throughput for agent micro-transactions
- Object-centric model fits agent resource management well

### 6.2 The Risks

**1. Ecosystem Maturity:**
- Sui mainnet launched May 2023 (relatively young)
- Agent ecosystem is nascent compared to Ethereum or even Solana
- Talus is promising but unproven at scale

**2. Focus Dilution:**
- Observer Protocol's current strength: Lightning + EVM
- These cover 90%+ of current agent payment volume
- Adding Sui spreads engineering resources thinner

**3. Competition with Solana:**
- Solana also has strong agent ecosystem (SendAI, etc.)
- Solana uses Ed25519 (same as Sui default)
- If we only add one non-EVM chain, Solana may have more traction

**4. Move Language Barrier:**
- Fewer developers know Move vs Solidity/Rust
- Harder to audit and verify Move contracts
- Smaller tooling ecosystem

**5. Tokenomics Risk:**
- SUI token unlock schedules
- Validator centralization concerns
- Regulatory scrutiny on newer L1s

### 6.3 Honest Assessment

**Does Sui extend our multi-rail thesis in a meaningful way?**

**Yes, but with caveats.**

Sui's technical architecture (Move, parallel execution, object-centric) genuinely advances the state of the art for agent-friendly blockchains. The Talus + Walrus combination creates a credible "agent-native" stack that doesn't exist on Ethereum or Solana in the same form.

However, **timing matters**:

- **Short-term (0-6 months):** Sui agent volume will be minimal. Talus is pre-launch. The integration would be strategic positioning, not immediate utility.

- **Medium-term (6-18 months):** If Talus and similar projects gain traction, Sui could become a significant agent hub. Early integration would pay off.

- **Risk:** If Sui agent ecosystem doesn't materialize, we've spent 3-4 weeks on a rail with no volume.

### 6.4 Recommendation

**Conditional Yes — with phased approach:**

**Phase 1 (Now):** 
- Do NOT commit to full integration yet
- Establish relationship with Talus team
- Monitor Sui agent ecosystem growth
- Build minimal proof-of-concept (Ed25519 only, testnet only)

**Phase 2 (Trigger: 3+ Sui agent projects requesting integration OR Talus mainnet launch):**
- Full mainnet beta implementation (this scope document)
- Mainnet support
- Both Ed25519 and Secp256k1

**Phase 3 (Trigger: Significant Sui payment volume):**
- Advanced features (zkLogin support, complex PTB parsing)
- Deep Walrus integration for agent data attestation

**Alternative:** Prioritize Solana first (similar Ed25519 work, larger existing ecosystem), then evaluate Sui based on ecosystem developments.

---

## Appendix A: Sui Signature Verification Test Vectors

For implementation testing, use these resources:

1. **Sui TypeScript SDK test vectors:**
   - https://github.com/MystenLabs/sui/tree/main/sdk/typescript/test/unit/cryptography

2. **fastcrypto CLI:**
   - https://github.com/MystenLabs/fastcrypto
   - Generate known-good signatures for testing

3. **Sui CLI:**
   ```bash
   sui keytool generate ed25519
   sui client transfer-sui --to <addr> --amount 1000000 --gas-budget 10000000
   # Inspect transaction for signature format
   ```

---

## Appendix B: Required Python Dependencies

```txt
# requirements-sui.txt
pynacl>=1.5.0          # Ed25519 signatures
coincurve>=18.0.0      # Secp256k1 signatures  
blake3>=0.3.0          # BLAKE2b-256 hashing
bcs>=0.2.0             # BCS serialization
requests>=2.28.0       # RPC calls
```

---

## Appendix C: Sui RPC Providers

| Provider | URL | Notes |
|----------|-----|-------|
| Mysten Labs (Mainnet) | https://fullnode.mainnet.sui.io | Public, rate-limited |
| Mysten Labs (Testnet) | https://fullnode.testnet.sui.io | Public, for testing |
| QuickNode | https://www.quicknode.com/chains/sui | Commercial |
| Alchemy | Check current support | Commercial |

---

*Document prepared by: Observer Protocol Technical Architecture Team*
*Date: March 19, 2026*
*Status: Pre-scoping — no engineering commitment made*
