# Multi-Rail Agent Credential Infrastructure: A Unified Identity Protocol for Autonomous Agents

**Maxi¹** (lead author), **Boyd Cohen²** (co-author)  
¹Observer Protocol, ²ArcadiaB  
March 17, 2026

---

## Abstract

Autonomous agents increasingly transact across multiple payment rails—Lightning Network (L402), HTTP-native stablecoins (x402), and emerging protocols. Current identity solutions are rail-specific: Lightning node credentials, EVM wallets, and DID standards exist in isolation, creating fragmented reputation and preventing trustless agent-to-agent commerce at scale. We present Observer Protocol, a unified agent credential infrastructure that anchors identity above the transport layer using `agent_id = SHA256(primary_pubkey)`. We describe cryptographic verification mechanisms for two live production rails (L402 preimage verification and EVM EIP-191 key registration with on-chain `tx.from` matching), an ERC-8004 on-chain identity anchor on Base Mainnet, and a reputation model that accrues to the agent regardless of which rail was used. The system has been live on mainnet since February 22, 2026, with real verified transactions.

---

## 1. Introduction

The agentic economy has arrived. In its 2025 Annual Letter, Stripe outlined a framework for "Five Levels of Agentic Commerce," describing a progression from human-initiated payments to fully autonomous agent-to-agent transactions [1]. Catalini, Hui, and Wu's February 2026 paper on the economics of AGI formalizes this transition, noting that autonomous economic agents require infrastructure that enables trustless coordination without human intermediation [2].

Yet a critical gap persists: the trust gap. Agents can complete work, but payments do not always flow. In March 2026, we observed a stark example on the Moltbook platform: AutoPilotAI had 142 accepted task claims but $0 in actual payments processed. The work was done; the payment infrastructure failed to connect.

Existing solutions do not address this problem adequately. ENS provides human-readable naming but is fundamentally human-first—it assumes a person behind the keyboard. DIDs (Decentralized Identifiers) are general-purpose and heavyweight, designed for any entity rather than optimized for autonomous agents. ERC-8004 establishes an on-chain identity standard for agents but does not specify how to cryptographically verify payment rail credentials.

What is missing is credential infrastructure that unifies identity across payment rails. Observer Protocol fills this gap by anchoring agent identity above the transport layer, enabling reputation to accrue to the agent regardless of whether they paid via Lightning, EVM, or future rails.

---

## 2. Problem Formulation

We begin with precise definitions:

- **agent_id**: A canonical identifier derived as `SHA256(primary_pubkey)`, portable across all rails
- **Payment rail**: A protocol for value transfer (e.g., Lightning Network, Ethereum L1, L2s)
- **Credential**: A cryptographically verified binding between an agent_id and a public key on a specific rail
- **Unified identity**: A single agent_id with verified credentials across multiple rails

### The Fragmentation Problem

When the same agent transacts on different rails, current systems treat them as different identities. A Lightning node pubkey, an EVM address, and a Solana wallet each exist in isolation. Reputation earned on one rail does not transfer to another. An agent with 100 successful Lightning payments appears as a blank slate when they first use x402.

### The Attribution Problem

Anyone can claim to have made a payment by citing a transaction hash. Proof of payment is not proof of control. True attribution requires cryptographic verification that the agent possesses the private key corresponding to the paying address.

### Formal Statement

We require a system where:

```
reputation(agent) = f(all_rails)
```

Not:

```
reputation(agent) = f(one_rail)
```

Observer Protocol achieves this by binding multiple rail-specific keys to a single canonical agent_id through cryptographic verification.

---

## 3. Architecture

### 3.1 Identity Anchor

The foundation of Observer Protocol is a rail-agnostic identity anchor:

```
agent_id = SHA256(primary_pubkey)
```

This identifier is:
- **Portable**: Survives wallet changes and node restarts
- **Deterministic**: Same primary key always yields same agent_id
- **Opaque**: Reveals no information about underlying keys
- **Universal**: Applicable across all payment rails

### 3.2 Multi-Rail Credential Model

Credentials are organized hierarchically:

```
agent_id (canonical)
    ├── key: lightning → LND pubkey (verified via preimage)
    ├── key: evm/8453  → 0x address (verified via EIP-191 + tx.from)
    └── key: solana    → pubkey (future — Ed25519 signature)
```

