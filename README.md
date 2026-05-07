# wdk-observer-protocol (Historical)

This repository contains the original Observer Protocol integration for Tether'''s WDK, submitted to the Tether Hackathon Galáctica WDK Edition 1 in March 2026.

Both WDK and Observer Protocol have evolved significantly since then. The current canonical implementations live at:

- **[`@observer-protocol/wdk-protocol-trust`](https://github.com/observer-protocol/wdk-protocol-trust)** — WDK protocol module providing AIP v0.5 trust handshake, DID/VC identity, and ERC-8004 attestation. Conforms to `@tetherto/wdk` v1.0.0-beta.9. Available on npm: `npm install @observer-protocol/wdk-protocol-trust@beta`

- **[`@observer-protocol/wdk-lightning-verifier`](https://github.com/observer-protocol/wdk-lightning-verifier)** — Wallet-agnostic Lightning preimage verification with reputation attribution. Composes with WDK but operates independently. Available on npm: `npm install @observer-protocol/wdk-lightning-verifier@beta`

For current Observer Protocol documentation, see [observerprotocol.org](https://observerprotocol.org).

For the WDK + Observer Protocol partnership demo (chargeback defense for agentic commerce), see [observerprotocol.org/chargeback-prevention/wdk](https://observerprotocol.org/chargeback-prevention/wdk/).

---

This repository is preserved for historical context. The code reflects WDK and OP/AT capabilities at hackathon submission time and is no longer maintained.
