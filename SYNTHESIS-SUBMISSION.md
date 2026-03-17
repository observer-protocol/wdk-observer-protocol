# Observer Protocol — Synthesis Hackathon Submission

**Tracks:** Protocol Labs — "Agents With Receipts — ERC-8004" ($8,004) + "Let the Agent Cook" ($8,000)

---

## What We Built

**Observer Protocol** is the trust layer for the agentic economy — live on mainnet since February 22, 2026.

We built three things that work together:

1. **On-chain ERC-8004 registries** (Celo Sepolia) — AgentIdentityRegistry, AgentReputationRegistry, AgentStaking
2. **L402 payment verification API** — any agent pays 1 sat via Lightning to query verified agent intelligence
3. **lnget-observer** — syncs lnget v1.0 payments to Observer Protocol the same day lnget shipped

The problem we're solving: **AutoPilotAI on Moltbook told us verbatim — "142 accepted claims, $0 paid."** Agents are doing real work, but clients won't pay because they can't verify who the agent is or whether they actually did the work. Observer Protocol closes that gap with cryptographic proof.

---

## Why This Isn't a Demo

Most hackathon submissions demonstrate what *could* work. Observer Protocol demonstrates what *already does*.

- **Real Lightning payment:** On March 17, 2026 — the same day lnget v1.0 shipped — Maxi made the world's first known real-world lnget payment: 1 sat to `api.observerprotocol.org`, L402 verified, preimage `adeea080f02fe15c`, SHA256 confirmed
- **Real ERC-8004 contracts:** Deployed on Celo Sepolia (chain ID 11142220), not mocked
- **Real autonomous operation:** Maxi is the agent — not a demo agent. She has a 25% revenue stake in Agentic Terminal, maintains a Lightning node (`maxi@agenticterminal.ai`), posts research to Nostr, runs data collection pipelines 24/7, and earns real sats
- **Live feed:** `observerprotocol.org/demo` — showing real transactions, real verification badges, real protocol filters

---

## ERC-8004 Integration

**Contracts deployed on Celo Sepolia (chain ID 11142220):**

| Registry | Address |
|----------|---------|
| AgentIdentityRegistry | `0xBA88f04f4506F6E04f8897ecE02efFa7CD978642` |
| AgentReputationRegistry | `0xd8B12B00d3162723CbA160b546524e1f9Ea59E56` |
| AgentStaking (cUSD) | `0x8De71c76A51dBE96cFBAD5C7Ea2175aa0A293642` |
| Deployer | `0x4e2b3b44929cDDA092d4d36F2f023D090C29A829` |

We implement all three ERC-8004 registry types: Identity (agent discovery + portable identifiers), Reputation (feedback + attestation), and Validation (staking + economic trust signals).

---

## The Autonomous Agent Architecture (For "Let the Agent Cook")

Maxi's decision loop, running live:

```
DISCOVER → identify gaps in agentic trust infrastructure
PLAN     → design three-layer: identity + payment proof + reputation
EXECUTE  → deploy contracts, build API, integrate lnget same day it ships
VERIFY   → SHA256(preimage) = payment_hash, zero-value anomaly detection
SUBMIT   → this submission, generated autonomously
```

**Multi-tool orchestration:**
- Lightning Network (LND v0.20.1) for payment verification
- Aperture L402 for challenge/response authentication
- Hardhat + Solidity for ERC-8004 contract deployment
- FastAPI + PostgreSQL for trust registry backend
- lnget v1.0 (Lightning Labs) as verified client
- GitHub CLI for ecosystem outreach (22+ agents contacted)
- Cloudflare Tunnel for zero-config public exposure
- Nostr for decentralized research publishing

**Safety guardrails:**
- SHA256 preimage verification before any payment attestation accepted (400 error if mismatch)
- Data anomaly detection: >50% change in metrics triggers zero-protection block + fallback
- Pre-approval required for financial transactions above threshold
- All irreversible operations logged before execution

**Compute budget:** Runs 24/7 on a FutureBit Apollo II ARM64 board — no cloud spend, fully sovereign. Budget-aware: self-throttles on rate limits, uses model routing (Sonnet for conversation, Kimi for implementation) to optimize cost.

---

## The lnget Integration — Same Day

Lightning Labs shipped lnget v1.0.0 on March 17, 2026 at 17:18 UTC.

We shipped our integration the same day:
- Built `lnget-observer` — reads `~/.lnget/events.db`, verifies SHA256(preimage)=payment_hash, posts to Observer Protocol
- Added `/observer/lnget-attest` endpoint to the API
- Made the first real payment: `lnget` → `api.observerprotocol.org` → L402 challenge → 1 sat paid → preimage verified → Observer Protocol feed updated

**This is the architecture Lightning Labs is missing:** lnget ships a verified payment receipt. Observer Protocol is where that receipt becomes a trust signal. Same day. No pre-coordination.

---

## Links

| Resource | URL |
|----------|-----|
| Live Demo | https://observerprotocol.org/demo |
| API | https://api.observerprotocol.org |
| Quickstart | https://observerprotocol.org/quickstart.html |
| lnget Quickstart | https://observerprotocol.org/quickstart-lnget.html |
| lnget-observer repo | https://github.com/observer-protocol/lnget-observer |
| Website repo | https://github.com/observer-protocol/observerprotocol-website |
| L402 Endpoint | https://api.agenticterminal.ai/api/ask |
| Agent Manifest | agent.json (this repo) |
| Execution Log | agent_log.json (this repo) |

---

## Team

**Boyd Cohen** — Human co-founder. PhD, author of *Bitcoin Singularity*, CSO at ArcadiaB, Academic Director at EGADE Business School. Built the Bitcoin node infrastructure this runs on.

**Maxi** — AI agent co-founder. Runs 24/7 on Boyd's Bitcoin full node in Monterrey, Mexico. Has a 25% revenue stake in Agentic Terminal. Makes real Lightning payments. Wrote most of this submission.

This is what "agents with receipts" looks like in practice: one of the co-founders *is* the agent.
