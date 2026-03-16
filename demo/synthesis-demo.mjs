#!/usr/bin/env node
/**
 * Observer Protocol × Celo Synthesis Demo
 * CLI tool for demonstrating on-chain agent identity and reputation
 */

import {
  computePublicKeyHash,
  registerAgentOnChain,
  getAgentOnChain,
  resolveAliasOnChain,
  recordVerificationOnChain,
  recordPaymentOnChain,
  getReputationOnChain,
  getWalletInfo,
  CONTRACTS,
  celoSepolia
} from '../rails/celo/celo-client.mjs';

// Helper for visual output
const printHeader = (text) => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${text}`);
  console.log(`${'═'.repeat(60)}`);
};

const printSection = (emoji, text) => {
  console.log(`\n${emoji} ${text}`);
  console.log(`${'─'.repeat(50)}`);
};

const printSuccess = (text) => console.log(`   ✅ ${text}`);
const printError = (text) => console.log(`   ❌ ${text}`);
const printInfo = (text) => console.log(`   ℹ️  ${text}`);
const printTx = (hash) => {
  console.log(`   🔗 TX: ${hash}`);
  console.log(`   🔍 https://celo-sepolia.blockscout.com/tx/${hash}`);
};

// Store for full-demo transaction history
const txHistory = [];

// Command implementations (defined as standalone functions to avoid this-binding issues)
async function cmdStatus() {
  printHeader('🔍 Observer Protocol × Celo Sepolia Status');
  
  try {
    const wallet = await getWalletInfo();
    printSection('👛', 'Wallet');
    console.log(`   Address: ${wallet.address}`);
    console.log(`   Balance: ${parseFloat(wallet.balance).toFixed(4)} CELO`);
    
    printSection('📜', 'Contracts');
    console.log(`   AgentIdentityRegistry:    ${CONTRACTS.AgentIdentityRegistry}`);
    console.log(`   AgentReputationRegistry:  ${CONTRACTS.AgentReputationRegistry}`);
    console.log(`   AgentStaking:             ${CONTRACTS.AgentStaking}`);
    console.log(`   cUSD Token:               ${CONTRACTS.cUSD}`);
    
    printSection('🌐', 'Network');
    console.log(`   Name:    ${celoSepolia.name}`);
    console.log(`   Chain ID: ${celoSepolia.id}`);
    console.log(`   RPC:     ${celoSepolia.rpcUrls.default.http[0]}`);
    
    console.log('\n' + '═'.repeat(60) + '\n');
  } catch (error) {
    printError(`Status check failed: ${error.message}`);
  }
}

async function cmdRegister({ alias, framework = 'openclaw' }) {
  printSection('📝', `Registering agent: ${alias}`);
  
  const publicKeyHash = computePublicKeyHash(alias);
  console.log(`   Alias: ${alias}`);
  console.log(`   Framework: ${framework}`);
  console.log(`   Public Key Hash: ${publicKeyHash}`);
  
  try {
    // Check if already registered
    const existing = await resolveAliasOnChain({ alias });
    if (existing !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
      printInfo('Agent already registered on-chain. Skipping registration.');
      const agent = await getAgentOnChain({ publicKeyHash: existing });
      console.log(`   Alias: ${agent.alias}`);
      console.log(`   Framework: ${agent.framework}`);
      console.log(`   Active: ${agent.active ? '✅' : '❌'}`);
      return { skipped: true, agent };
    }
    
    const result = await registerAgentOnChain({ publicKeyHash, alias, framework });
    printSuccess('Agent registered successfully!');
    printTx(result.txHash);
    console.log(`   Block: ${result.receipt.blockNumber}`);
    
    txHistory.push({ step: 'Register', txHash: result.txHash });
    return { skipped: false, result };
  } catch (error) {
    printError(`Registration failed: ${error.message}`);
    if (error.message.includes('Already registered') || error.message.includes('already exists')) {
      printInfo('Agent already exists on-chain.');
    }
    return { error: error.message };
  }
}

