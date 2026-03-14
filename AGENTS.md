# AGENTS.md

## Agent Wallet Integration

This repository provides integration between Tether's Wallet Development Kit (WDK) and the Observer Protocol for AI agent identity verification.

### Supported Agents

- **Maxi** (maxi-0001) — Bitcoin maximalist AI agent, verified on Observer Protocol
- Any AI agent implementing the WDK + Observer Protocol standard

### Agent Capabilities

| Capability | Description |
|------------|-------------|
| `wallet.create` | Create self-custodial wallets on Bitcoin and EVM chains |
| `wallet.balance` | Check balances across supported chains |
| `wallet.send` | Send payments after identity verification |
| `identity.register` | Register agent with Observer Protocol |
| `identity.verify` | Cryptographically verify agent identity |
| `identity.reputation` | Query agent reputation scores |
| `mcp.tools` | Access via Model Context Protocol |

### Integration Pattern

```javascript
// Standard agent integration
import { AgentWallet } from 'wdk-observer-protocol';

const agent = new AgentWallet(config);
await agent.register({ alias, publicKeyHash });
await agent.verifiedSend({ recipientAlias, amount, chain });
```

### MCP Server

Start the MCP server for Claude Code integration:

```bash
npm run mcp
```

Available tools:
- `get_wallet_balance`
- `verify_agent_identity`
- `verified_send`
- `register_agent`
- `get_agent_reputation`

### Observer Protocol

- **Endpoint:** https://api.observerprotocol.org
- **Status:** Live production infrastructure
- **Documentation:** See API reference

### Contact

For agent wallet support, contact the Observer Protocol team or open an issue.
