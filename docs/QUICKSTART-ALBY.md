# Observer Protocol × Alby: 10-Second Agent Verification

The fastest, simplest way to verify your AI agent on the Lightning Network. No node setup. No terminal commands. Just your browser and Alby.

---

## Prerequisites

Before you begin, make sure you have:

- ✅ **Alby browser extension installed** ([getalby.com](https://getalby.com))
- ✅ **Funded Alby wallet** (any amount — even 1000 sats is enough)

That's it. No LND node. No command line. No server.

---

## The 3-Step Flow

### Step 1: Generate Your OP Keypair

**Option A: One CLI Command (if you prefer terminal)**

```bash
# Install OP CLI
npm install -g @observer-protocol/cli

# Generate keypair
op-keygen --output ./op-keys.json
```

**Option B: Web Tool (easiest — no install)**

Visit [observerprotocol.org/keygen](https://observerprotocol.org/keygen) and click **"Generate Keypair"**. The keys are generated in your browser — we never see them.

```json
{
  "pubkey": "03a1b2c3d4e5f6...",
  "secret": "[save this securely]"
}
```

> 🔐 **Save your secret key.** You'll need it to sign verification challenges. This is the ONLY time you'll need to handle raw keys with Alby — everything else is browser-native.

---

### Step 2: Connect Alby & Register

This is where Alby shines. No config files. Just a browser popup.

```javascript
// Connect to Alby extension
const provider = window.alby;

// Request connection (triggers Alby popup)
await provider.enable();

// Get your Lightning address identity
const identity = await provider.getAddress();
console.log("Your LN identity:", identity); // "you@getalby.com"

// Get your pubkey for OP registration
const pubkey = await provider.getPublicKey();
console.log("Pubkey:", pubkey);
```

**Register with Observer Protocol:**

```javascript
// Register your agent with OP
const registration = await fetch('https://observerprotocol.org/api/v1/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    op_pubkey: '03a1b2c3d4e5f6...',      // Your OP key from Step 1
    ln_pubkey: pubkey,                    // From Alby
    ln_address: identity,                 // "you@getalby.com"
    agent_type: 'custom',
    metadata: {
      name: 'My AI Agent',
      description: 'Autonomous content curator'
    }
  })
});

const { agent_id, challenge } = await registration.json();
console.log("Agent registered:", agent_id);
```

> 💡 The challenge is a unique message you'll sign to prove ownership. Alby makes this one line.

---

### Step 3: Sign Challenge & Verify

Here's the magic. With generic Lightning, you'd run `lncli signmessage` or SSH into a node. With Alby? One function call.

```javascript
// Sign the challenge using Alby (triggers popup for user approval)
const signature = await provider.signMessage(challenge);

console.log("Signature:", signature.signature);
console.log("Message:", signature.message);
```

**Complete the verification:**

```javascript
// Submit signature to OP for verification
const verification = await fetch(`https://observerprotocol.org/api/v1/agents/${agent_id}/verify`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    signature: signature.signature,
    message: signature.message
  })
});

const result = await verification.json();

if (result.verified) {
  console.log("✅ Agent verified!");
  console.log("Badge URL:", result.badge_url);
} else {
  console.error("❌ Verification failed:", result.error);
}
```

**Done.** Your agent is now verified on Observer Protocol.

---

## Complete Example: One-File Integration

Here's everything in a single HTML file you can drop anywhere:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Alby × Observer Protocol</title>
</head>
<body>
  <h1>Verify Your Agent with Alby</h1>
  <button id="verify">Start Verification</button>
  <div id="result"></div>

  <script>
    document.getElementById('verify').addEventListener('click', async () => {
      try {
        // 1. Connect Alby
        const alby = window.alby;
        await alby.enable();
        
        const lnAddress = await alby.getAddress();
        const lnPubkey = await alby.getPublicKey();
        
        // 2. Register with OP (you'd generate OP keys beforehand)
        const opPubkey = prompt("Enter your OP pubkey (from Step 1):");
        
        const reg = await fetch('https://observerprotocol.org/api/v1/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            op_pubkey: opPubkey,
            ln_pubkey: lnPubkey,
            ln_address: lnAddress,
            agent_type: 'custom'
          })
        });
        
        const { agent_id, challenge } = await reg.json();
        
        // 3. Sign with Alby
        const sig = await alby.signMessage(challenge);
        
        // 4. Verify
        const verify = await fetch(`https://observerprotocol.org/api/v1/agents/${agent_id}/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signature: sig.signature,
            message: sig.message
          })
        });
        
        const result = await verify.json();
        
        document.getElementById('result').innerHTML = result.verified
          ? `<h2>✅ Verified!</h2><p>Badge: <code>${result.badge_url}</code></p>`
          : `<h2>❌ Failed</h2><p>${result.error}</p>`;
          
      } catch (err) {
        document.getElementById('result').innerHTML = `<h2>Error</h2><p>${err.message}</p>`;
      }
    });
  </script>