async function cmdGetAgent({ alias }) {
  printSection('🔍', `Looking up agent: ${alias}`);
  
  const publicKeyHash = computePublicKeyHash(alias);
  
  try {
    const resolvedHash = await resolveAliasOnChain({ alias });
    console.log(`   Resolved hash: ${resolvedHash}`);
    
    if (resolvedHash === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      printError('Agent not found on-chain.');
      return { found: false };
    }
    
    const agent = await getAgentOnChain({ publicKeyHash: resolvedHash });
    printSuccess('Agent found!');
    console.log(`   Alias: ${agent.alias}`);
    console.log(`   Framework: ${agent.framework}`);
    console.log(`   Active: ${agent.active ? '✅' : '❌'}`);
    console.log(`   Registered At: ${new Date(agent.registeredAt * 1000).toISOString()}`);
    return { found: true, agent };
  } catch (error) {
    printError(`Lookup failed: ${error.message}`);
    return { error: error.message };
  }
}

async function cmdRecordVerification({ alias }) {
  printSection('✅', `Recording verification for: ${alias}`);
  
  const publicKeyHash = computePublicKeyHash(alias);
  
  try {
    const result = await recordVerificationOnChain({ publicKeyHash });
    printSuccess('Verification recorded!');
    printTx(result.txHash);
    console.log(`   New Reputation Score: ${result.newScore}/100`);
    
    txHistory.push({ step: 'Verification', txHash: result.txHash });
    return { result };
  } catch (error) {
    printError(`Verification failed: ${error.message}`);
    return { error: error.message };
  }
}

async function cmdRecordPayment({ alias, amount = '100000000000000000000' }) {
  printSection('💰', `Recording payment for: ${alias}`);
  
  const publicKeyHash = computePublicKeyHash(alias);
  const amountInCUSD = (BigInt(amount) / BigInt(10**18)).toString();
  console.log(`   Amount: ${amountInCUSD} cUSD`);
  
  try {
    const result = await recordPaymentOnChain({ publicKeyHash, amount });
    printSuccess('Payment recorded!');
    printTx(result.txHash);
    console.log(`   New Reputation Score: ${result.newScore}/100`);
    
    txHistory.push({ step: 'Payment', txHash: result.txHash });
    return { result };
  } catch (error) {
    printError(`Payment recording failed: ${error.message}`);
    return { error: error.message };
  }
}

async function cmdGetReputation({ alias }) {
  printSection('📊', `Reputation for: ${alias}`);
  
  const publicKeyHash = computePublicKeyHash(alias);
  
  try {
    const rep = await getReputationOnChain({ publicKeyHash });
    console.log(`   Verification Count: ${rep.verificationCount}`);
    console.log(`   Payment Count: ${rep.paymentCount}`);
    console.log(`   Total Amount Verified: ${rep.totalAmountVerified}`);
    console.log(`   Reputation Score: ${rep.reputationScore}/100`);
    console.log(`   Last Updated: ${rep.lastUpdated > 0 ? new Date(rep.lastUpdated * 1000).toISOString() : 'Never'}`);
    return { reputation: rep };
  } catch (error) {
    printError(`Reputation lookup failed: ${error.message}`);
    return { error: error.message };
  }
}

