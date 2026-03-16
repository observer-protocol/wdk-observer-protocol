/**
 * WDK + Observer Protocol Integration
 * Main entry point and exports
 */

export { AgentWallet } from './agent-wallet.mjs';
export { ObserverClient } from './observer-client.mjs';
export { VerifiedPayment } from './verified-payment.mjs';
export { createMcpServer } from './mcp-server.mjs';

// Version info
export const VERSION = '1.0.0';
export const WDK_VERSION = '0.9.0';

// Default export for convenience
export { AgentWallet as default } from './agent-wallet.mjs';
