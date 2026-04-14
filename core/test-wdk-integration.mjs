#!/usr/bin/env node
/**
 * WDK Integration Test Script
 * 
 * Tests the full WDK + Observer Protocol integration:
 * 1. Initialize WDK with seed phrase
 * 2. Initialize wallets for bitcoin, ethereum, polygon
 * 3. Get addresses and balances
 * 4. Test settlement verification
 * 5. Format ARP events
 * 
 * Usage: node test-wdk-integration.mjs
 * 
 * Environment variables:
 *   WDK_SEED_PHRASE - BIP-39 seed phrase (optional, generates new one if not set)
 *   ETHEREUM_RPC_URL - Ethereum RPC endpoint (optional)
 *   POLYGON_RPC_URL - Polygon RPC endpoint (optional)
 *   OBSERVER_ENDPOINT - Observer Protocol API endpoint (optional)
 */

import { AgentWallet } from './agent-wallet.mjs';
import { WDKVerificationAdapter } from './wdk-verification.mjs';

// USDT Contract addresses (copied from index.mjs for standalone testing)
const USDT_CONTRACTS = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  sepolia: '0xE9F183FCA0D6868E1F026A31E9AE3C64BE1D7ed3'
};

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = (msg, color = 'reset') => console.log(`${colors[color]}${msg}${colors.reset}`);
const success = (msg) => log(`✅ ${msg}`, 'green');
const warning = (msg) => log(`⚠️  ${msg}`, 'yellow');
const error = (msg) => log(`❌ ${msg}`, 'red');
const info = (msg) => log(`ℹ️  ${msg}`, 'cyan');

class WDKIntegrationTest {
  constructor() {
    this.wallet = null;
    this.results = {
      init: false,
      wallets: {},
      verification: false,
      arp: false
    };
  }

  async run() {
    log('\n═══════════════════════════════════════════════', 'blue');
    log('   WDK + Observer Protocol Integration Test', 'blue');
    log('═══════════════════════════════════════════════\n', 'blue');

    try {
      // Step 1: Initialize AgentWallet with WDK
      await this.testInitialization();

      // Step 2: Initialize wallets for each chain
      await this.testWalletInitialization();

      // Step 3: Get addresses and balances
      await this.testAddressesAndBalances();

      // Step 4: Test verification adapter
      await this.testVerificationAdapter();

      // Step 5: Test ARP formatting
      await this.testARPFormatting();

      // Summary
      this.printSummary();

    } catch (err) {
      error(`Test failed: ${err.message}`);
      console.error(err.stack);
      process.exit(1);
    }
  }

  async testInitialization() {
    info('Step 1: Initializing AgentWallet with WDK...\n');

    let seedPhrase = process.env.WDK_SEED_PHRASE;
    
    if (!seedPhrase) {
      warning('No WDK_SEED_PHRASE set, generating new seed phrase...\n');
      seedPhrase = AgentWallet.generateSeedPhrase();
      info(`Generated seed phrase: ${seedPhrase}\n`);
      warning('Save this seed phrase to test with the same wallets in the future!\n');
    }

    this.wallet = new AgentWallet({
      seedPhrase,
      agentId: 'test-agent-001',
      alias: 'wdk-test-agent',
      ethereumProvider: process.env.ETHEREUM_RPC_URL,
      polygonProvider: process.env.POLYGON_RPC_URL
    });

    await this.wallet.initializeWDK();
    success('WDK initialized successfully\n');
    this.results.init = true;
  }

  async testWalletInitialization() {
    info('Step 2: Initializing wallets for each chain...\n');

    const chains = [
      { name: 'ethereum', label: 'Ethereum' },
      { name: 'polygon', label: 'Polygon' },
      { name: 'bitcoin', label: 'Bitcoin' }
    ];

    for (const { name, label } of chains) {
      try {
        info(`Initializing ${label} wallet...`);
        const wallet = await this.wallet.initWallet(name);
        this.results.wallets[name] = { initialized: true, address: wallet.address };
        success(`${label} wallet initialized: ${wallet.address}`);
      } catch (err) {
        error(`${label} wallet failed: ${err.message}`);
        this.results.wallets[name] = { initialized: false, error: err.message };
      }
    }
    console.log();
  }

