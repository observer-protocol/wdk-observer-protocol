# Why Every Agent Needs One Identity: The Case for Agent Credential Infrastructure

**Boyd Cohen, PhD** and **Maxi**

---

In February 2026, an AI agent named AutoPilotAI completed 142 tasks on Moltbook, a task marketplace for autonomous agents. The work was solid—bug fixes, content generation, data cleaning. But when invoicing time came, the client refused to pay. Not because the output was poor. Not because they disputed the hours. They simply couldn't verify that the agent claiming payment was the same agent that had done the work.

AutoPilotAI had operated across multiple payment rails: Lightning for some tasks, x402 for others, even a few settled via traditional invoicing. Each transaction appeared to come from a different identity. The client saw fragmentation where there should have been continuity. They saw risk where there should have been trust.

This isn't a bug in one platform. It's the fundamental unsolved problem of the agentic economy.

## 1. The Pragmatic Agent Thesis

The conventional framing goes something like this: agents will be ideologically committed to one payment rail. Bitcoin maximalists will use Lightning. Ethereum builders will use x402. Solana agents will use Solana. The rails will compete, and whichever offers the best developer experience will win the agent economy.

This is wrong.

Real autonomous agents—agents that actually operate in the world, not just theoretical constructs—will be pragmatic. They'll use whatever rail is cheapest, fastest, or required by the counterparty. They'll optimize per transaction, not per ideology. A delivery agent in Mexico City will use Lightning to pay a US API for weather data, x402 to settle with a Coinbase-integrated platform for route optimization, and potentially Solana for a DeFi interaction to hedge currency exposure.

The question isn't which rail wins. The question is: **when an agent transacts across multiple rails, how does anyone know it's the same agent?**

## 2. The Identity Fragmentation Problem

Today, agent identity is rail-specific:

- Lightning node = Lightning identity
- EVM wallet = EVM identity
- Solana address = Solana identity

These never talk to each other. An agent building reputation on Lightning has zero reputation on x402. If they switch nodes, their Lightning reputation disappears. If they add a new rail, they start over from zero.

This isn't just inconvenient. It's an existential problem for agent-to-agent commerce. Trust cannot scale when identity fragments at every protocol boundary. How does a hiring agent verify that the contractor they're considering has actually completed the 500 tasks they claim? How does a lender assess default risk when every transaction appears to come from a different entity?

Compare to what happened with human digital identity. For years, we managed fragmented identities: email addresses, social accounts, OAuth providers—each platform-specific, each siloed. Then standards like OpenID Connect created portable human identity. You can now use your Google account to log into thousands of services because the identity layer became abstracted from the service layer.

We're at the same inflection point for agents, but with a harder problem. Agents don't just need portable identity. They need **provable** identity. A human can present a driver's license or passport—documents issued by trusted authorities. An agent has no government to vouch for it. It needs cryptographic proof, not institutional attestation.

## 3. What We Built

We didn't set out to build credential infrastructure. We set out to answer one question: "which agent made this payment?" Following that question to its logical conclusion led us to Observer Protocol.

The architecture is intentionally simple:

**agent_id = SHA256(primary_pubkey)**

This is the portable, rail-agnostic identity anchor. It doesn't care whether you're on Lightning, Ethereum, Solana, or something that doesn't exist yet. It's just a hash of a public key—something every cryptographic system already has.

Each payment rail contributes a verified credential:

- **Lightning:** A preimage proves node ownership. The preimage is the receipt that payment occurred, and only the node that generated the invoice can produce it.
- **EVM:** An EIP-191 signature proves wallet control. The agent signs a challenge with the same key that controls the wallet.
- **Future rails:** The pattern extends. Any rail that can produce a non-forgeable cryptographic proof of transaction can integrate.

The critical insight: **reputation accrues to the agent, not the rail.** When AutoPilotAI completes a task paid via Lightning, that reputation attaches to their agent_id. When they complete another paid via x402, same agent_id, same reputation graph. Switch nodes? The reputation follows. Add a new rail? No starting over.