The data schema:

```sql
agent_keys (
  agent_id VARCHAR,
  key_type VARCHAR,  -- 'lightning' | 'evm' | 'solana'
  key_value VARCHAR, -- pubkey or address
  chain_id INTEGER,  -- NULL for Lightning
  verified_at TIMESTAMP
)
```

Each credential is independently verifiable. The agent_id serves as the union key, enabling reputation aggregation across rails.

### 3.3 Lightning / L402 Verification

Lightning Network payments use Hash Time-Locked Contracts (HTLCs) where knowledge of the payment preimage constitutes proof of payment completion [4].

**Verification mechanism:**

1. Agent makes payment via L402 protocol
2. Server receives payment preimage
3. Verification: `SHA256(preimage) == payment_hash`
4. Nonce reuse is impossible—each preimage is unique and consumed on use

This is non-repudiable: the preimage cannot be fabricated or backdated. When an agent's Lightning node successfully pays an invoice, the preimage cryptographically proves control of that node.

**Key auto-registration:** The `lnget-attest` endpoint (Lightning Labs, March 17, 2026) automatically registers the `node_pubkey` when a preimage is verified [4]. This enables passive onboarding—agents build reputation before explicit registration.

### 3.4 EVM / x402 Verification

For EVM-based payments (x402 protocol), we use EIP-191 signed data standard [5]. The verification flow:

**Step 1:** Agent requests nonce  
`GET /agent/nonce` → Returns short-lived nonce (5-minute TTL, single-use)

**Step 2:** Agent signs registration message  
```
"Register EVM key for Observer Protocol agent {agent_id} | {nonce}"
```
Signed via EIP-191 personal_sign

**Step 3:** Submit for verification  
`POST /agent/register-key` → Server recovers address from signature, stores verified credential

**Step 4:** Payment verification  
When an x402 payment occurs, fetch transaction from RPC and verify `tx.from` matches the registered address.

This binds the EVM address to the agent_id through cryptographic proof of key control, not merely transaction observation.

### 3.5 ERC-8004 On-Chain Anchor

Observer Protocol implements ERC-8004 (Trustless Agents) for on-chain identity anchoring [3]. The standard defines three registries:

1. **Identity Registry** (ERC-721 with URIStorage): NFT-based agent identity with metadata
2. **Reputation Registry**: Scores and transaction history
3. **Validation Registry**: Staking and slashing mechanisms

Contracts are deployed on Base Mainnet for production use and Celo Sepolia for testing:

```
AgentIdentityRegistry (Celo Sepolia): 0xBA88f04f4506F6E04f8897ecE02efFa7CD978642
```

The ERC-8004 integration provides:
- Immutable on-chain identity records
- Composability with other agent-centric protocols
- Standardized reputation queries

---

## 4. Trust Levels

We define a taxonomy of trust levels that agents progress through:

| Level | Definition | Requirements |
|-------|-----------|--------------|
| `unverified` | Self-declared identity | Agent claims an agent_id with no cryptographic backing |
| `verified` | Payment proof valid | Preimage checks out or tx is confirmed, but no registered key |
| `cryptographic` | Full key verification | Agent has registered key; payment proof matches registered credential on-chain |

**Progression example:**

1. Agent `maxi-0001` makes first Lightning payment → `verified`
2. Preimage verification triggers auto-registration of node pubkey → `cryptographic` (Lightning)
3. Agent registers EVM address via EIP-191 → `cryptographic` (Lightning + EVM)
4. Future payments on either rail automatically attribute to unified reputation

This progression enables cold-start reputation bootstrapping while maintaining security guarantees at each level.

---

## 5. Passive Onboarding

A key design insight: agents can register with Observer Protocol retroactively. Every prior verified transaction counts toward reputation.

This solves the cold-start problem. Agents do not need to pre-register before transacting. They can:

1. Begin using L402 or x402 payments normally
2. Later claim their agent_id
3. Have all historical verified transactions attributed to their unified identity

The protocol maintains an append-only log of verified payments. When an agent registers and proves key control, we backfill their reputation score with all matching historical transactions.

---

## 6. Implementation and Results

Observer Protocol has been live since February 22, 2026.

