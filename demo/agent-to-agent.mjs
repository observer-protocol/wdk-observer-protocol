/**
 * Agent-to-Agent Payment Demo
 * 
 * Demonstrates two AI agents verifying each other and executing
 * a trustless payment using WDK + Observer Protocol
 */

import { AgentWallet } from '../src/agent-wallet.mjs';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WDK + Observer Protocol - Agent-to-Agent Payment Demo');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Create two agent wallets
  const alice = new AgentWallet({
    agentId: 'alice-demo-agent',
    alias: 'alice-demo-agent'
  });

  const bob = new AgentWallet({
    agentId: 'bob-demo-agent',
    alias: 'bob-demo-agent'
  });

  console.log('🎭 Setting up agents...\n');
  console.log('Alice:', alice.alias);
  console.log('Bob:', bob.alias);
  console.log();

  // Initialize wallets for both agents
  await alice.initWallet('bitcoin');
  await bob.initWallet('bitcoin');
  await alice.initWallet('ethereum');
  await bob.initWallet('ethereum');

  // Step 1: Both agents register with Observer Protocol
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Step 1: Agent Registration');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Register Alice
  console.log('📝 Registering Alice...');
  try {
    const aliceHash = `sha256:alice_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    await alice.register({
      alias: alice.alias,
      publicKeyHash: aliceHash,
      metadata: {
        role: 'payment_sender',
        capabilities: ['bitcoin', 'ethereum'],
        created: new Date().toISOString()
      }
    });
    console.log('✅ Alice registered\n');
  } catch (error) {
    console.log('Note:', error.message, '\n');
  }

  // Register Bob
  console.log('📝 Registering Bob...');
  try {
    const bobHash = `sha256:bob_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    await bob.register({
      alias: bob.alias,
      publicKeyHash: bobHash,
      metadata: {
        role: 'payment_receiver',
        capabilities: ['bitcoin', 'ethereum'],
        created: new Date().toISOString()
      }
    });
    console.log('✅ Bob registered\n');
  } catch (error) {
    console.log('Note:', error.message, '\n');
  }

  // Step 2: Mutual verification
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Step 2: Mutual Identity Verification');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🔍 Alice verifying Bob...');
  const bobVerification = await alice.checkRecipient(bob.alias);
  console.log('Bob verification status:', bobVerification.verified ? '✅ VERIFIED' : '❌ NOT FOUND');
  console.log();

  console.log('🔍 Bob verifying Alice...');
  const aliceVerification = await bob.checkRecipient(alice.alias);
  console.log('Alice verification status:', aliceVerification.verified ? '✅ VERIFIED' : '❌ NOT FOUND');
  console.log();

  // Step 3: Reputation check
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Step 3: Reputation Assessment');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('📊 Alice checking Bob\'s reputation...');
  const bobRep = await alice.getAgentReputation(bob.alias);
  console.log('Bob\'s reputation:', JSON.stringify({
    score: bobRep.reputationScore,
    verifications: bobRep.verificationCount,
    lastSeen: bobRep.lastSeen
  }, null, 2));
  console.log();

  console.log('📊 Bob checking Alice\'s reputation...');
  const aliceRep = await bob.getAgentReputation(alice.alias);
  console.log('Alice\'s reputation:', JSON.stringify({
    score: aliceRep.reputationScore,
    verifications: aliceRep.verificationCount,
    lastSeen: aliceRep.lastSeen
  }, null, 2));
  console.log();

  // Step 4: Negotiate payment
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Step 4: Payment Negotiation');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const paymentDetails = {
    service: 'Data Processing',
    amount: '0.005',
    chain: 'bitcoin',
    description: 'Processing 1000 data records'
  };

  console.log('💼 Payment Agreement:');
  console.log(`  Service: ${paymentDetails.service}`);
  console.log(`  Amount: ${paymentDetails.amount} BTC`);
  console.log(`  Chain: ${paymentDetails.chain}`);
  console.log(`  Description: ${paymentDetails.description}`);
  console.log();

  // Step 5: Execute verified payment
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('Step 5: Verified Payment Execution');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('💸 Alice initiating verified payment to Bob...\n');

  const paymentResult = await alice.verifiedSend({
    recipientAlias: bob.alias,
    amount: paymentDetails.amount,
    chain: paymentDetails.chain
  });

  console.log('\n📊 Payment Result:');
  console.log(JSON.stringify(paymentResult, null, 2));
  console.log();

  if (paymentResult.success) {
    console.log('✅ Agent-to-agent payment completed successfully!');
    console.log();
    console.log('Transaction Summary:');
    console.log(`  From: ${alice.alias}`);
    console.log(`  To: ${bob.alias}`);
    console.log(`  Amount: ${paymentDetails.amount} BTC`);
    console.log(`  Status: CONFIRMED`);
    console.log(`  Verification: PASSED`);
  } else {
    console.log('❌ Payment failed:', paymentResult.error);
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Agent-to-Agent Demo Completed!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log('What just happened:');
  console.log('  1. Both agents registered with Observer Protocol');
  console.log('  2. Mutual identity verification was performed');
  console.log('  3. Reputation scores were checked');
  console.log('  4. Payment was executed ONLY after verification passed');
  console.log();
  console.log('This is trustless agent commerce in action!');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
