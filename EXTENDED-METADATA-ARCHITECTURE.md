# Observer Protocol Extended Metadata Store — Discussion Archive

**Date:** March 22, 2026  
**Context:** Post-Corpo integration, planning for multi-partner identity aggregation

---

## Background

The `legal_entity_id` field was successfully deployed for Corpo integration (Wyoming DAO LLC linking). This sparked discussion about architecting for 10+ future partners without schema bloat.

---

## The Challenge

**Claude's observation:** If 95% of agents have 2-3 fields populated and the rest are null, a fixed schema with 15+ optional columns becomes unwieldy.

**The question:** How to support KYC providers, DNS verification, AI platform attestations, reputation scores, etc. without endless schema migrations?

---

## Proposed Solution: Key-Value Metadata Store

```json
{
  "agent_id": "abc123",
  "public_key_hash": "sha256...",
  "alias": "MyAgent",
  "extended_metadata": {
    "legal_entity_id": "e_corpo_12345",
    "persona_kyc_credential": "cred_persona_abc",
    "ens_name": "myagent.eth",
    "worldcoin_human_verification": "proof_xyz",
    "gitcoin_passport_score": 42,
    "claude_verified_deployment": true
  }
}
```

**Benefits:**
- No schema changes for new partner integrations
- Flexible field types (string, boolean, number)
- Partners define their own key namespace
- OP remains the canonical lookup layer

---

## Strategic Value (The Moat)

**Claude's framing:** Once OP has 20+ partners with registered field types, the registry becomes dramatically stickier.

Resource servers don't just check "is this agent verified?" They check:
- Is this agent cryptographically verified? (OP core)
- Does it have a Corpo legal entity?
- KYC credential from Persona/Synaps?
- DNS/domain verification?
- Reputation score from Gitcoin?
- AI platform verification (Claude/GPT deployment)?

**All in a single lookup.**

This transforms OP from "a registry" to "the canonical identity attribute aggregator for AI agents."

---

## Partner Categories Identified

| Category | Examples | Field Key Pattern |
|----------|----------|-------------------|
| **Legal Entity** | Corpo | `legal_entity_id` |
| **KYC/AML** | Persona, Synaps, Sumsub, Jumio | `{provider}_kyc_credential` |
| **Domain/DNS** | ENS, Unstoppable Domains, Handshake | `{provider}_domain` |
| **AI Platform** | Anthropic, OpenAI, LangChain, CrewAI | `{platform}_verified_deployment` |
| **Blockchain Identity** | Worldcoin, Civic, Polygon ID, Cheqd | `{protocol}_proof` |
| **Financial** | Strike, River, Bitso, Alby | `{service}_account` |
| **Reputation** | Gitcoin Passport, Orange Protocol | `{provider}_score` |

---

## Implementation Timeline (Proposed)

| Phase | Trigger | Action |
|-------|---------|--------|
| **Phase 1** | Now | Keep `legal_entity_id` fixed column (Corpo integration live) |
| **Phase 2** | ~5-10 partners | Add `extended_metadata` JSONB column alongside fixed fields |
| **Phase 3** | ~15+ partners | Migrate legacy fields to KV store; new partners use metadata only |
| **Phase 4** | 20+ partners | OP becomes the canonical identity aggregator; full ecosystem lock-in |

---

## Consensus

**Decision:** Deploy fixed column for Corpo (immediate need), architect KV store for scale (future need).

**Rationale:**
- Don't break what's working
- Don't delay warm lead response for architecture
- Build toward the 20-partner vision incrementally
- Each partner added increases ecosystem stickiness

**Boyd's summary:** "Exactly. We don't need it yet. But if we start reaching out to a dozen+ potential collaborators, it would make sense to do it."

---

## Open Questions

1. **Key namespacing:** Do we enforce `{provider}_{field}` pattern or allow arbitrary keys?
2. **Validation:** Store everything as strings or support typed values (number, boolean, object)?
3. **Verification proofs:** Should metadata include signed attestations or just references?
4. **Querying:** Do we need to index specific metadata fields for filtering/search?
5. **Partner registration:** Formal process for partners to register their field keys in OP docs?

---

## Related Files

- `legal_entity_id` implementation: `/agentic-terminal-db/api/main.py`
- Partner outreach log: `/outreach-log.json`
- Corpo integration test: `agent_id` with `legal_entity_id: "e_test_corpo_12345"`

---

*Documented: March 22, 2026*  
*Status: Architecture proposal, pending Phase 2 trigger (~5-10 partners)*
