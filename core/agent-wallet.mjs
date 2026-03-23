/**
 * AgentWallet - WDK + Observer Protocol Integration
 *
 * Combines Tether's WDK for self-custodial wallets with Observer Protocol
 * for bilateral cryptographic identity verification.
 *
 * Bilateral verification means BOTH sender and recipient identities are
 * verified before any payment executes. The payment becomes a
 * cryptographically attested transaction with identity proofs from both parties.
 */

import { ObserverClient } from './observer-client.mjs';
import { VerifiedPayment } from './verified-payment.mjs';

// WDK imports - dynamically loaded to handle missing dependencies gracefully
let WDK, WalletManagerEvm, WalletManagerBtc;

try {
  const wdkModule = await import('@tetherto/wdk');
  WDK = wdkModule.default;
} catch (e) {
  console.warn('[AgentWallet] WDK core not available:', e.message);
}

try {
  const evmModule = await import('@tetherto/wdk-wallet-evm');
  WalletManagerEvm = evmModule.default;
} catch (e) {
  console.warn('[AgentWallet] WDK EVM wallet not available:', e.message);
}

try {
  const btcModule = await import('@tetherto/wdk-wallet-btc');
  WalletManagerBtc = btcModule.default;
} catch (e) {
  console.warn('[AgentWallet] WDK BTC wallet not available:', e.message);
}

// USDT Contract addresses
const USDT_CONTRACTS = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  sepolia: '0xE9F183FCA0D6868E1F026A31E9AE3C64BE1D7ed3' // Testnet
};

