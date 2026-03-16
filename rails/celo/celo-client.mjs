/**
 * Celo Sepolia Client for Observer Protocol
 * Viem-based interaction with deployed contracts
 */

import { createPublicClient, createWalletClient, http, keccak256, toBytes, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const credsPath = resolve(__dirname, '../../../.evm-credentials');
const creds = Object.fromEntries(
  readFileSync(credsPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => l.split('='))
);
const PRIVATE_KEY = creds['EVM_PRIVATE_KEY'];

// Contract addresses
const CONTRACTS = {
  AgentIdentityRegistry: '0xBA88f04f4506F6E04f8897ecE02efFa7CD978642',
  AgentReputationRegistry: '0xd8B12B00d3162723CbA160b546524e1f9Ea59E56',
  AgentStaking: '0x8De71c76A51dBE96cFBAD5C7Ea2175aa0A293642',
  cUSD: '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b'
};

// Celo Sepolia chain config
const celoSepolia = {
  id: 11142220,
  name: 'Celo Sepolia',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrls: { 
    default: { http: ['https://rpc.ankr.com/celo_sepolia'] }
  }
};

// Create clients
const publicClient = createPublicClient({
  chain: celoSepolia,
  transport: http()
});

const account = privateKeyToAccount(PRIVATE_KEY);
const walletClient = createWalletClient({
  account,
  chain: celoSepolia,
  transport: http()
});

// ABIs
const identityRegistryABI = [
  {
    inputs: [
      { name: 'publicKeyHash', type: 'bytes32' },
      { name: 'agentAlias', type: 'string' },
      { name: 'framework', type: 'string' }
    ],
    name: 'register',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'publicKeyHash', type: 'bytes32' }],
    name: 'verify',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'publicKeyHash', type: 'bytes32' }],
    name: 'getAgent',
    outputs: [{
      components: [
        { name: 'publicKeyHash', type: 'bytes32' },
        { name: 'agentAlias', type: 'string' },
        { name: 'framework', type: 'string' },
        { name: 'registeredAt', type: 'uint256' },
        { name: 'active', type: 'bool' }
      ],
      name: '',
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'agentAlias', type: 'string' }],
    name: 'resolveAlias',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const reputationRegistryABI = [
  {
    inputs: [{ name: 'publicKeyHash', type: 'bytes32' }],
    name: 'recordVerification',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'publicKeyHash', type: 'bytes32' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'recordPayment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'publicKeyHash', type: 'bytes32' }],
    name: 'getReputation',
    outputs: [{
      components: [
        { name: 'verificationCount', type: 'uint256' },
        { name: 'paymentCount', type: 'uint256' },
        { name: 'totalAmountVerified', type: 'uint256' },
        { name: 'reputationScore', type: 'uint256' },
        { name: 'lastUpdated', type: 'uint256' }
      ],
      name: '',
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function'
  }
];

const stakingABI = [
  {
    inputs: [
      { name: 'publicKeyHash', type: 'bytes32' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'stake',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'publicKeyHash', type: 'bytes32' }],
    name: 'getStake',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const erc20ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

// Helper to compute deterministic publicKeyHash from alias
export function computePublicKeyHash(alias) {
  return keccak256(toBytes(alias));
}

// Identity Registry Functions

export async function registerAgentOnChain({ publicKeyHash, alias, framework }) {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.AgentIdentityRegistry,
    abi: identityRegistryABI,
    functionName: 'register',
    args: [publicKeyHash, alias, framework]
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { txHash: hash, address: CONTRACTS.AgentIdentityRegistry, receipt };
}

export async function verifyAgentOnChain({ publicKeyHash }) {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.AgentIdentityRegistry,
    abi: identityRegistryABI,
    functionName: 'verify',
    args: [publicKeyHash]
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { txHash: hash, receipt };
}

export async function getAgentOnChain({ publicKeyHash }) {
  const agent = await publicClient.readContract({
    address: CONTRACTS.AgentIdentityRegistry,
    abi: identityRegistryABI,
    functionName: 'getAgent',
    args: [publicKeyHash]
  });
  
  return {
    publicKeyHash: agent.publicKeyHash,
    alias: agent.agentAlias,
    framework: agent.framework,
    registeredAt: Number(agent.registeredAt),
    active: agent.active
  };
}

export async function resolveAliasOnChain({ alias }) {
  const publicKeyHash = await publicClient.readContract({
    address: CONTRACTS.AgentIdentityRegistry,
    abi: identityRegistryABI,
    functionName: 'resolveAlias',
    args: [alias]
  });
  
  return publicKeyHash;
}

// Reputation Registry Functions

export async function recordVerificationOnChain({ publicKeyHash }) {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.AgentReputationRegistry,
    abi: reputationRegistryABI,
    functionName: 'recordVerification',
    args: [publicKeyHash]
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  // Get updated reputation
  const rep = await getReputationOnChain({ publicKeyHash });
  
  return { txHash: hash, newScore: rep.reputationScore, receipt };
}

export async function recordPaymentOnChain({ publicKeyHash, amount }) {
  const hash = await walletClient.writeContract({
    address: CONTRACTS.AgentReputationRegistry,
    abi: reputationRegistryABI,
    functionName: 'recordPayment',
    args: [publicKeyHash, BigInt(amount)]
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  
  // Get updated reputation
  const rep = await getReputationOnChain({ publicKeyHash });
  
  return { txHash: hash, newScore: rep.reputationScore, receipt };
}

export async function getReputationOnChain({ publicKeyHash }) {
  const rep = await publicClient.readContract({
    address: CONTRACTS.AgentReputationRegistry,
    abi: reputationRegistryABI,
    functionName: 'getReputation',
    args: [publicKeyHash]
  });
  
  return {
    verificationCount: Number(rep.verificationCount),
    paymentCount: Number(rep.paymentCount),
    totalAmountVerified: rep.totalAmountVerified.toString(),
    reputationScore: Number(rep.reputationScore),
    lastUpdated: Number(rep.lastUpdated)
  };
}

// Staking Functions

export async function stakeOnChain({ publicKeyHash, amount }) {
  // First approve cUSD transfer
  const approveHash = await walletClient.writeContract({
    address: CONTRACTS.cUSD,
    abi: erc20ABI,
    functionName: 'approve',
    args: [CONTRACTS.AgentStaking, BigInt(amount)]
  });
  
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  
  // Then stake
  const stakeHash = await walletClient.writeContract({
    address: CONTRACTS.AgentStaking,
    abi: stakingABI,
    functionName: 'stake',
    args: [publicKeyHash, BigInt(amount)]
  });
  
  const receipt = await publicClient.waitForTransactionReceipt({ hash: stakeHash });
  return { txHash: stakeHash, receipt };
}

export async function getStakeOnChain({ publicKeyHash }) {
  const stake = await publicClient.readContract({
    address: CONTRACTS.AgentStaking,
    abi: stakingABI,
    functionName: 'getStake',
    args: [publicKeyHash]
  });
  
  return stake;
}

// Utility exports
export { publicClient, walletClient, account, CONTRACTS, celoSepolia };

// Get wallet info
export async function getWalletInfo() {
  const balance = await publicClient.getBalance({ address: account.address });
  return {
    address: account.address,
    balance: formatEther(balance),
    balanceWei: balance.toString()
  };
}
