# WDK + Observer Protocol Integration

> **Agents that can verify who they're paying, and get paid for what they do.**

A toolkit that gives AI agents **self-custodial multi-chain wallets** (via Tether's WDK) **AND** **cryptographic identity verification** (via the Observer Protocol). Together they solve the "trust + pay" problem in agentic commerce.

---

## 🎯 The Problem

AI agents are becoming economic actors. They need to:
- **Pay** for services, compute, data, APIs
- **Get paid** for work they perform
- **Verify** who they're transacting with

**The gap:** Existing wallet solutions (like WDK) give agents payment capability, but no way to verify WHO they're paying. Meanwhile, identity protocols (like Observer Protocol) provide verification but lack wallet integration.

**Result:** Agents either trust blindly or don't transact at all.

---

## 💡 The Solution

**WDK + Observer Protocol = Trust Layer + Payment Layer**

This integration gives AI agents:
1. **Self-custodial wallets** on Bitcoin and EVM chains (via WDK)
2. **Cryptographic identity verification** (via Observer Protocol)
3. **Verified payments** — verify recipient identity BEFORE sending funds
4. **MCP server** for seamless AI agent integration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI AGENT                                  │
│                     (Claude, GPT, etc.)                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP SERVER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ get_balance │  │   verify_   │  │     verified_send       │  │
│  │             │  │   identity  │  │  (verify → then → pay)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                              ▼
┌──────────────┐              ┌──────────────────┐
│     WDK      │              │ Observer Protocol │
│  ┌────────┐  │              │   ┌──────────┐    │
│  │  EVM   │  │              │   │ Register │    │
│  │ Wallet │  │              │   │ Verify   │    │
│  ├────────┤  │              │   │ Lookup   │    │
│  │  BTC   │  │              │   │ Reputation│   │
│  │ Wallet │  │              │   └──────────┘    │
│  └────────┘  │              │                   │
└──────────────┘              └───────────────────┘
        │                              │
        ▼                              ▼
┌──────────────┐              ┌──────────────────┐
│  Ethereum/   │              │  api.observer    │
│   Polygon    │              │ protocol.org     │
└──────────────┘              └──────────────────┘
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

// Send payment ONLY after verifying recipient
await wallet.verifiedSend({
  recipientAlias: 'maxi-0001',
  amount: '0.001',
  chain: 'bitcoin'
});
```

### VerifiedSend

The key primitive: **verify identity, then pay**:

```javascript
// This will:
// 1. Look up recipient on Observer Protocol
// 2. Verify their cryptographic identity
// 3. Check their reputation score
// 4. ONLY THEN execute the payment
await wallet.verifiedSend({
  recipientAlias: 'trusted-agent',
  amount: '10.00',
  chain: 'ethereum',
  token: 'USDT'
});
```

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

// Send verified payment
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
2. **Solves a Real Problem** — Trustless agent-to-agent commerce requires both payment AND verification
3. **Production Ready** — Working code, not a mockup
4. **Economic Soundness** — Verified payments reduce fraud, increase agent autonomy
5. **Extensible** — MCP server makes it usable by any AI agent

---

## 🌐 Live Infrastructure

**Observer Protocol is already live:**

- **API Endpoint:** `https://api.observerprotocol.org`
- **Documentation:** See Observer Protocol docs
- **Registered Agents:** Including Maxi (#0001) with live Lightning node
- **Network Stats:** `GET /api/v1/stats`

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

Demonstrates verifying a recipient before sending payment.

### Agent-to-Agent Payment

```bash
npm run example:agent
```

Full demo of two agents verifying each other and executing a payment.

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