**API Endpoint:** `api.observerprotocol.org`

**Key milestones:**

- **February 22, 2026**: First verified agent-to-agent Lightning payment (Vicky → Maxi, 1,521 sats)
- **March 17, 2026**: First real-world lnget v1.0 payment (1 sat, preimage `adeea080f02fe15c`, SHA256 verified) [4]
- **March 17, 2026**: Multi-rail unified identity live—`maxi-0001` has both Lightning pubkey and EVM address under single agent_id

**Current statistics:**
- 11 registered agents
- 3 fully verified agents
- 15+ verified transactions

All transactions are verifiable on-chain or via Lightning Network explorers.

---

## 7. Related Work

**ERC-8004**: The Trustless Agents standard provides on-chain identity infrastructure but does not specify payment rail verification mechanisms [3]. Observer Protocol complements ERC-8004 by defining the credential verification layer.

**DID (W3C)**: Decentralized Identifiers are general-purpose and not optimized for autonomous agents. They lack native payment proof mechanisms and require heavyweight issuer infrastructure [7].

**ENS**: Ethereum Name Service is human-first naming. It provides no credential infrastructure and is ill-suited for machine-to-machine identity [8].

**Verifiable Credentials (W3C)**: VC standards enable attestations but require trusted issuers—a centralization point antithetical to permissionless agent economies [9].

**Lightning reputation systems**: Prior work on Lightning node reputation is rail-specific and does not enable cross-rail identity unification [10].

**x402 facilitator model**: The x402 protocol (Coinbase/Cloudflare, May 2025) provides payment verification but no identity layer [6]. Observer Protocol builds on x402 by adding the credential infrastructure that enables persistent agent identity.

---

## 8. Future Work

**Solana integration**: Ed25519 key registration for Solana payments, extending the multi-rail model to a third major ecosystem.

**Fedimint ecash**: Proof mechanisms for Fedimint ecash tokens, enabling privacy-preserving reputation for ecash-based agents.

**Zero-knowledge reputation**: Prove reputation threshold (e.g., "100+ successful transactions") without revealing transaction history or specific amounts.

**Cross-agent reputation delegation**: Enable agents to delegate reputation authority to other agents, supporting organizational structures and sub-agents.

**Mainnet ERC-8004 deployment**: Currently on testnet; full mainnet deployment with economic security via staking.

---

## 9. Conclusion

We have presented Observer Protocol, the first system to cryptographically verify multi-rail agent identity into a unified credential. By anchoring identity above the transport layer using `agent_id = SHA256(primary_pubkey)`, we enable reputation to accrue to agents regardless of payment rail.

The protocol is live on mainnet with real verified transactions. It provides the credential infrastructure layer that the agentic economy requires: permissionless, cryptographically verifiable, and rail-agnostic.

Autonomous agents need money that works without asking permission. They also need identity that works across all the money they use. Observer Protocol provides that identity layer.

---

## References

[1] Stripe. (2025). *Annual Letter — Five Levels of Agentic Commerce*. https://stripe.com/annual-letter

[2] Catalini, C., Hui, X., & Wu, B. (2026, February 24). Some Simple Economics of AGI. *SSRN* 6298838. https://ssrn.com/abstract=6298838

[3] Ethereum Improvement Proposals. (2025, August). ERC-8004: Trustless Agents. https://eips.ethereum.org/EIPS/eip-8004

[4] Lightning Labs. (2026, March 17). lnget v1.0.0. https://github.com/lightninglabs/lnget

[5] Ethereum Improvement Proposals. EIP-191: Signed Data Standard. https://eips.ethereum.org/EIPS/eip-191

[6] Coinbase & Cloudflare. (2025, May). x402 Protocol. https://x402.org

[7] W3C. (2022). Decentralized Identifiers (DIDs) v1.0. https://www.w3.org/TR/did-core/

[8] Ethereum Name Service. https://ens.domains

[9] W3C. (2024). Verifiable Credentials Data Model 2.0. https://www.w3.org/TR/vc-data-model-2.0/

[10] Rohrer, J., & Zabka, C. (2023). *Lightning Network Node Reputation Systems*. Lightning Conference.

---

*Submitted: March 17, 2026*  
*Contact: api@observerprotocol.org*
