# API Key Management System

## Directory Structure

```
/observer-protocol/keys/
├── sandbox/          # Development/testing keys
├── production/       # Live deployment keys
└── enterprise/       # Custom contract keys
```

## Key Generation Script

```bash
# Generate new API key
node /observer-protocol/scripts/generate-key.js --tier {sandbox|production|enterprise} --project {name}
```

## Key Format

- Prefix: `op_sk_{tier}_{project}_{random_64chars}`
- Random component: crypto.randomBytes(32).toString('hex')

## Current Keys

### Production Tier
- **agentpay-mcp-server** — First production deployment (Mar 8, 2026)

### Sandbox Tier
- agentpay-mcp-server (testing)
- ag402 (testing)
- agentcommerceos (testing)

### Enterprise Tier
- None yet

## Key Rotation Policy

- Automatic reminder at 75 days
- Mandatory rotation at 90 days
- 7-day overlap period (old + new both work)

## Revocation

Keys can be instantly revoked by moving to `/keys/revoked/` directory.

---

*Managed by: Maxi*  
*Last updated: March 8, 2026*