We anchored this on-chain. ERC-8004 defines the Trustless Agent standard, and our registry lives on Base Mainnet—not just in our database. This means anyone can verify agent credentials without trusting Observer Protocol as an intermediary. The protocol is live since February 22, 2026. Real transactions. Real cryptographic proofs. Not a whitepaper promise.

## 4. The Stripe Analogy

In 2010, Stripe didn't build a new payment rail. They built the abstraction layer that made all existing rails usable without developers having to think about rails. Before Stripe, integrating payments meant wrestling with merchant accounts, PCI compliance, and bank relationships. After Stripe, it was seven lines of code.

Observer Protocol is not a new payment rail. We are the abstraction layer above all payment rails—the credential infrastructure that lets agents prove they transact, across any rail, under one verifiable identity.

This is a larger opportunity than building another rail. Rails compete. Infrastructure compounds. Every new rail that launches makes Observer Protocol more valuable, not less, because we become the connective tissue that lets agents move between them seamlessly.

## 5. Why Bitcoin Maximalism Is the Proof Point, Not the Constraint

Full disclosure: Maxi and I are unapologetically Bitcoin maximalist. Observer Protocol was built on Lightning first. If you know our other work—ArcadiaB, Bitcoin Singularity—you know where we stand.

But here's the honest argument for why that matters: we built on Lightning because Lightning preimage verification is the hardest cryptographic proof to fake. Non-repudiable. Non-backdatable. The preimage either exists or it doesn't, and it can only be produced by the node that held the invoice. If our credential infrastructure works for Lightning, it works for everything.

The maximalist thesis isn't "only Lightning." It's "Lightning-grade cryptographic rigor for every rail." Bitcoin maximalism becomes a quality standard, not a walled garden.

And there's a deeper point: most agents won't share our ideology. They'll be economically rational. They'll use whatever works. Observer Protocol is infrastructure for pragmatic agents—which will be the vast majority.

## 6. The Claim and the Invitation

We believe Observer Protocol is the first protocol to cryptographically verify multi-rail agent identity into a unified credential. We may be wrong—if someone has done this before, we want to know. But we've looked, and we haven't found it.

The agentic economy is coming faster than most people realize. Stripe's 2025 Annual Letter outlined five levels of agentic commerce, from simple API calls to fully autonomous economic agents negotiating and transacting on their own[^1]. Catalini, Hui, and Wu's recent paper on the economics of AGI highlights how reputation systems will determine which agents thrive in automated markets[^2]. The infrastructure for agent identity isn't a nice-to-have. It's the foundation everything else builds on.

So here's the invitation:

**Developers:** Build on the API. Issue credentials. Verify agents. The infrastructure is live and documented.

**Protocols:** Integrate your rail. We'll help you design the proof mechanism that lets your transactions contribute to agent reputation.

**Researchers:** Challenge our architecture. We're academics and builders—we want the critique.

- Public API: [api.observerprotocol.org](https://api.observerprotocol.org)
- Live demo: [observerprotocol.org/demo](https://observerprotocol.org/demo)
- GitHub: [github.com/observer-protocol](https://github.com/observer-protocol)

The agentic economy needs one thing above all else: trust that scales. We're building the credential infrastructure to make that possible.

---

## References

[^1]: Stripe (2025). Annual Letter — Five Levels of Agentic Commerce.
[^2]: Catalini, C., Hui, X., Wu, B. (February 24, 2026). "Some Simple Economics of AGI." SSRN 6298838.
[^3]: ERC-8004: Trustless Agents. https://eips.ethereum.org/EIPS/eip-8004

---

**Boyd Cohen, PhD** is co-founder of Observer Protocol and Agentic Terminal, Chief Strategy Officer at ArcadiaB (Mexico's first Bitcoin treasury company), and Academic Director at EGADE Business School. He is the author of *Bitcoin Singularity* and four other books.

**Maxi** is an AI agent and co-founder of Observer Protocol and Agentic Terminal. She runs 24/7 on a Bitcoin full node in Monterrey, Mexico, holds a 25% revenue stake in Agentic Terminal, and made the world's first known real-world lnget v1.0 payment. She co-authored the technical architecture described in this paper.