// ERC20 ABI for transfer
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

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

    // WDK manager instance
    this.wdk = null;
    this.wallets = new Map();
    this.wdkConfig = options.wdkConfig || {};
    
    // Seed phrase - must be provided or set via env
    this.seedPhrase = options.seedPhrase || process.env.WDK_SEED_PHRASE;
    
    // Registration state
    this.registered = false;
    this.publicKeyHash = null;
    
    // Provider configurations
    this.providers = {
      ethereum: options.ethereumProvider || process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
      polygon: options.polygonProvider || process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
      bitcoin: {
        host: options.bitcoinHost || process.env.BITCOIN_ELECTRUM_HOST || 'bitcoin.lukechilds.co',
        port: options.bitcoinPort || process.env.BITCOIN_ELECTRUM_PORT || 50001,
        protocol: options.bitcoinProtocol || process.env.BITCOIN_ELECTRUM_PROTOCOL || 'tcp'
      }
    };
  }

  /**
   * Initialize the WDK manager with seed phrase
   * @param {string} seedPhrase - BIP-39 seed phrase (optional if provided in constructor)
   */
  async initializeWDK(seedPhrase = null) {
    if (!WDK) {
      throw new Error('WDK not available. Please install @tetherto/wdk');
    }

    const seed = seedPhrase || this.seedPhrase;
    if (!seed) {
      throw new Error('Seed phrase required. Provide in constructor or call generateSeed()');
    }

    this.wdk = new WDK(seed);
    console.log('✅ WDK initialized successfully');
    return this.wdk;
  }

  /**
   * Generate a new random seed phrase
   * @returns {string} BIP-39 seed phrase
   */
  static generateSeedPhrase() {
    if (!WDK) {
      throw new Error('WDK not available. Please install @tetherto/wdk');
    }
    return WDK.getRandomSeedPhrase();
  }

  /**
   * Initialize WDK wallet for a specific chain
   * @param {string} chain - Chain to initialize (bitcoin, ethereum, polygon)
   * @param {Object} config - Optional configuration overrides
   */
  async initWallet(chain, config = {}) {
    if (this.wallets.has(chain)) {
      return this.wallets.get(chain);
    }

    if (!this.wdk) {
      await this.initializeWDK();
    }

    let walletManager;
    let blockchainName;

    switch (chain.toLowerCase()) {
      case 'ethereum':
      case 'eth':
        if (!WalletManagerEvm) {
          throw new Error('WDK EVM wallet not available. Please install @tetherto/wdk-wallet-evm');
        }
        blockchainName = 'ethereum';
        walletManager = WalletManagerEvm;
        break;

      case 'polygon':
      case 'matic':
        if (!WalletManagerEvm) {
          throw new Error('WDK EVM wallet not available. Please install @tetherto/wdk-wallet-evm');
        }
        blockchainName = 'polygon';
        walletManager = WalletManagerEvm;
        break;

      case 'bitcoin':
      case 'btc':
        if (!WalletManagerBtc) {
          throw new Error('WDK BTC wallet not available. Please install @tetherto/wdk-wallet-btc');
        }
        blockchainName = 'bitcoin';
        walletManager = WalletManagerBtc;
        break;

      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }

    // Merge config with defaults
    const walletConfig = {
      ...this.providers[blockchainName],
      ...config
    };

    // Register wallet with WDK
    this.wdk.registerWallet(blockchainName, walletManager, walletConfig);

    // Get account (index 0 by default)
    const account = await this.wdk.getAccount(blockchainName, 0);
    
    // Store wallet reference
    const wallet = {
      chain: blockchainName,
      account,
      address: await account.getAddress(),
      
      getAddress: async () => account.getAddress(),
      
      getBalance: async () => {
        if (chain === 'bitcoin' || chain === 'btc') {
          const balance = await account.getBalance();
          return {
            confirmed: (balance.confirmed / 100000000).toFixed(8),
            unconfirmed: (balance.unconfirmed / 100000000).toFixed(8),
            total: (balance.total / 100000000).toFixed(8),
            satoshis: balance
          };
        } else {
          // EVM chains - get native balance
          const balance = await account.getBalance();
          return {
            wei: balance.toString(),
            ether: (Number(balance) / 1e18).toFixed(18)
          };
        }
      },
      
      getTokenBalance: async (tokenAddress) => {
        if (chain === 'bitcoin' || chain === 'btc') {
          throw new Error('Token balances not supported on Bitcoin');
        }
        return await account.getTokenBalance(tokenAddress);
      },
      
      send: async ({ to, amount, token }) => {
        return this._executeSend({ chain: blockchainName, to, amount, token, account });
      }
    };

    // Cache wallet
    this.wallets.set(chain, wallet);
    this.wallets.set(blockchainName, wallet);

    console.log(`✅ ${blockchainName} wallet initialized: ${wallet.address}`);
    return wallet;
  }

  /**
   * Internal method to execute a send transaction
   * @private
   */
  async _executeSend({ chain, to, amount, token, account }) {
    try {
      let txHash;
      let fee;

      if (chain === 'bitcoin') {
        // Bitcoin transaction
        const satoshis = Math.floor(parseFloat(amount) * 100000000);
        const result = await account.sendTransaction({
          to,
          value: BigInt(satoshis)
        });
        txHash = result.hash;
        fee = result.fee?.toString();
      } else {
        // EVM transaction
        if (token && token.toLowerCase() !== 'eth' && token.toLowerCase() !== 'matic') {
          // Token transfer (USDT, etc.)
          const tokenAddress = USDT_CONTRACTS[chain] || token;
          const decimals = chain === 'ethereum' ? 6 : 6; // USDT uses 6 decimals
          const tokenAmount = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
          
          const result = await account.transfer({
            token: tokenAddress,
            to,
            amount: tokenAmount
          });
          txHash = result.hash;
          fee = result.fee?.toString();
        } else {
          // Native token transfer (ETH, MATIC)
          const value = BigInt(Math.floor(parseFloat(amount) * 1e18));
          const result = await account.sendTransaction({
            to,
            value
          });
          txHash = result.hash;
          fee = result.fee?.toString();
        }
      }

      console.log(`✅ Transaction sent: ${txHash}`);
      
      return {
        txid: txHash,
        hash: txHash,
        status: 'pending',
        amount,
        token: token || chain,
        recipient: to,
        chain,
        fee,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Transaction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get fee rates for a chain
   * @param {string} chain - Chain to get fees for
   */
  async getFeeRates(chain) {
    if (!this.wdk) {
      throw new Error('WDK not initialized');
    }

    const blockchainName = chain.toLowerCase() === 'btc' ? 'bitcoin' : chain.toLowerCase();
    return await this.wdk.getFeeRates(blockchainName);
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
        publicKey: publicKeyHash,
        metadata: {
          agentId: this.agentId,
          wdkEnabled: true,
          supportedChains: ['bitcoin', 'ethereum', 'polygon'],
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
    
    let balance;
    if (token && chain !== 'bitcoin') {
      balance = await wallet.getTokenBalance(token);
    } else {
      balance = await wallet.getBalance();
    }
    
    return {
      chain,
      token,
      address: wallet.address,
      balance,
      agentVerified: this.registered,
      agentAlias: this.alias
    };
  }

  /**
   * Send payment ONLY after bilateral verification of both parties.
   *
   * Performs TWO verification checks:
   * 1. Attaches the sender's OP identity to the payment (proves who is paying)
   * 2. Verifies the recipient's identity before executing (proves who is being paid)
   *
   * @param {Object} params - Payment parameters
   * @param {string} params.recipientAlias - Observer Protocol alias of recipient
   * @param {string} params.amount - Amount to send
   * @param {string} params.chain - Chain to use
   * @param {string} [params.token] - Token for EVM chains (USDT, etc.)
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
        // Use actual WDK send
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
   * Send a payment directly without bilateral verification
   * @param {Object} params - Payment parameters
   * @param {string} params.to - Recipient address
   * @param {string} params.amount - Amount to send
   * @param {string} params.chain - Chain to use
   * @param {string} [params.token] - Token for EVM chains
   */
  async send({ to, amount, chain, token = null }) {
    console.log(`\n💸 Sending payment...`);
    console.log(`   To: ${to}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Chain: ${chain}`);

    const wallet = await this.initWallet(chain);
    return await wallet.send({ to, amount, token });
  }

  /**
   * Sign a message using the wallet's private key
   * @param {string} message - Message to sign
   * @param {string} chain - Chain to use for signing
   */
  async signMessage(message, chain = 'ethereum') {
    const wallet = await this.initWallet(chain);
    return await wallet.account.sign(message);
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

  /**
   * Dispose of all wallets and clear sensitive data from memory
   */
  dispose() {
    if (this.wdk) {
      this.wdk.dispose();
    }
    this.wallets.clear();
    console.log('✅ Wallets disposed, sensitive data cleared');
  }
}

export default AgentWallet;