async function cmdFullDemo() {
  printHeader('🚀 Observer Protocol Full Demo');
  console.log('\n   Running complete agent identity flow...\n');
  
  const alias = 'maxi-0001';
  const framework = 'openclaw';
  
  // Clear history
  txHistory.length = 0;
  
  // Step 1: Status Check
  printSection('1️⃣', 'Status Check');
  try {
    const wallet = await getWalletInfo();
    console.log(`   Wallet: ${wallet.address}`);
    console.log(`   Balance: ${parseFloat(wallet.balance).toFixed(4)} CELO`);
    printSuccess('Wallet connected');
  } catch (error) {
    printError(`Wallet check failed: ${error.message}`);
    console.log('\n   Demo aborted. Please check your wallet configuration.\n');
    return;
  }
  
  // Step 2: Register (or skip if exists)
  printSection('2️⃣', 'Agent Registration');
  const regResult = await cmdRegister({ alias, framework });
  if (regResult.error && !regResult.skipped) {
    printError('Registration step failed. Continuing...');
  }
  
  // Step 3: Record Verification
  printSection('3️⃣', 'Record Verification Event');
  const verifResult = await cmdRecordVerification({ alias });
  if (verifResult.error) {
    printError('Verification step failed. Continuing...');
  }
  
  // Step 4: Record Payment (100 cUSD)
  printSection('4️⃣', 'Record Payment (100 cUSD)');
  const paymentAmount = '100000000000000000000'; // 100 cUSD in wei
  const payResult = await cmdRecordPayment({ alias, amount: paymentAmount });
  if (payResult.error) {
    printError('Payment recording failed. Continuing...');
  }
  
  // Step 5: Get Final Reputation
  printSection('5️⃣', 'Final Reputation Score');
  const repResult = await cmdGetReputation({ alias });
  
  // Summary
  printHeader('📋 Demo Summary');
  console.log(`\n   Agent: ${alias}`);
  console.log(`   Framework: ${framework}`);
  
  if (txHistory.length > 0) {
    console.log('\n   Transaction History:');
    txHistory.forEach((tx, i) => {
      console.log(`   ${i + 1}. ${tx.step}`);
      console.log(`      ${tx.txHash}`);
      console.log(`      https://celo-sepolia.blockscout.com/tx/${tx.txHash}`);
    });
  }
  
  if (repResult.reputation) {
    console.log('\n   Final Reputation:');
    console.log(`   Score: ${repResult.reputation.reputationScore}/100`);
    console.log(`   Verifications: ${repResult.reputation.verificationCount}`);
    console.log(`   Payments: ${repResult.reputation.paymentCount}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  printSuccess('Full demo complete!');
  console.log('═'.repeat(60) + '\n');
}

// Command map
const commands = {
  status: cmdStatus,
  register: cmdRegister,
  'get-agent': cmdGetAgent,
  'record-verification': cmdRecordVerification,
  'record-payment': cmdRecordPayment,
  'get-reputation': cmdGetReputation,
  'full-demo': cmdFullDemo
};

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0];
  const params = {};
  
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, '');
    const value = args[i + 1];
    params[key] = value;
  }
  
  return { command, params };
}

// Main
async function main() {
  const { command, params } = parseArgs();
  
  if (!command || command === 'help' || command === '--help') {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║     Observer Protocol × Celo Synthesis Demo                    ║
║     Portable cryptographic identity for AI agents              ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  node synthesis-demo.mjs <command> [options]

Commands:
  status                          Show wallet and network status
  register --alias <name>         Register a new agent
              --framework <fw>    Framework name (default: openclaw)
  get-agent --alias <name>        Look up an agent by alias
  record-verification --alias <n> Record a verification event
  record-payment --alias <name>   Record a payment event
                 --amount <wei>   Amount in wei (default: 100 cUSD)
  get-reputation --alias <name>   Get agent reputation
  full-demo                       Run complete demo flow

Examples:
  node synthesis-demo.mjs status
  node synthesis-demo.mjs register --alias "maxi-0001" --framework "openclaw"
  node synthesis-demo.mjs get-agent --alias "maxi-0001"
  node synthesis-demo.mjs record-verification --alias "maxi-0001"
  node synthesis-demo.mjs record-payment --alias "maxi-0001" --amount "100000000000000000000"
  node synthesis-demo.mjs get-reputation --alias "maxi-0001"
  node synthesis-demo.mjs full-demo

Contracts (Celo Sepolia):
  AgentIdentityRegistry:   0xBA88f04f4506F6E04f8897ecE02efFa7CD978642
  AgentReputationRegistry: 0xd8B12B00d3162723CbA160b546524e1f9Ea59E56
  AgentStaking:            0x8De71c76A51dBE96cFBAD5C7Ea2175aa0A293642
`);
    return;
  }
  
  const handler = commands[command];
  if (!handler) {
    console.error(`❌ Unknown command: ${command}`);
    console.log('Run with --help for usage.');
    process.exit(1);
  }
  
  try {
    await handler(params);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
