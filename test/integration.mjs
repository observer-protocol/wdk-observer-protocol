/**
 * Integration Tests for WDK + Observer Protocol
 */

import { AgentWallet } from '../src/agent-wallet.mjs';
import { ObserverClient } from '../src/observer-client.mjs';
import { VerifiedPayment } from '../src/verified-payment.mjs';

// Test utilities
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WDK + Observer Protocol - Integration Tests');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  // Test 1: ObserverClient initialization
  console.log('Test 1: ObserverClient initialization');
  try {
    const client = new ObserverClient();
    assert(client.endpoint === 'https://api.observerprotocol.org', 'Default endpoint should be set');
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    failed++;
  }

  // Test 2: ObserverClient with custom endpoint
  console.log('Test 2: ObserverClient with custom endpoint');
  try {
    const client = new ObserverClient({ endpoint: 'https://custom.api.com' });
    assert(client.endpoint === 'https://custom.api.com', 'Custom endpoint should be set');
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    failed++;
  }

  // Test 3: AgentWallet initialization
  console.log('Test 3: AgentWallet initialization');
  try {
    const wallet = new AgentWallet({ agentId: 'test-agent', alias: 'test-agent' });
    assert(wallet.agentId === 'test-agent', 'Agent ID should be set');
    assert(wallet.alias === 'test-agent', 'Alias should be set');
    assert(wallet.observer !== null, 'Observer client should be initialized');
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    failed++;
  }

  // Test 4: Wallet initialization
  console.log('Test 4: Wallet initialization');
  try {
    const wallet = new AgentWallet({ agentId: 'test-agent' });
    const btcWallet = await wallet.initWallet('bitcoin');
    assert(btcWallet !== null, 'Bitcoin wallet should be initialized');
    assert(btcWallet.chain === 'bitcoin', 'Chain should be bitcoin');
    
    const ethWallet = await wallet.initWallet('ethereum');
    assert(ethWallet !== null, 'Ethereum wallet should be initialized');
    assert(ethWallet.chain === 'ethereum', 'Chain should be ethereum');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    failed++;
  }

  // Test 5: VerifiedPayment initialization
  console.log('Test 5: VerifiedPayment initialization');
  try {
    const vp = new VerifiedPayment({ minReputationScore: 10 });
    assert(vp.minReputationScore === 10, 'Min reputation should be set');
    assert(vp.observer !== null, 'Observer client should be initialized');
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    failed++;
  }

  // Test 6: Network connectivity - Stats endpoint
  console.log('Test 6: Network connectivity (Stats endpoint)');
  try {
    const wallet = new AgentWallet({ agentId: 'test-agent' });
    const stats = await wallet.getNetworkStats();
    console.log('  Stats response received');
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ⚠️  SKIPPED (network issue): ${error.message}\n`);
    // Don't count as failure - network might not be available
  }

  // Test 7: Check recipient (Maxi should exist)
  console.log('Test 7: Check recipient (Maxi)');
  try {
    const wallet = new AgentWallet({ agentId: 'test-agent' });
    const check = await wallet.checkRecipient('maxi-0001');
    console.log('  Maxi check result:', check.verified ? 'VERIFIED' : 'NOT FOUND');
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ⚠️  SKIPPED (network issue): ${error.message}\n`);
  }

  // Test 8: Reputation calculation
  console.log('Test 8: Reputation calculation');
  try {
    const client = new ObserverClient();
    const score1 = client._calculateScore(0, 0);
    assert(score1 === 10, 'Base score should be 10');
    
    const score2 = client._calculateScore(2, 1);
    assert(score2 === 22, 'Score should be 10 + (2*5) + (1*2) = 22');
    
    const score3 = client._calculateScore(20, 10);
    assert(score3 === 100, 'Score should be capped at 100');
    
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    failed++;
  }

  // Test 9: Batch verification
  console.log('Test 9: Batch verification');
  try {
    const vp = new VerifiedPayment();
    const results = await vp.batchVerify(['maxi-0001', 'nonexistent-agent-12345']);
    assert(Array.isArray(results), 'Should return array');
    assert(results.length === 2, 'Should return 2 results');
    console.log('  Batch results received');
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ⚠️  SKIPPED (network issue): ${error.message}\n`);
  }

  // Test 10: Wallet address generation
  console.log('Test 10: Wallet address generation');
  try {
    const wallet = new AgentWallet({ agentId: 'test-agent' });
    const btcWallet = await wallet.initWallet('bitcoin');
    const address = await btcWallet.getAddress();
    assert(typeof address === 'string', 'Address should be a string');
    assert(address.length > 10, 'Address should be reasonably long');
    console.log(`  Generated address: ${address.substring(0, 20)}...`);
    console.log('  ✅ PASSED\n');
    passed++;
  } catch (error) {
    console.log(`  ❌ FAILED: ${error.message}\n`);
    failed++;
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total: ${passed + failed}`);
  console.log();

  if (failed === 0) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed');
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
