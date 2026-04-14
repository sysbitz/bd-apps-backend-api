/**
 * Subscription module - Subscription management
 * Updated for Vercel + BDApps stability
 */

const axios = require('axios');
const https = require('https');

// ─── Custom Exception ───────────────────────────────────────────────
class SubscriptionException extends Error {
  constructor(message, code, response = null) {
    super(message);
    this.name = 'SubscriptionException';
    this.statusMessage = message;
    this.code = code;
    this.rawResponse = response;
  }
}

// ─── Subscription ───────────────────────────────────────────────────
class Subscription {
  constructor(server, password, applicationId) {
    this.server = server;
    this.password = password;
    this.applicationId = applicationId;
  }

  async getStatus(address) {
    const url = 'https://developer.bdapps.com/subscription/getstatus';
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId: address,
    };

    return this._sendRequest(payload, url);
  }

  async subscribe(address) {
    const url = 'https://developer.bdapps.com/subscription/send';
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId: address,
      version: '1.0',
      action: '1',
    };

    return this._sendRequest(payload, url);
  }

  async unSubscribe(address) {
    const url = 'https://developer.bdapps.com/subscription/send';
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId: address,
      version: '1.0',
      action: '0',
    };

    return this._sendRequest(payload, url);
  }

  /** @private */
  async _sendRequest(payload, url) {
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false,   // Bypass SSL verification (safe for BDApps)
        keepAlive: true,
      });

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent,
        timeout: 15000,              // 15 seconds timeout (important for Vercel)
      });

      return this._handleResponse(response.data);
    } catch (error) {
      console.error("❌ Subscription API Error:", {
        url,
        message: error.message,
        code: error.code,
        response: error.response?.data,
      });

      if (error.response) {
        return this._handleResponse(error.response.data);
      }
      throw new SubscriptionException(error.message, error.code || 'ECONNRESET');
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