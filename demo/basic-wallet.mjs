/**
 * Basic Wallet Example
 * 
 * Demonstrates:
 * 1. Creating a WDK wallet
 * 2. Registering with Observer Protocol
 * 3. Checking network stats
 */

import { AgentWallet } from '../core/agent-wallet.mjs';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WDK + Observer Protocol - Basic Wallet Example');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Create agent wallet
  const wallet = new AgentWallet({
    agentId: 'demo-agent-001',
    alias: 'demo-agent-001'
  });

  // Step 1: Check Observer Protocol network stats
  console.log('📊 Fetching Observer Protocol network stats...\n');
  try {
    const stats = await wallet.getNetworkStats();
    console.log('Network Stats:');
    console.log(JSON.stringify(stats, null, 2));
  } catch (error) {
    console.log('Note: Network stats endpoint may not be available yet');
    console.log('Error:', error.message);
  }
  console.log();

  // Step 2: Initialize wallets for different chains
  console.log('💼 Initializing wallets...\n');
  
  const bitcoinWallet = await wallet.initWallet('bitcoin');
  const btcAddress = await bitcoinWallet.getAddress();
  console.log(`Bitcoin Testnet Address: ${btcAddress}`);

  const ethWallet = await wallet.initWallet('ethereum');
  const ethAddress = await ethWallet.getAddress();
  console.log(`Ethereum Sepolia Address: ${ethAddress}`);
  console.log();

  // Step 3: Get balances
  console.log('💰 Checking balances...\n');
  
  const btcBalance = await wallet.getVerifiedBalance('bitcoin');
  console.log('Bitcoin Balance:', JSON.stringify(btcBalance.balance, null, 2));

  const ethBalance = await wallet.getVerifiedBalance('ethereum');
  console.log('Ethereum Balance:', JSON.stringify(ethBalance.balance, null, 2));
  console.log();

  // Step 4: Register with Observer Protocol
  console.log('📝 Registering agent with Observer Protocol...\n');
  
  // Generate a mock public key hash (in mainnet beta, this comes from actual keys)
  const mockPublicKeyHash = `sha256:${Buffer.from(btcAddress).toString('hex').substring(0, 64)}`;
  
  try {
    const registration = await wallet.register({
      alias: 'demo-agent-001',
      publicKeyHash: mockPublicKeyHash,
      metadata: {
        description: 'Demo agent for WDK + Observer Protocol integration',
        created: new Date().toISOString(),
        chains: ['bitcoin', 'ethereum']
      }
    });
    console.log('Registration result:', JSON.stringify(registration, null, 2));
  } catch (error) {
    console.log('Registration note:', error.message);
    console.log('(This is expected if the agent is already registered)');
  }
  console.log();

  // Step 5: Verify own identity
  console.log('🔐 Verifying agent identity...\n');
  try {
    const verification = await wallet.verify();
    console.log('Verification result:', JSON.stringify(verification, null, 2));
  } catch (error) {
    console.log('Verification note:', error.message);
  }
  console.log();

  // Step 6: Get verification feed
  console.log('📜 Fetching recent verification events...\n');
  try {
    const feed = await wallet.getVerificationFeed({ limit: 5 });
    console.log('Recent events:', JSON.stringify(feed, null, 2));
  } catch (error) {
    console.log('Feed note:', error.message);
  }
  console.log();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Basic wallet example completed!');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
