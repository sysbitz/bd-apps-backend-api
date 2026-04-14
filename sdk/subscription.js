/**
 * Subscription module - Subscription management
 * Equivalent to PHP Subscription class in sdk_file.php
 */

const axios = require('axios');

// ─── Custom Exception ───────────────────────────────────────────────
class SubscriptionException extends Error {
  constructor(message, code, response = null) {
    super(message);
    this.name = 'SubscriptionException';
    this.statusMessage = message;
    this.code = code;
    this.rawResponse = response;
  }

  getStatusCode() { return this.code; }
  getStatusMessage() { return this.statusMessage; }
  getRawResponse() { return this.rawResponse; }
}

// ─── Subscription ───────────────────────────────────────────────────
class Subscription {
  /**
   * @param {string} server - Base server URL (not used directly, overridden per method)
   * @param {string} password - Application password
   * @param {string} applicationId - Application ID
   */
  constructor(server, password, applicationId) {
    this.server = server;
    this.password = password;
    this.applicationId = applicationId;
  }

  /**
   * Get subscription status for a subscriber
   * @param {string} address - Subscriber address (tel:880...)
   * @returns {Promise<string>} Subscription status
   */
  async getStatus(address) {
    const url = 'https://developer.bdapps.com/subscription/getstatus';
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId: address,
    };

    const response = await this._sendRequest(payload, url);
    return response.subscriptionStatus;
  }

  /**
   * Subscribe a user
   * @param {string} address - Subscriber address (tel:880...)
   * @returns {Promise<string>} Subscription status
   */
  async subscribe(address) {
    const url = 'https://developer.bdapps.com/subscription/send';
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId: address,
      version: '1.0',
      action: '1',
    };

    const response = await this._sendRequest(payload, url);
    return response.subscriptionStatus;
  }

  /**
   * Unsubscribe a user
   * @param {string} address - Subscriber address (tel:880...)
   * @returns {Promise<string>} Subscription status
   */
  async unSubscribe(address) {
    const url = 'https://developer.bdapps.com/subscription/send';
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId: address,
      version: '1.0',
      action: '0',
    };

    const response = await this._sendRequest(payload, url);
    return response.subscriptionStatus;
  }

  /** @private */
  async _sendRequest(payload, url) {
    try {
      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      });

      return this._handleResponse(response.data);
    } catch (error) {
      if (error.response) {
        return this._handleResponse(error.response.data);
      }
      throw error;
    }
  }

  /** @private */
  _handleResponse(resp) {
    if (!resp || resp === '') {
      throw new SubscriptionException('Server URL is invalid', '500');
    }
    return resp;
  }
}

module.exports = { Subscription, SubscriptionException };