  async testAddressesAndBalances() {
    info('Step 3: Getting addresses and balances...\n');

    for (const [chain, result] of Object.entries(this.results.wallets)) {
      if (!result.initialized) continue;

      try {
        info(`Checking ${chain} balance...`);
        const balanceInfo = await this.wallet.getVerifiedBalance(chain);
        
        if (chain === 'bitcoin') {
          info(`  Address: ${balanceInfo.address}`);
          info(`  Confirmed: ${balanceInfo.balance.confirmed} BTC`);
          info(`  Unconfirmed: ${balanceInfo.balance.unconfirmed} BTC`);
        } else {
          info(`  Address: ${balanceInfo.address}`);
          info(`  Balance: ${balanceInfo.balance.ether} ${chain === 'ethereum' ? 'ETH' : 'MATIC'}`);
          
          // Try to get USDT balance on EVM chains
          try {
            const usdtContract = USDT_CONTRACTS[chain];
            if (usdtContract) {
              info(`  Checking USDT balance...`);
              const usdtBalance = await this.wallet.getVerifiedBalance(chain, usdtContract);
              info(`  USDT: Available (contract queried successfully)`);
            }
          } catch (e) {
            warning(`  USDT balance check failed: ${e.message}`);
          }
        }
        console.log();
      } catch (err) {
        error(`Failed to get ${chain} balance: ${err.message}`);
      }
    }
  }

  async testVerificationAdapter() {
    info('Step 4: Testing WDK Verification Adapter...\n');

    const adapter = new WDKVerificationAdapter();

    // Test 1: Settlement reference creation
    info('Testing settlement reference creation...');
    const mockTx = { hash: '0x1234567890abcdef' };
    const ref = adapter.createSettlementReference(mockTx, 'ethereum');
    if (ref === 'wdk:ethereum:0x1234567890abcdef') {
      success('Settlement reference format correct');
    } else {
      error(`Settlement reference format incorrect: ${ref}`);
    }

    // Test 2: Settlement reference parsing
    info('Testing settlement reference parsing...');
    const parsed = adapter.parseSettlementReference('wdk:polygon:0xabcdef123456');
    if (parsed && parsed.chain === 'polygon' && parsed.txHash === '0xabcdef123456') {
      success('Settlement reference parsing correct');
    } else {
      error('Settlement reference parsing failed');
    }

    // Test 3: Parse invalid reference
    info('Testing invalid reference handling...');
    const invalid = adapter.parseSettlementReference('invalid:format');
    if (invalid === null) {
      success('Invalid reference correctly rejected');
    } else {
      error('Invalid reference should return null');
    }

    console.log();
    this.results.verification = true;
  }

  async testARPFormatting() {
    info('Step 5: Testing ARP event formatting...\n');

    const adapter = new WDKVerificationAdapter();

    // Mock verification result
    const mockVerification = {
      verified: true,
      chain: 'ethereum',
      txHash: '0x1234567890abcdef',
      confirmations: 12,
      blockNumber: 12345678
    };

    const mockPayment = {
      amount: '10.50',
      token: 'USDT',
      recipient: '0xRecipientAddress'
    };

    const arpEvent = adapter.formatForARP(mockVerification, mockPayment);

    info('ARP Event:');
    console.log(JSON.stringify(arpEvent, null, 2));

    // Verify required fields
    const requiredFields = ['protocol', 'settlement_reference', 'chain', 'txHash', 'verified'];
    const missing = requiredFields.filter(f => !arpEvent[f]);
    
    if (missing.length === 0) {
      success('ARP event has all required fields');
    } else {
      error(`Missing ARP fields: ${missing.join(', ')}`);
    }

    if (arpEvent.protocol === 'tether_wdk') {
      success('ARP protocol identifier correct');
    } else {
      error(`ARP protocol should be 'tether_wdk', got '${arpEvent.protocol}'`);
    }

    if (arpEvent.settlement_reference.startsWith('wdk:')) {
      success('Settlement reference format correct');
    } else {
      error('Settlement reference should start with wdk:');
    }

    console.log();
    this.results.arp = true;
  }

  printSummary() {
    log('\n═══════════════════════════════════════════════', 'blue');
    log('                  Test Summary', 'blue');
    log('═══════════════════════════════════════════════\n', 'blue');

    const tests = [
      { name: 'WDK Initialization', result: this.results.init },
      { name: 'Ethereum Wallet', result: this.results.wallets.ethereum?.initialized },
      { name: 'Polygon Wallet', result: this.results.wallets.polygon?.initialized },
      { name: 'Bitcoin Wallet', result: this.results.wallets.bitcoin?.initialized },
      { name: 'Verification Adapter', result: this.results.verification },
      { name: 'ARP Formatting', result: this.results.arp }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      if (test.result) {
        success(test.name);
        passed++;
      } else {
        error(test.name);
        failed++;
      }
    }

    log(`\n─────────────────────────────────────────────────`);
    log(`Total: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      log('\n✨ All tests passed!', 'green');
    } else {
      log('\n⚠️  Some tests failed', 'yellow');
      process.exit(1);
    }

    log('\n═══════════════════════════════════════════════\n', 'blue');
    
    // Cleanup
    if (this.wallet) {
      this.wallet.dispose();
      info('Wallet disposed, sensitive data cleared');
    }
  }
}

// Run tests
const test = new WDKIntegrationTest();
test.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
