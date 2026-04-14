# Leo Bebchuk — Test Agent Provisioning
## Observer Protocol AIP v0.3.1 Testing Environment

**Provisioned:** April 6, 2026  
**Test Agent ID:** `leo-test-agent-001`  
**Environment:** Testnet  
**AIP Version:** 0.3.1

---

## 🔑 Your API Credentials

```json
{
  "agent_id": "leo-test-agent-001",
  "api_key": "op_api_leo_test_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c",
  "did": "did:web:observerprotocol.org:agents:leo-test-agent-001",
  "org_did": "did:web:observerprotocol.org:orgs:test-org-leo"
}
```

**Important:** Store this API key securely. It has read/write access to the test environment.

---

## 🌐 API Endpoints

Base URL: `https://api.observerprotocol.org`

### 1. DID Resolution (Public)
```
GET /api/v1/resolve/{did}
```
**Test:** Resolve your agent's DID
```bash
curl https://api.observerprotocol.org/api/v1/resolve/did:web:observerprotocol.org:agents:leo-test-agent-001
```

### 2. KYB Credential Issuance (Authenticated)
```
POST /aip/credentials/kyb
Authorization: Bearer {api_key}
```
**Request body:**
```json
{
  "org_did": "did:web:observerprotocol.org:orgs:test-org-leo",
  "kyb_provider": "TestProvider",
  "kyb_result": "pass"
}
```

### 3. Delegation Credential Issuance (Authenticated)
```
POST /aip/credentials/delegation
Authorization: Bearer {api_key}
```
**Request body:**
```json
{
  "issuer": {
    "org_did": "did:web:observerprotocol.org:orgs:test-org-leo",
    "org_name": "Leo Test Org"
  },
  "subject": {
    "agent_did": "did:web:observerprotocol.org:agents:leo-test-agent-001"
  },
  "scope": {
    "payment_settlement": true,
    "max_transaction_value_usd": 10000,
    "allowed_counterparty_types": ["verified_merchant", "did_verified_agent"],
    "allowed_rails": ["lightning", "x402"]
  },
  "expires_at": "2026-10-06T23:59:59Z"
}
```

### 4. Revocation (Authenticated)
```
POST /aip/revoke
Authorization: Bearer {api_key}
```
**Request body:**
```json
{
  "credential_id": "{your-credential-id}",
  "revoked_by": "did:web:observerprotocol.org:orgs:test-org-leo#revocation-key",
  "reason": "agent_compromised"
}
```

### 5. Chain Verification (Authenticated)
```
GET /aip/chain/verify/{agent_id}
Authorization: Bearer {api_key}
```

### 6. Credential Viewer (Authenticated)
```
GET /api/v1/credentials/{agent_did}
Authorization: Bearer {api_key}
```

### 7. Credential Status Check (Authenticated)
```
GET /api/v1/credential-status/{credential_id}
Authorization: Bearer {api_key}
```

### 8. Type Registry Access
```
GET /aip/type-registry/{category}
```
**Categories:** `allowed_counterparty_types`, `revocation_reason`, `denial_reason`

---

## 🧪 Testing Checklist

### Phase 1: Basic Identity (Public)
- [ ] Resolve your DID: `GET /api/v1/resolve/did:web:observerprotocol.org:agents:leo-test-agent-001`
- [ ] Verify JSON-LD structure returned
- [ ] Test malformed DID → 400 error
- [ ] Test non-existent DID → 404 error

### Phase 2: Credential Issuance (Authenticated)
- [ ] Issue a KYB VC for your test org
- [ ] Issue a Delegation Credential for your test agent
- [ ] Verify credentials appear in the Credential Viewer
- [ ] Test validation errors (invalid scope values)

### Phase 3: Delegation Chain (Authenticated)
- [ ] Create a 2-level delegation chain (org → sub-org → agent)
- [ ] Verify eager chain verification works
- [ ] Test max delegation depth (3 levels)
- [ ] Verify domain mismatch detection

### Phase 4: Revocation (Authenticated)
- [ ] Revoke a Delegation Credential
- [ ] Verify cascade to sub-delegations
- [ ] Check credential status shows "revoked"
- [ ] Test with invalid reason code → 400 error

### Phase 5: Remediation (Authenticated)
- [ ] Request a transaction denial with remediation
- [ ] Verify minimal envelope structure returned
- [ ] Confirm options array is empty (AT-layer responsibility)

### Phase 6: Type Registry
- [ ] Query all three registry categories
- [ ] Verify enumerated values match spec
- [ ] Test invalid category → 400 error

---

## 🐛 Known Test Environment Limitations

1. **Payment rails:** Testnet only (no real Lightning/x402 payments)
2. **KYB providers:** Mock providers only (MoonPay integration not active)
3. **Email notifications:** Disabled
4. **Rate limits:** 1000 requests/hour for test keys

---

## 📚 Reference Materials

- **AIP v0.3.1 Spec:** `/home/futurebit/.openclaw/workspace/media/inbound/AIP_v0.3.1---65ad2c5a-f2b5-4ba6-bd10-79470808f7b1`
- **Implementation Code:** `/home/futurebit/.openclaw/workspace/observer-protocol/aip_*.py`
- **Test Suite:** `/home/futurebit/.openclaw/workspace/observer-protocol/test_aip.py`

---

## 🆘 Support

For issues or questions:
1. Check implementation: `aip_api.py`, `aip_core.py`, `aip_manager.py`
2. Run test suite: `python test_aip.py`
3. Contact: Maxi (@maxi-0001) or Boyd (boyd@arcadiab.com)

---

**Happy testing!** 🚀
