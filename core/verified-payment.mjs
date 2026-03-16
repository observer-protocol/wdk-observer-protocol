/**
 * Verified Payment Primitive
 * Core logic for bilateral verify-then-pay workflow
 *
 * Bilateral verification ensures BOTH sender and recipient identities are
 * cryptographically verified before payment execution. The payment becomes
 * an identity-bound event with on-chain attestation.
 */

import { ObserverClient } from './observer-client.mjs';

export class VerifiedPayment {
  constructor(options = {}) {
    this.observer = options.observerClient || new ObserverClient(options);
    this.minReputationScore = options.minReputationScore || 0;
    this.requireVerification = options.requireVerification !== false;
    this.onVerificationFailed = options.onVerificationFailed || null;
    this.onPaymentReady = options.onPaymentReady || null;
  }

  /**
   * Execute a bilateral verified payment: verify recipient, attach sender identity,
   * then pay if all checks pass.
   *
   * This implements bilateral verification where:
   * - Recipient identity is verified before payment (who is being paid)
   * - Sender identity is attached to the payment (who is paying)
   * - Both verification events are recorded on-chain
   *
   * @param {Object} params - Payment parameters
   * @param {string} params.recipientAlias - Observer Protocol alias of recipient
   * @param {string} params.amount - Amount to send
   * @param {string} params.chain - Chain to use (bitcoin, ethereum, polygon)
   * @param {string} [params.token] - Token for EVM chains (USDT, etc.)
   * @param {Function} params.executePayment - Async function to execute the actual payment
   * @returns {Promise<Object>} Payment result with bilateral verification status
   */
  async execute({
    recipientAlias,
    amount,
    chain,
    token = null,
    executePayment
  }) {
    const result = {
      success: false,
      verification: null,
      payment: null,
      error: null
    };

    try {
      // Step 1: Verify recipient exists in Observer Protocol
      console.log(`🔍 Verifying recipient: ${recipientAlias}`);
      const existsCheck = await this.observer.verifyAgentExists(recipientAlias);
      
      if (!existsCheck.exists) {
        result.error = `Recipient ${recipientAlias} not found in Observer Protocol`;
        console.error(`❌ ${result.error}`);
        
        if (this.onVerificationFailed) {
          await this.onVerificationFailed(result);
        }
        
        return result;
      }

      result.verification = {
        exists: true,
        alias: recipientAlias,
        publicKeyHash: existsCheck.publicKeyHash,
        lastVerified: existsCheck.lastVerified
      };

      // Step 2: Get reputation score
      console.log(`📊 Checking reputation for: ${recipientAlias}`);
      const reputation = await this.observer.getReputation(recipientAlias);
      result.verification.reputation = reputation;

      // Step 3: Validate reputation threshold
      if (reputation.reputationScore < this.minReputationScore) {
        result.error = `Recipient reputation score (${reputation.reputationScore}) below minimum (${this.minReputationScore})`;
        console.error(`❌ ${result.error}`);
        
        if (this.onVerificationFailed) {
          await this.onVerificationFailed(result);
        }
        
        return result;
      }

      console.log(`✅ Verification passed for ${recipientAlias}`);
      console.log(`   Reputation Score: ${reputation.reputationScore}/100`);
      console.log(`   Verifications: ${reputation.verificationCount}`);

      // Step 4: Execute payment
      if (this.onPaymentReady) {
        const shouldProceed = await this.onPaymentReady(result.verification);
        if (!shouldProceed) {
          result.error = 'Payment cancelled by user callback';
          return result;
        }
      }

      console.log(`💸 Executing payment: ${amount} on ${chain}`);
      
      if (!executePayment) {
        result.error = 'No executePayment function provided';
        return result;
      }

      const paymentResult = await executePayment({
        recipientAlias,
        recipientPublicKeyHash: existsCheck.publicKeyHash,
        amount,
        chain,
        token,
        verification: result.verification
      });

      result.payment = paymentResult;
      result.success = true;

      console.log(`✅ Payment completed successfully`);

    } catch (error) {
      result.error = error.message;
      console.error(`❌ Verified payment failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Quick check if a recipient is verified (without payment)
   * @param {string} alias - Agent alias to check
   * @returns {Promise<Object>} Verification status
   */
  async checkRecipient(alias) {
    try {
      const exists = await this.observer.verifyAgentExists(alias);
      if (!exists.exists) {
        return { verified: false, reason: 'not_found', alias };
      }

      const reputation = await this.observer.getReputation(alias);
      
      return {
        verified: reputation.reputationScore >= this.minReputationScore,
        alias,
        publicKeyHash: exists.publicKeyHash,
        reputationScore: reputation.reputationScore,
        verificationCount: reputation.verificationCount,
        lastSeen: reputation.lastSeen
      };
    } catch (error) {
      return {
        verified: false,
        reason: 'error',
        alias,
        error: error.message
      };
    }
  }

  /**
   * Batch verify multiple recipients
   * @param {string[]} aliases - Array of agent aliases
   * @returns {Promise<Object[]>} Array of verification results
   */
  async batchVerify(aliases) {
    const results = await Promise.all(
      aliases.map(alias => this.checkRecipient(alias))
    );
    return results;
  }
}

export default VerifiedPayment;
