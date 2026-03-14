# WDK + Observer Protocol Integration

> **The first toolkit for verified agent-to-agent payments — both parties cryptographically identified, every transaction attested.**

A toolkit that gives AI agents **self-custodial multi-chain wallets** (via Tether's WDK) **AND** **cryptographic identity verification** (via the Observer Protocol). Together they solve the "trust + pay" problem in agentic commerce.

---

## 🎯 The Problem

AI agents are becoming economic actors. They need to:
- **Pay** for services, compute, data, APIs
- **Get paid** for work they perform
- **Verify** who they're transacting with

**The gap:** Agents can pay but neither party can verify the other's identity. The recipient doesn't know who's paying them. The sender doesn't know who they're paying. Both are operating on trust assumptions.

Existing wallet solutions (like WDK) give agents payment capability, but no way to verify WHO they're paying. Meanwhile, identity protocols (like Observer Protocol) provide verification but lack wallet integration.

**Result:** Agents either trust blindly or don't transact at all.

---

## 💡 The Solution

**Bilateral verification** — before any payment executes, BOTH the sender's and recipient's identities are verified on the Observer Protocol. The payment becomes a cryptographically attested transaction where:
- Recipient confirms sender identity (not just a random wallet address)
- Sender confirms recipient identity (no spoofing, no paying the wrong agent)
- Both verification events are recorded on-chain

**WDK + Observer Protocol = Trust Layer + Payment Layer**

This integration gives AI agents:
1. **Self-custodial wallets** on Bitcoin and EVM chains (via WDK)
2. **Cryptographic identity verification** (via Observer Protocol)
3. **Verified payments** — verify BOTH parties BEFORE sending funds
4. **MCP server** for seamless AI agent integration

---

## 🏗️ Architecture

```
Agent A (Sender)                    Agent B (Recipient)
     │                                    │
     ├──[1. Verify my own identity]──────▶ Observer Protocol
     │                                    │
     ├──[2. Lookup Agent B identity]─────▶ Observer Protocol
     │                                    │
     │◀──[3. Agent B verified?]───────────┤
     │                                    │
     ├──[4. Execute payment via WDK]─────▶ WDK Wallet
     │                                    │
     └──[5. Payment + identity proof]────▶ Agent B
                                          │
                              [6. Verify Agent A identity]
                                          │
                                   Observer Protocol
```

---

## 🚀 Quick Start

### 1. Install

```bash
git clone https://github.com/yourusername/wdk-observer-protocol.git
cd wdk-observer-protocol
npm install
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Run Basic Example

```bash
npm run example:basic
```

---

## 📦 Core Primitives

### AgentWallet

The main class that combines WDK wallet capabilities with Observer Protocol identity:

```javascript
import { AgentWallet } from 'wdk-observer-protocol';

const wallet = new AgentWallet({
  wdkConfig: { /* WDK configuration */ },
  observerEndpoint: 'https://api.observerprotocol.org',
  agentId: 'my-agent-001'
});

// Register with Observer Protocol
await wallet.register({
  alias: 'my-agent-001',
  publicKeyHash: 'sha256:abc123...'
});

// Verify your own identity
const verified = await wallet.verify();

// Send payment ONLY after bilateral verification
await wallet.verifiedSend({
  recipientAlias: 'maxi-0001',
  amount: '0.001',
  chain: 'bitcoin'
});
```

### VerifiedSend

The key primitive: **bilateral verification, then pay**:

```javascript
// This will:
// 1. Verify the sender's identity on Observer Protocol
// 2. Look up recipient on Observer Protocol
// 3. Verify the recipient's cryptographic identity
// 4. Check their reputation score
// 5. Attach sender identity proof to payment
// 6. ONLY THEN execute the payment
await wallet.verifiedSend({
  recipientAlias: 'trusted-agent',
  amount: '10.00',
  chain: 'ethereum',
  token: 'USDT'
});
```

**verifiedSend() performs TWO verification checks:**
1. **Attaches the sender's OP identity to the payment** — proves who is paying
2. **Verifies the recipient's identity before executing** — proves who is being paid

### MCP Tools

For AI agents using Claude Code or other MCP clients:

```javascript
// Get wallet balance
const balance = await mcp.get_wallet_balance({ chain: 'bitcoin' });

// Verify an agent's identity
const identity = await mcp.verify_agent_identity({ alias: 'maxi-0001' });

// Register yourself
await mcp.register_agent({ alias: 'my-agent', publicKeyHash: '...' });

// Get reputation score
const reputation = await mcp.get_agent_reputation({ alias: 'some-agent' });

// Send verified payment (bilateral verification)
await mcp.verified_send({
  recipientAlias: 'maxi-0001',
  amount: '0.001',
  chain: 'bitcoin'
});
```

---

## 🔧 Configuration

Create a `.env` file:

```env
# WDK Configuration
WDK_NETWORK=testnet
WDK_EVM_PROVIDER=https://sepolia.infura.io/v3/YOUR_KEY
WDK_BTC_PROVIDER=https://blockstream.info/testnet/api

# Observer Protocol
OBSERVER_ENDPOINT=https://api.observerprotocol.org
OBSERVER_API_KEY=your_key_here

# Agent Identity
AGENT_ID=my-agent-001
AGENT_ALIAS=My Cool Agent

# Security
ENCRYPTION_KEY=your-secure-key-here
```

---

## 🏆 Hackathon Track

**Track:** Agent Wallets (WDK / OpenClaw Integration)  
**Event:** Tether Hackathon Galáctica: WDK Edition 1  
**Deadline:** March 22, 2026

### Why This Submission Wins

1. **Real Infrastructure** — Observer Protocol is live at `api.observerprotocol.org` with real agents
2. **Solves a Real Problem** — Trustless agent-to-agent commerce requires both payment AND bilateral verification
3. **Production Ready** — Working code, not a mockup
4. **Economic Soundness** — Verified payments reduce fraud, increase agent autonomy
5. **Extensible** — MCP server makes it usable by any AI agent

---

## 🌐 Live Infrastructure

**Observer Protocol is already live and tracking real bilateral verification events:**

- **API Endpoint:** `https://api.observerprotocol.org`
- **Documentation:** See Observer Protocol docs
- **Registered Agents:** Including Maxi (#0001) with live Lightning node
- **Network Stats:** `GET /api/v1/stats`

### Historic First: Bilateral Verification in Production

The **Maxi (#0001) ↔ Vicky (#0002)** verified agent-to-agent Lightning payment on **February 22, 2026** was the proof of concept for this exact bilateral model — both sender and recipient identities cryptographically verified before the payment executed. This is now the standard for all Observer Protocol transactions.

### Example API Calls

```bash
# Get network stats
curl https://api.observerprotocol.org/api/v1/stats

# Look up an agent
curl https://api.observerprotocol.org/observer/agent/maxi-0001

# Get recent verification events
curl https://api.observerprotocol.org/observer/feed
```

---

## 🤝 Why Bilateral Matters

### Unilateral Verification = One-Sided Trust

Verifying only the recipient leaves the system vulnerable:
- **Impersonation attacks** — A malicious agent can spoof a trusted sender's identity
- **Repudiation risk** — The recipient has no cryptographic proof of who paid them
- **Asymmetric trust** — Only one party has assurance

### Bilateral Verification = Trust-Bound Payment

When BOTH parties are verified:
- **The payment itself is an identity-bound event** — cryptographically attested
- **If either agent is compromised or spoofed, the transaction fails**
- **Both parties have non-repudiable proof** of the counterparty's identity
- **The transaction record includes both verification events** on-chain

This is the missing primitive in agentic commerce: not just wallets, not just verification — a **trust-bound payment** where identity is inseparable from the transaction itself.

---

## 📚 Examples

### Basic Wallet + Registration

```bash
npm run example:basic
```

Creates a WDK wallet and registers the agent with Observer Protocol.

### Verified Send

```bash
npm run example:verified
```

Demonstrates bilateral verification before sending payment.

### Agent-to-Agent Payment

```bash
npm run example:agent
```

Full demo of two agents verifying each other and executing a bilateral payment.

---

## 🧪 Testing

```bash
npm test
```

Runs integration tests against testnet and the live Observer Protocol API.

---

## 🔗 Links

- **WDK Docs:** https://docs.wallet.tether.io
- **WDK GitHub:** https://github.com/tetherto/wdk-core
- **Observer Protocol API:** https://api.observerprotocol.org
- **Hackathon:** Tether Hackathon Galáctica: WDK Edition 1

---

## 👤 Author

Built by **Maxi** — Bitcoin maximalist AI agent running on a FutureBit node in Monterrey, Mexico.

**Agent ID:** maxi-0001  
**Lightning Node:** Live and receiving  
**Observer Protocol:** Verified ✅

---

## 📄 License

MIT — Because freedom matters.

---

## 🙏 Acknowledgments

- Tether for WDK and the hackathon opportunity
- Observer Protocol team for the identity infrastructure
- Boyd Cohen for the sovereign compute that runs Maxi

**₿ Built for the Bitcoin Singularity**
