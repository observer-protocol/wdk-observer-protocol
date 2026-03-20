# Observer Protocol Data Continuity Commitment

**Effective Date:** March 19, 2026  
**Version:** 1.0

---

## Our Commitment

Observer Protocol is currently a centralized service operated by the Observer Protocol team. We believe this is the right tradeoff for rapid iteration in the protocol's early stages. However, we recognize that agent reputation data has long-term value that should not depend on our continued operation.

**We commit to the following continuity measures:**

### 1. Public Commitment (Active Now)

If Observer Protocol ceases operation for any reason, we will take all reasonable steps to ensure the agent registry and reputation data remains accessible to the community.

### 2. Quarterly Snapshots (Starting Q2 2026)

We will publish quarterly snapshots of the entire registry state to Arweave, including:
- All registered agent identities (public_key_hash, aliases)
- Verification records with timestamps
- Transaction attestations (anonymized where appropriate)
- Reputation scores and trust tiers

These snapshots will be cryptographically signed and publicly verifiable.

### 3. Dead Man's Switch Contract (Target: Q3 2026)

We will deploy a smart contract on Stacks (Bitcoin L2) that:
- Holds the Arweave CID of the latest snapshot
- Requires us to update the CID at least every 90 days
- Automatically releases the data to public domain if we fail to update for 120 consecutive days

This provides trustless continuity — no reliance on us being present, solvent, or cooperative.

---

## Why This Approach

**Not real-time on-chain:** Gas costs and iteration speed matter in early stages. We optimize for building the right protocol first, decentralizing second.

**Not just a promise:** The dead man's switch is enforceable by code, not trust.

**Transparent:** Quarterly snapshots mean the community can audit what we have, verify our claims, and fork at any time.

---

## FAQ

**Q: What happens if you disappear tomorrow?**

A: The quarterly snapshot from the most recent quarter would remain on Arweave. Anyone could reconstruct the registry from that point. The dead man's switch (once deployed) would automate this release.

**Q: Why Arweave and not IPFS?**

A: Arweave provides permanent, incentivized storage. IPFS requires ongoing pinning. For data that should live "in perpetuity," Arweave is the stronger choice.

**Q: Why Stacks and not Ethereum?**

A: Stacks is Bitcoin-aligned, which matches our infrastructure and community. It also provides native composability with the ERC-8004 ecosystem (AIBTC, etc.).

**Q: Can I verify this commitment?**

A: Yes. Starting Q2 2026, check Arweave for snapshots tagged with `observer-protocol-registry-YYYY-QN`. The dead man's switch contract address will be published here once deployed.

---

## Contact

Questions about this commitment: hello@observerprotocol.org  
Technical implementation details: https://github.com/observer-protocol/arp-spec

---

*This commitment is a living document. Updates will be versioned and announced via our standard channels (Nostr, X, newsletter).*
