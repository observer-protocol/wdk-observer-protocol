/**
 * WDK + Observer Protocol Integration
 * Main entry point and exports
 */

export { AgentWallet } from './agent-wallet.mjs';
export { ObserverClient } from './observer-client.mjs';
export { VerifiedPayment } from './verified-payment.mjs';
export { createMcpServer } from './mcp-server.mjs';

// WDK Verification exports
export { 
  WDKVerificationAdapter, 
  verifyWDKTransaction, 
  submitWDKTransaction 
} from './wdk-verification.mjs';

// Version info
export const VERSION = '1.0.0';
export const WDK_VERSION = '1.0.0-beta.8';

// Protocol identifiers for ARP
export const SUPPORTED_PROTOCOLS = {
  WDK: 'tether_wdk',
  LIGHTNING: 'lightning',
  X402: 'x402',
  SOLANA: 'solana',
  BITCOIN: 'onchain'
};

// Chain identifiers
export const SUPPORTED_CHAINS = {
  BITCOIN: 'bitcoin',
  ETHEREUM: 'ethereum',
  POLYGON: 'polygon'
};

// USDT Contract addresses
export const USDT_CONTRACTS = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  sepolia: '0xE9F183FCA0D6868E1F026A31E9AE3C64BE1D7ed3'
};

// Default export for convenience
export { AgentWallet as default } from './agent-wallet.mjs';
