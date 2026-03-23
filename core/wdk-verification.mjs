/**
 * WDK Settlement Verification Adapter
 * 
 * Verifies Tether WDK transactions and maps them to Observer Protocol
 * settlement_reference format for ARP (Agent Reporting Protocol) compatibility.
 */

import { ethers } from 'ethers';

// Blockchain explorers for transaction verification
const EXPLORERS = {
  ethereum: {
    main: 'https://etherscan.io',
    api: 'https://api.etherscan.io/api',
    rpc: ['https://eth.llamarpc.com', 'https://ethereum-rpc.publicnode.com']
  },
  polygon: {
    main: 'https://polygonscan.com',
    api: 'https://api.polygonscan.com/api',
    rpc: ['https://polygon.llamarpc.com', 'https://polygon-rpc.com']
  },
  bitcoin: {
    main: 'https://mempool.space',
    api: 'https://mempool.space/api',
    rpc: null // Uses Electrum
  }
};

// USDT Contract addresses
const USDT_CONTRACTS = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  sepolia: '0xE9F183FCA0D6868E1F026A31E9AE3C64BE1D7ed3'
};

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

/**
 * WDK Verification Adapter
 * Handles verification of WDK transactions for Observer Protocol
 */
export class WDKVerificationAdapter {
  constructor(options = {}) {
    this.apiKeys = {
      etherscan: options.etherscanApiKey || process.env.ETHERSCAN_API_KEY,
      polygonscan: options.polygonscanApiKey || process.env.POLYGONSCAN_API_KEY
    };
    
    // Provider cache
    this.providers = new Map();
    
    // Verification cache to avoid duplicate checks
    this.verificationCache = new Map();
  }

  /**
   * Get provider for a chain
   * @param {string} chain - Chain name
   */
  getProvider(chain) {
    if (this.providers.has(chain)) {
      return this.providers.get(chain);
    }

    const chainConfig = EXPLORERS[chain];
    if (!chainConfig || !chainConfig.rpc) {
      return null;
    }

    const provider = new ethers.JsonRpcProvider(chainConfig.rpc[0]);
    this.providers.set(chain, provider);
    return provider;
  }

  /**
   * Create settlement_reference from WDK transaction
   * Format: wdk:{chain}:{tx_hash}:{block_number?}
   * 
   * @param {Object} tx - WDK transaction result
   * @param {string} chain - Chain name
   * @returns {string} Settlement reference
   */
  createSettlementReference(tx, chain) {
    const txHash = tx.hash || tx.txid;
    if (!txHash) {
      throw new Error('Transaction hash required for settlement reference');
    }
    
    return `wdk:${chain}:${txHash}`;
  }

  /**
   * Parse settlement_reference into components
   * @param {string} reference - Settlement reference
   * @returns {Object} Parsed reference
   */
  parseSettlementReference(reference) {
    if (!reference.startsWith('wdk:')) {
      return null;
    }

    const parts = reference.split(':');
    if (parts.length < 3) {
      return null;
    }

    return {
      protocol: 'wdk',
      chain: parts[1],
      txHash: parts[2],
      blockNumber: parts[3] || null
    };
  }

  /**
   * Verify a WDK transaction on-chain
   * 
   * @param {string} chain - Chain name (ethereum, polygon, bitcoin)
   * @param {string} txHash - Transaction hash
   * @param {Object} expected - Expected transaction details
   * @param {string} expected.recipient - Expected recipient address
   * @param {string} expected.amount - Expected amount
   * @param {string} [expected.token] - Expected token (USDT, etc.)
   * @returns {Promise<Object>} Verification result
   */
  async verifyTransaction(chain, txHash, expected = {}) {
    const cacheKey = `${chain}:${txHash}`;
    
    // Check cache
    if (this.verificationCache.has(cacheKey)) {
      const cached = this.verificationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.result;
      }
    }

