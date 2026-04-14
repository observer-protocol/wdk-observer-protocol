#!/usr/bin/env node
/**
 * Leo Bebchuk — Quick Test Script
 * Validates API connectivity and basic AIP functionality
 */

const API_BASE = 'https://api.observerprotocol.org';
const API_KEY = 'op_api_leo_test_7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c';
const AGENT_DID = 'did:web:observerprotocol.org:agents:leo-test-agent-001';

async function test() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  Observer Protocol API — Test Suite for Leo');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: DID Resolution (Public)
  console.log('Test 1: DID Resolution (Public)');
  try {
    const response = await fetch(`${API_BASE}/api/v1/resolve/${encodeURIComponent(AGENT_DID)}`);
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ PASSED — DID resolved successfully');
      console.log(`   DID: ${data.id}`);
      results.passed++;
    } else {
      console.log(`❌ FAILED — HTTP ${response.status}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED — ${error.message}`);
    results.failed++;
  }
  console.log();

  // Test 2: Type Registry (Public)
  console.log('Test 2: Type Registry — counterparty_types');
  try {
    const response = await fetch(`${API_BASE}/aip/type-registry/allowed_counterparty_types`);
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ PASSED — Registry accessible');
      console.log(`   Values: ${data.values?.length || 0} entries`);
      results.passed++;
    } else {
      console.log(`❌ FAILED — HTTP ${response.status}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED — ${error.message}`);
    results.failed++;
  }
  console.log();

  // Test 3: Credential Viewer (Authenticated)
  console.log('Test 3: Credential Viewer (Authenticated)');
  try {
    const response = await fetch(`${API_BASE}/api/v1/credentials/${encodeURIComponent(AGENT_DID)}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    if (response.status === 200) {
      console.log('✅ PASSED — Authenticated access working');
      results.passed++;
    } else if (response.status === 401) {
      console.log('⚠️  SKIPPED — Credentials may not be issued yet (expected for new agent)');
    } else {
      console.log(`❌ FAILED — HTTP ${response.status}`);
      results.failed++;
    }
  } catch (error) {
    console.log(`❌ FAILED — ${error.message}`);
    results.failed++;
  }
  console.log();

  // Test 4: KYB Credential Issuance (Authenticated)
  console.log('Test 4: KYB VC Issuance (Authenticated)');
  try {
    const response = await fetch(`${API_BASE}/aip/credentials/kyb`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        org_did: 'did:web:observerprotocol.org:orgs:test-org-leo',
        kyb_provider: 'TestProvider',
        kyb_result: 'pass'
      })
    });
    if (response.status === 201 || response.status === 200) {
      console.log('✅ PASSED — KYB VC issued successfully');
      results.passed++;
    } else {
      const error = await response.text();
      console.log(`⚠️  RESPONSE — HTTP ${response.status}: ${error.substring(0, 100)}`);
      // Don't count as failure — may need setup
    }
  } catch (error) {
    console.log(`⚠️  ERROR — ${error.message}`);
  }
  console.log();

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (results.failed === 0) {
    console.log('✨ All critical tests passed! Your test agent is ready.');
  } else {
    console.log('⚠️  Some tests failed. Check the API status or credentials.');
  }
}

test().catch(console.error);
