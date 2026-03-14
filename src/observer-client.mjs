/**
 * Observer Protocol API Client
 * Handles all communication with the Observer Protocol identity verification service
 */

const DEFAULT_ENDPOINT = 'https://api.observerprotocol.org';

export class ObserverClient {
  constructor(options = {}) {
    this.endpoint = options.endpoint || process.env.OBSERVER_ENDPOINT || DEFAULT_ENDPOINT;
    this.apiKey = options.apiKey || process.env.OBSERVER_API_KEY || null;
    this.timeout = options.timeout || 30000;
  }

  /**
   * Make an authenticated request to the Observer Protocol API
   */
  async request(path, options = {}) {
    const url = `${this.endpoint}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      fetchOptions.signal = controller.signal;

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Observer Protocol API error: ${response.status} ${errorText}`);
      }

      // Some endpoints may return empty body
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return { success: true };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Observer Protocol API request timed out after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Register a new agent identity
   * @param {Object} params - Registration parameters
   * @param {string} params.alias - Human-readable agent alias
   * @param {string} params.publicKeyHash - SHA256 hash of agent's public key
   * @param {string} [params.metadata] - Optional JSON metadata
   */
  async register({ alias, publicKeyHash, metadata = null }) {
    const body = { alias, public_key_hash: publicKeyHash };
    if (metadata) {
      body.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    }
    return this.request('/observer/register', {
      method: 'POST',
      body
    });
  }

  /**
   * Cryptographically verify an agent's identity
   * @param {Object} params - Verification parameters
   * @param {string} params.alias - Agent alias to verify
   * @param {string} params.signature - Cryptographic signature
   * @param {string} params.message - Message that was signed
   */
  async verify({ alias, signature, message }) {
    return this.request('/observer/verify', {
      method: 'POST',
      body: {
        alias,
        signature,
        message
      }
    });
  }

  /**
   * Look up an agent by public key hash
   * @param {string} publicKeyHash - The agent's public key hash
   */
  async lookupByHash(publicKeyHash) {
    return this.request(`/observer/agent/${encodeURIComponent(publicKeyHash)}`);
  }

  /**
   * Get recent verification events from the feed
   * @param {Object} options - Query options
   * @param {number} [options.limit=20] - Number of events to return
   * @param {string} [options.since] - ISO timestamp to get events since
   */
  async getFeed(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.since) params.append('since', options.since);
    
    const queryString = params.toString();
    const path = `/observer/feed${queryString ? '?' + queryString : ''}`;
    
    return this.request(path);
  }

  /**
   * Get network statistics
   */
  async getStats() {
    return this.request('/api/v1/stats');
  }

  /**
   * Get agent reputation score and verification history
   * @param {string} alias - Agent alias
   */
  async getReputation(alias) {
    // First try to get by alias through feed or lookup
    try {
      // Get recent feed and filter for this agent
      const feed = await this.getFeed({ limit: 100 });
      const agentEvents = feed.events?.filter(e => e.alias === alias) || [];
      
      // Calculate reputation from verification events
      const verifications = agentEvents.filter(e => e.type === 'verification').length;
      const registrations = agentEvents.filter(e => e.type === 'registration').length;
      
      return {
        alias,
        verificationCount: verifications,
        registrationCount: registrations,
        lastSeen: agentEvents[0]?.timestamp || null,
        reputationScore: this._calculateScore(verifications, registrations),
        events: agentEvents
      };
    } catch (error) {
      // Return default reputation if lookup fails
      return {
        alias,
        verificationCount: 0,
        registrationCount: 0,
        lastSeen: null,
        reputationScore: 0,
        events: [],
        error: error.message
      };
    }
  }

  /**
   * Verify an agent exists and get their public key hash
   * @param {string} alias - Agent alias to check
   */
  async verifyAgentExists(alias) {
    try {
      const feed = await this.getFeed({ limit: 200 });
      const agentEvent = feed.events?.find(e => e.alias === alias);
      
      if (!agentEvent) {
        return { exists: false, alias };
      }
      
      return {
        exists: true,
        alias,
        publicKeyHash: agentEvent.public_key_hash,
        lastVerified: agentEvent.timestamp
      };
    } catch (error) {
      return { exists: false, alias, error: error.message };
    }
  }

  /**
   * Calculate a simple reputation score
   * @private
   */
  _calculateScore(verifications, registrations) {
    // Simple scoring: base 10, +5 per verification, +2 per registration
    // Max 100
    const score = Math.min(100, 10 + (verifications * 5) + (registrations * 2));
    return score;
  }
}

export default ObserverClient;
