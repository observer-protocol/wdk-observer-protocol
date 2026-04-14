/**
 * Verified Send Example
 * 
 * Demonstrates the core primitive: verify recipient identity BEFORE sending payment
 */

import { AgentWallet } from '../core/agent-wallet.mjs';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  WDK + Observer Protocol - Verified Send Example');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Create sender agent wallet
  const sender = new AgentWallet({
    agentId: 'sender-demo-001',
    alias: 'sender-demo-001'
  });

  // Initialize Bitcoin wallet
  await sender.initWallet('bitcoin');

  console.log('🎭 Setting up sender agent...\n');
  console.log(`Sender: ${sender.alias}`);
  console.log();

  // The recipient we want to send to
  // In mainnet beta, this would be a real registered agent
  const recipientAlias = 'maxi-0001'; // Maxi is a real verified agent!

  console.log(`🎯 Target recipient: ${recipientAlias}\n`);

  // Step 1: Check if recipient exists and is verified
  console.log('Step 1: Checking recipient verification status...\n');
  const recipientCheck = await sender.checkRecipient(recipientAlias);
  console.log('Recipient check result:');
  console.log(JSON.stringify(recipientCheck, null, 2));
  console.log();

  if (!recipientCheck.verified) {
    console.log(`⚠️  Warning: ${recipientAlias} not found or not verified`);
    console.log('Proceeding with demo anyway...\n');
  } else {
    console.log(`✅ Recipient ${recipientAlias} is verified!`);
    console.log(`   Public Key Hash: ${recipientCheck.publicKeyHash}`);
    console.log(`   Reputation Score: ${recipientCheck.reputationScore}/100`);
    console.log();
  }

  // Step 2: Get recipient reputation
  console.log('Step 2: Getting detailed reputation...\n');
  const reputation = await sender.getAgentReputation(recipientAlias);
  console.log('Reputation details:');
  console.log(JSON.stringify(reputation, null, 2));
  console.log();

  // Step 3: Execute verified payment
  console.log('Step 3: Executing verified payment...\n');
  console.log('This will:');
  console.log('  1. Verify recipient exists in Observer Protocol');
  console.log('  2. Check their reputation score');
  console.log('  3. Only then attempt the payment\n');

  const amount = '0.001'; // Small amount for demo
  const chain = 'bitcoin';

  console.log(`Sending ${amount} BTC to ${recipientAlias}...\n`);

  try {
    const paymentResult = await sender.verifiedSend({
      recipientAlias,
      amount,
      chain
    });

    console.log('\n📊 Payment Result:');
    console.log(JSON.stringify(paymentResult, null, 2));

    if (paymentResult.success) {
      console.log('\n✅ Verified payment completed successfully!');
      console.log(`   Transaction ID: ${paymentResult.payment?.txid}`);
    } else {
      console.log('\n❌ Payment failed or was blocked:');
      console.log(`   Reason: ${paymentResult.error}`);
    }
  } catch (error) {
    console.log('\n❌ Payment error:', error.message);
  }

  console.log();
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Verified send example completed!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log();
  console.log('Key takeaways:');
  console.log('  • Recipient identity is verified BEFORE payment');
  console.log('  • Reputation scores help assess trustworthiness');
  console.log('  • Failed verification blocks the payment automatically');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