    try {
      let result;

      if (chain === 'bitcoin') {
        result = await this._verifyBitcoinTx(txHash, expected);
      } else {
        result = await this._verifyEvmTx(chain, txHash, expected);
      }

      // Cache result
      this.verificationCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      return {
        verified: false,
        chain,
        txHash,
        error: error.message,
        confirmations: 0
      };
    }
  }

  /**
   * Verify EVM transaction (Ethereum, Polygon)
   * @private
   */
  async _verifyEvmTx(chain, txHash, expected) {
    const provider = this.getProvider(chain);
    if (!provider) {
      throw new Error(`No provider available for ${chain}`);
    }

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return {
        verified: false,
        chain,
        txHash,
        status: 'pending',
        message: 'Transaction not found or still pending'
      };
    }

    // Check if transaction was successful
    if (receipt.status !== 1) {
      return {
        verified: false,
        chain,
        txHash,
        status: 'failed',
        blockNumber: receipt.blockNumber,
        confirmations: receipt.confirmations || 0
      };
    }

    // Get full transaction details
    const tx = await provider.getTransaction(txHash);
    
    const result = {
      verified: true,
      chain,
      txHash,
      status: 'confirmed',
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      confirmations: receipt.confirmations || 0,
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      timestamp: Date.now()
    };

    // If token transfer, verify token details
    if (expected.token && expected.token.toLowerCase() !== chain) {
      const tokenAddress = USDT_CONTRACTS[chain] || expected.token;
      const tokenDetails = await this._verifyTokenTransfer(receipt, tokenAddress, expected, provider);
      result.tokenTransfer = tokenDetails;
      
      // Update verification based on token transfer details
      if (expected.recipient && tokenDetails.recipient?.toLowerCase() !== expected.recipient.toLowerCase()) {
        result.verified = false;
        result.mismatch = 'recipient';
      }
    } else {
      // Native token transfer verification
      if (expected.recipient && tx.to?.toLowerCase() !== expected.recipient.toLowerCase()) {
        result.verified = false;
        result.mismatch = 'recipient';
      }
      
      if (expected.amount) {
        const expectedWei = ethers.parseEther(expected.amount);
        if (tx.value !== expectedWei) {
          result.verified = false;
          result.mismatch = 'amount';
        }
      }
    }

    return result;
  }

  /**
   * Verify token transfer details from transaction logs
   * @private
   */
  async _verifyTokenTransfer(receipt, tokenAddress, expected, provider) {
    // Find Transfer event in logs
    const transferLog = receipt.logs.find(log => 
      log.topics[0] === TRANSFER_EVENT_SIGNATURE &&
      log.address.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (!transferLog) {
      return { found: false };
    }

    // Decode transfer event
    const from = '0x' + transferLog.topics[1].slice(26);
    const to = '0x' + transferLog.topics[2].slice(26);
    const amount = BigInt(transferLog.data);

    // Get token decimals
    const erc20Abi = ['function decimals() view returns (uint8)'];
    const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);
    const decimals = await tokenContract.decimals().catch(() => 6); // Default to 6 for USDT

    return {
      found: true,
      token: tokenAddress,
      from,
      recipient: to,
      amount: amount.toString(),
      amountFormatted: (Number(amount) / Math.pow(10, decimals)).toString(),
      decimals
    };
  }

  /**
   * Verify Bitcoin transaction
   * @private
   */
  async _verifyBitcoinTx(txHash, expected) {
    const explorer = EXPLORERS.bitcoin;
    
    try {
      // Fetch transaction from mempool.space API
      const response = await fetch(`${explorer.api}/tx/${txHash}`);
      if (!response.ok) {
        throw new Error(`Transaction not found: ${response.statusText}`);
      }

      const tx = await response.json();

      // Check confirmations
      const confirmed = tx.status?.confirmed === true;
      const blockHeight = tx.status?.block_height;

      const result = {
        verified: confirmed,
        chain: 'bitcoin',
        txHash,
        status: confirmed ? 'confirmed' : 'pending',
        blockHeight,
        blockHash: tx.status?.block_hash,
        confirmations: tx.status?.block_height ? 1 : 0, // Simplified
        size: tx.size,
        vsize: tx.vsize,
        fee: tx.fee,
        timestamp: tx.status?.block_time ? tx.status.block_time * 1000 : Date.now()
      };

      // If we have expected recipient, verify outputs
      if (expected.recipient && confirmed) {
        const outputs = tx.vout || [];
        const matchingOutput = outputs.find(out => 
          out.scriptpubkey_address === expected.recipient
        );
        
        if (!matchingOutput) {
          result.verified = false;
          result.mismatch = 'recipient';
        } else if (expected.amount) {
          const expectedSats = Math.floor(parseFloat(expected.amount) * 100000000);
          if (Math.abs(matchingOutput.value - expectedSats) > 1000) { // Allow small fee variance
            result.verified = false;
            result.mismatch = 'amount';
          }
        }
      }

      return result;
    } catch (error) {
      return {
        verified: false,
        chain: 'bitcoin',
        txHash,
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Wait for transaction confirmations
   * @param {string} chain - Chain name
   * @param {string} txHash - Transaction hash
   * @param {number} minConfirmations - Minimum confirmations required
   * @param {number} timeoutMs - Maximum time to wait
   * @param {number} pollIntervalMs - Poll interval
   */
  async waitForConfirmation(chain, txHash, minConfirmations = 1, timeoutMs = 120000, pollIntervalMs = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const result = await this.verifyTransaction(chain, txHash);
      
      if (result.verified && result.confirmations >= minConfirmations) {
        return result;
      }
      
      if (result.status === 'failed') {
        throw new Error(`Transaction failed: ${txHash}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
    
    throw new Error(`Timeout waiting for confirmation after ${timeoutMs}ms`);
  }

  /**
   * Format verification result for ARP submission
   * @param {Object} verificationResult - Result from verifyTransaction
   * @param {Object} paymentDetails - Original payment details
   * @returns {Object} ARP-compatible event
   */
  formatForARP(verificationResult, paymentDetails) {
    const { chain, txHash, confirmations, blockNumber, blockHeight } = verificationResult;
    
    return {
      protocol: 'tether_wdk',
      settlement_reference: `wdk:${chain}:${txHash}`,
      chain,
      txHash,
      verified: verificationResult.verified,
      confirmations: confirmations || 0,
      blockNumber: blockNumber || blockHeight,
      amount: paymentDetails.amount,
      token: paymentDetails.token || chain,
      recipient: paymentDetails.recipient,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Submit verified transaction to Observer Protocol
   * @param {string} agentId - Agent ID
   * @param {string} apiKey - Observer Protocol API key
   * @param {Object} arpEvent - ARP-formatted event
   */
  async submitToObserver(agentId, apiKey, arpEvent) {
    const endpoint = process.env.OBSERVER_ENDPOINT || 'https://api.observerprotocol.org';
    
    const response = await fetch(`${endpoint}/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        event_type: 'payment.executed',
        arp_version: '0.1',
        agent_id: agentId,
        protocol: arpEvent.protocol,
        settlement_reference: arpEvent.settlement_reference,
        amount_bucket: this._getAmountBucket(arpEvent.amount, arpEvent.token),
        direction: 'outbound',
        verified: arpEvent.verified,
        time_window: new Date().toISOString().split('T')[0],
        submitted_at: new Date().toISOString(),
        metadata: {
          chain: arpEvent.chain,
          txHash: arpEvent.txHash,
          confirmations: arpEvent.confirmations,
          blockNumber: arpEvent.blockNumber
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to submit to Observer: ${error}`);
    }

    return await response.json();
  }

  /**
   * Get amount bucket for ARP
   * @private
   */
  _getAmountBucket(amount, token) {
    const num = parseFloat(amount);
    
    if (token === 'bitcoin' || token === 'btc') {
      if (num < 0.00001) return 'micro';
      if (num < 0.0001) return 'small';
      if (num < 0.001) return 'medium';
      return 'large';
    }
    
    // For USDT/stablecoins
    if (num < 0.01) return 'micro';
    if (num < 0.10) return 'small';
    if (num < 1.00) return 'medium';
    return 'large';
  }

  /**
   * Clear verification cache
   */
  clearCache() {
    this.verificationCache.clear();
  }
}

/**
 * Quick verification helper
 * Verify a WDK transaction and return ARP-formatted result
 */
export async function verifyWDKTransaction(chain, txHash, expected = {}, options = {}) {
  const adapter = new WDKVerificationAdapter(options);
  const verification = await adapter.verifyTransaction(chain, txHash, expected);
  
  if (!verification.verified) {
    return verification;
  }
  
  return adapter.formatForARP(verification, expected);
}

/**
 * Create and submit ARP event for a WDK transaction
 */
export async function submitWDKTransaction(agentId, apiKey, chain, txHash, paymentDetails, options = {}) {
  const adapter = new WDKVerificationAdapter(options);
  
  // Verify first
  const verification = await adapter.verifyTransaction(chain, txHash, paymentDetails);
  
  if (!verification.verified) {
    throw new Error(`Transaction verification failed: ${verification.error || 'unknown'}`);
  }
  
  // Format for ARP
  const arpEvent = adapter.formatForARP(verification, paymentDetails);
  
  // Submit to Observer
  return await adapter.submitToObserver(agentId, apiKey, arpEvent);
}

export default WDKVerificationAdapter;
