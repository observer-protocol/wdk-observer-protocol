/**
 * AgentWallet - WDK + Observer Protocol Integration
 * 
 * Combines Tether's WDK for self-custodial wallets with Observer Protocol
 * for cryptographic identity verification.
 */

import { ObserverClient } from './observer-client.mjs';
import { VerifiedPayment } from './verified-payment.mjs';

export class AgentWallet {
  constructor(options = {}) {
    this.agentId = options.agentId || process.env.AGENT_ID || 'unknown-agent';
    this.alias = options.alias || process.env.AGENT_ALIAS || this.agentId;
    
    // Initialize Observer Protocol client
    this.observer = options.observerClient || new ObserverClient(options);
    
    // Initialize verified payment handler
    this.verifiedPayment = new VerifiedPayment({
      observerClient: this.observer,
      minReputationScore: options.minReputationScore || 0,
      ...options
    });

    // WDK wallet instances (initialized on demand)
    this.wallets = new Map();
    this.wdkConfig = options.wdkConfig || {};
    
    // Registration state
    this.registered = false;
    this.publicKeyHash = null;
  }

  /**
   * Initialize WDK wallet for a specific chain
   * @param {string} chain - Chain to initialize (bitcoin, ethereum, polygon)
   */
  async initWallet(chain) {
    if (this.wallets.has(chain)) {
      return this.wallets.get(chain);
    }

    // For the hackathon demo, we'll create a mock wallet structure
    // In production, this would use actual WDK packages
    const wallet = {
      chain,
      address: null,
      balance: 0,
      
      // Mock methods for demo
      getAddress: async () => {
        if (!this.address) {
          // Generate mock address based on chain
          this.address = chain === 'bitcoin' 
            ? `tb1q${Math.random().toString(36).substring(2, 15)}...`
            : `0x${Math.random().toString(36).substring(2, 42)}`;
        }
        return this.address;
      },
      
      getBalance: async () => {
        // Mock balance - in production would query actual chain
        return {
          confirmed: '0.00000000',
          unconfirmed: '0.00000000',
          total: '0.00000000'
        };
      },
      
      send: async ({ to, amount, token }) => {
        // Mock send - in production would use WDK
        console.log(`[MOCK] Sending ${amount} ${token || chain} to ${to}`);
        return {
          txid: `mock_tx_${Date.now()}`,
          status: 'pending',
          amount,
          recipient: to
        };
      }
    };

    this.wallets.set(chain, wallet);
    return wallet;
  }

  /**
   * Register this agent with Observer Protocol
   * @param {Object} params - Registration parameters
   * @param {string} params.alias - Human-readable alias
   * @param {string} params.publicKeyHash - SHA256 hash of public key
   * @param {Object} [params.metadata] - Optional metadata
   */
  async register({ alias, publicKeyHash, metadata = {} }) {
    console.log(`📝 Registering agent with Observer Protocol...`);
    console.log(`   Alias: ${alias}`);
    console.log(`   Public Key Hash: ${publicKeyHash}`);

    try {
      const result = await this.observer.register({
        alias,
        publicKeyHash,
        metadata: {
          agentId: this.agentId,
          ...metadata
        }
      });

      this.alias = alias;
      this.publicKeyHash = publicKeyHash;
      this.registered = true;

      console.log(`✅ Agent registered successfully!`);
      return { success: true, ...result };
    } catch (error) {
      console.error(`❌ Registration failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cryptographically verify this agent's identity
   * @param {Object} params - Verification parameters
   * @param {string} params.signature - Cryptographic signature
   * @param {string} params.message - Message that was signed
   */
  async verify({ signature, message } = {}) {
    if (!this.alias) {
      throw new Error('Agent not registered. Call register() first.');
    }

    console.log(`🔐 Verifying agent identity: ${this.alias}`);

    // If no signature provided, just check existence
    if (!signature || !message) {
      const exists = await this.observer.verifyAgentExists(this.alias);
      return {
        verified: exists.exists,
        alias: this.alias,
        publicKeyHash: exists.publicKeyHash,
        lastVerified: exists.lastVerified
      };
    }

    // Full cryptographic verification
    const result = await this.observer.verify({
      alias: this.alias,
      signature,
      message
    });

    console.log(`✅ Identity verified: ${result.verified ? 'YES' : 'NO'}`);
    return result;
  }

  /**
   * Get wallet balance for a specific chain
   * @param {string} chain - Chain to check (bitcoin, ethereum, polygon)
   * @param {string} [token] - Token for EVM chains
   */
  async getVerifiedBalance(chain, token = null) {
    const wallet = await this.initWallet(chain);
    const balance = await wallet.getBalance();
    
    return {
      chain,
      token,
      balance,
      agentVerified: this.registered,
      agentAlias: this.alias
    };
  }

  /**
   * Send payment ONLY after verifying recipient identity
   * @param {Object} params - Payment parameters
   * @param {string} params.recipientAlias - Observer Protocol alias of recipient
   * @param {string} params.amount - Amount to send
   * @param {string} params.chain - Chain to use
   * @param {string} [params.token] - Token for EVM chains
   */
  async verifiedSend({ recipientAlias, amount, chain, token = null }) {
    console.log(`\n🚀 Starting verified payment...`);
    console.log(`   From: ${this.alias}`);
    console.log(`   To: ${recipientAlias}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Chain: ${chain}`);

    const wallet = await this.initWallet(chain);

    const result = await this.verifiedPayment.execute({
      recipientAlias,
      amount,
      chain,
      token,
      executePayment: async ({ recipientPublicKeyHash, amount, chain, token }) => {
        // In production, this would use actual WDK send
        // For demo, we use mock
        return wallet.send({
          to: recipientPublicKeyHash,
          amount,
          token
        });
      }
    });

    return result;
  }

  /**
   * Get this agent's reputation score
   */
  async getOwnReputation() {
    if (!this.alias) {
      throw new Error('Agent not registered. Call register() first.');
    }
    return this.observer.getReputation(this.alias);
  }

  /**
   * Get another agent's reputation
   * @param {string} alias - Agent alias to check
   */
  async getAgentReputation(alias) {
    return this.observer.getReputation(alias);
  }

  /**
   * Check if a recipient is verified without sending
   * @param {string} alias - Agent alias to check
   */
  async checkRecipient(alias) {
    return this.verifiedPayment.checkRecipient(alias);
  }

  /**
   * Get network statistics from Observer Protocol
   */
  async getNetworkStats() {
    return this.observer.getStats();
  }

  /**
   * Get recent verification events
   * @param {Object} options - Query options
   */
  async getVerificationFeed(options = {}) {
    return this.observer.getFeed(options);
  }
}

export default AgentWallet;
