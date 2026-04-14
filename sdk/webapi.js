/**
 * WebApi module - Subscription activation via web API
 * Equivalent to PHP WebApi class in sdk_file.php
 */

const Core = require('./core');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class WebApi extends Core {
  /**
   * @param {string} applicationId - Application ID (or read from appid.txt)
   * @param {string} serviceProviderAppId - Service provider app ID
   * @param {string} hashSecret - Secret for SHA256 signature
   */
  constructor(applicationId = null, serviceProviderAppId = 'DSAPP_000003', hashSecret = '8c899b6b56e6855605ea61be994012e7') {
    super();
    this.url = 'https://developer.bdapps.com/subscription/activate';
    this.requestId = String(Math.floor(Math.random() * 900000000000000000) + 100000000000000000);
    this.requestTime = this._getTime();
    this.serviceProviderAppId = serviceProviderAppId;
    this.hashSecret = hashSecret;
    this.applicationId = applicationId;
    this.subscriberId = null;
    this.requestSignature = null;
  }

  /** @private */
  _getTime() {
    // Asia/Dhaka timezone format: YYYY-MM-DD HH:mm:ss.000
    const now = new Date();
    const options = { timeZone: 'Asia/Dhaka' };
    const year = now.toLocaleString('en-US', { ...options, year: 'numeric' });
    const month = now.toLocaleString('en-US', { ...options, month: '2-digit' });
    const day = now.toLocaleString('en-US', { ...options, day: '2-digit' });
    const hour = now.toLocaleString('en-US', { ...options, hour: '2-digit', hour12: false });
    const minute = now.toLocaleString('en-US', { ...options, minute: '2-digit' });
    const second = now.toLocaleString('en-US', { ...options, second: '2-digit' });
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.000`;
  }

  /**
   * Set the subscriber and compute the request signature
   * @param {string} address - Subscriber address
   */
  getAppAndSubscriber(address) {
    this.subscriberId = address;

    // Try to read applicationId from appid.txt if not set
    if (!this.applicationId) {
      try {
        const appIdFile = path.resolve('appid.txt');
        this.applicationId = fs.readFileSync(appIdFile, 'utf8').trim();
      } catch {
        // applicationId must be set via constructor or env
      }
    }

    // Generate SHA256 signature
    this.requestSignature = crypto
      .createHash('sha256')
      .update(this.applicationId + this.requestTime + this.hashSecret)
      .digest('hex');
  }

  /**
   * Send the subscription activation request
   * @returns {Promise<object>} Response from BDApps
   */
  async requestSend() {
    const payload = {
      requestId: this.requestId,
      requestTime: this.requestTime,
      serviceProviderAppId: this.serviceProviderAppId,
      requestSignature: this.requestSignature,
      applicationId: this.applicationId,
      subscriberId: this.subscriberId,
    };

    const response = await this.sendRequest(payload, this.url);
    return response;
  }
}

module.exports = WebApi;
