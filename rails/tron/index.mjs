/**
 * TRON Rail — Observer Protocol Integration
 * 
 * Main entry point for TRON rail functionality.
 * 
 * Usage:
 *   import { TronRail } from './rails/tron/index.mjs';
 *   
 *   const tron = new TronRail({ apiKey: '...', network: 'shasta' });
 *   
 *   // Create and sign a receipt
 *   const receipt = await tron.createReceipt({
 *     issuer_did: 'did:op:...',
 *     subject_did: 'did:op:...',
 *     rail: 'tron:trc20',
 *     asset: 'USDT',
 *     amount: '1000000', // 1 USDT (6 decimals)
 *     tron_tx_hash: '...',
 *     timestamp: '2026-04-13T14:00:00Z',
 *     sender_address: 'T...',
 *     recipient_address: 'T...',
 *     token_contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
 *   });
 *   
 *   // Verify a receipt
 *   const result = await tron.verifyReceipt(receipt);
 *   console.log(result.verified); // true/false
 */

import { TronGridClient, publicKeyToTronAddress, TRON_AIP_TYPES } from './tron-core.mjs';
import { 
  createTronReceiptPayload, 
  signTronReceipt,
  verifyTronReceipt,
  validateTronReceiptData,
  extractReceiptSummary 
} from './tron-receipt-vc.mjs';
import { 
  TronReceiptVerifier, 
  TronReceiptEndpoint,
  tronReceiptToVACExtension 
} from './tron-verification.mjs';

/**
 * Main TRON Rail class
 */
export class TronRail {
  constructor(options = {}) {
    this.apiKey = options.apiKey || process.env.TRONGRID_API_KEY;
    this.network = options.network || 'mainnet';
    this.opDid = options.opDid || process.env.OP_DID;
    this.signingKey = options.signingKey || null;
    
    this.client = new TronGridClient({
      apiKey: this.apiKey,
      network: this.network,
      timeout: options.timeout
    });
    
    this.verifier = new TronReceiptVerifier({
      apiKey: this.apiKey,
      network: this.network,
      minConfirmations: options.minConfirmations,
      maxAgeHours: options.maxAgeHours
    });
    
    this.endpoint = new TronReceiptEndpoint({
      apiKey: this.apiKey,
      network: this.network,
      opDid: this.opDid
    });
  }

  /**
   * Create a new TRON transaction receipt
   */
  async createReceipt(data, options = {}) {
    // Validate input
    const validation = validateTronReceiptData(data);
    if (!validation.valid) {
      throw new Error(`Invalid receipt data: ${validation.errors.join(', ')}`);
    }

    // Create credential payload
    const payload = createTronReceiptPayload(data);

    // Sign if signing key provided
    if (options.sign && this.signingKey) {
      return await signTronReceipt(payload, this.signingKey);
    }

    return payload;
  }

  /**
   * Sign an existing receipt
   */
  async signReceipt(receipt) {
    if (!this.signingKey) {
      throw new Error('No signing key configured');
    }
    return await signTronReceipt(receipt, this.signingKey);
  }

  /**
   * Verify a receipt (both signature and TronGrid)
   */
  async verifyReceipt(receipt, options = {}) {
    return await this.verifier.verifyReceipt(receipt);
  }

  /**
   * Submit receipt to recipient endpoint
   */
  async submitReceipt(receipt, recipientEndpoint, recipientDid) {
    return await this.endpoint.sendReceipt(receipt, recipientEndpoint, recipientDid);
  }

  /**
   * Handle incoming receipt
   */
  async handleIncomingReceipt(receipt, recipientAgentId) {
    return await this.endpoint.handleReceiptSubmission(receipt, recipientAgentId);
  }

  /**
   * Convert receipt to VAC extension
   */
  toVACExtension(receipt, verificationResult) {
    return tronReceiptToVACExtension(receipt, verificationResult);
  }

  /**
   * Derive TRON address from public key
   */
  deriveAddress(publicKey, isTestnet = false) {
    return publicKeyToTronAddress(publicKey, isTestnet);
  }

  /**
   * Get AIP type identifier
   */
  getAIPType(isTRC20 = true) {
    return isTRC20 ? TRON_AIP_TYPES.TRC20 : TRON_AIP_TYPES.NATIVE;
  }
}

// Re-exports from submodules (includes all named exports)
export * from './tron-core.mjs';
export * from './tron-receipt-vc.mjs';
export * from './tron-verification.mjs';

export default TronRail;