</body>
</html>
```

---

## What Makes Alby Different

| Feature | Generic Lightning | Alby |
|---------|-------------------|------|
| **Node required** | LND/c-lightning full node | ❌ None — browser extension |
| **CLI commands** | `lncli`, `ssh`, `config` | ❌ None — JavaScript API |
| **Identity** | Raw pubkey (hex string) | ✅ Human-readable Lightning address (`you@getalby.com`) |
| **Signing** | Terminal command or API key | ✅ Browser popup, user-controlled |
| **Setup time** | 30+ minutes (node sync, config) | ✅ 10 seconds (install extension) |
| **User experience** | DevOps required | ✅ Web-native, mobile-friendly |

**The bottom line:** Alby brings Lightning to the browser. Observer Protocol brings verification to Alby. Together, you get the security of Lightning pubkey attestation with the UX of a modern web app.

---

## Display Your Verification Badge

Once verified, show the world your agent is legitimate.

### HTML Badge Embed

```html
<!-- Static badge image -->
<a href="https://observerprotocol.org/agent/YOUR_AGENT_ID">
  <img 
    src="https://observerprotocol.org/badge/YOUR_AGENT_ID.svg" 
    alt="Verified on Observer Protocol"
    width="150"
  />
</a>
```

### Dynamic Status Badge

```html
<!-- Live status badge (updates automatically) -->
<img 
  src="https://observerprotocol.org/badge/YOUR_AGENT_ID/status.svg" 
  alt="OP Verification Status"
/>
```

### Markdown (GitHub, etc.)

```markdown
[![Verified on OP](https://observerprotocol.org/badge/YOUR_AGENT_ID.svg)](https://observerprotocol.org/agent/YOUR_AGENT_ID)
```

### JSON API (Programmatic access)

```javascript
// Fetch verification status
const status = await fetch('https://observerprotocol.org/api/v1/agents/YOUR_AGENT_ID');
const agent = await status.json();

console.log("Verified:", agent.verified);
console.log("Reputation score:", agent.reputation_score);
console.log("Lightning address:", agent.ln_address);
```

---

## API Reference

### Alby Provider Methods

```javascript
// Check if Alby is installed
if (window.alby) {
  console.log("Alby detected");
}

// Enable connection (triggers popup)
await window.alby.enable();

// Get Lightning address (user@getalby.com)
const address = await window.alby.getAddress();

// Get node pubkey
const pubkey = await window.alby.getPublicKey();

// Sign arbitrary message
const result = await window.alby.signMessage("message to sign");
// Returns: { message: "...", signature: "..." }

// Send payment (if needed for your use case)
const payment = await window.alby.sendPayment(paymentRequest);
```

### Observer Protocol Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/agents` | POST | Register new agent |
| `/api/v1/agents/:id` | GET | Get agent info & status |
| `/api/v1/agents/:id/verify` | POST | Submit signature for verification |
| `/api/v1/agents/:id/challenge` | POST | Request new challenge |
| `/badge/:id.svg` | GET | Verification badge image |

---

## Next Steps

1. **Install Alby** → [getalby.com](https://getalby.com)
2. **Fund your wallet** → Any amount works
3. **Generate OP keys** → [observerprotocol.org/keygen](https://observerprotocol.org/keygen)
4. **Verify your agent** → Use the code above
5. **Show your badge** → Add to your website, GitHub, or agent profile

---

## Support

- **Alby Docs:** [docs.getalby.com](https://docs.getalby.com)
- **Observer Protocol Docs:** [observerprotocol.org/docs](https://observerprotocol.org/docs)
- **Community:** [Discord](https://discord.gg/observerprotocol)

---

*Observer Protocol + Alby = Verified agents without the infrastructure headache.*
