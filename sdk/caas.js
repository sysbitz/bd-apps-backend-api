/**
 * CAAS module - Direct Debit (Charging as a Service)
 * Equivalent to PHP DirectDebitSender class in sdk_file.php
 */

const Core = require('./core');

// ─── Custom Exception ───────────────────────────────────────────────
class CassException extends Error {
  constructor(message, code, response = null) {
    super(message);
    this.name = 'CassException';
    this.statusMessage = message;
    this.code = code;
    this.rawResponse = response;
  }

  getStatusCode() { return this.code; }
  getStatusMessage() { return this.statusMessage; }
  getRawResponse() { return this.rawResponse; }
}

// ─── Direct Debit Sender ────────────────────────────────────────────
class DirectDebitSender extends Core {
  /**
   * @param {string} serverURL - BDApps CAAS direct debit URL
   * @param {string} applicationId - Application ID
   * @param {string} password - Application password
   */
  constructor(serverURL, applicationId, password) {
    super();
    this.serverURL = serverURL;
    this.applicationId = applicationId;
    this.password = password;
  }

  /**
   * Charge a subscriber via direct debit
   * @param {string} externalTrxId - External transaction ID
   * @param {string} subscriberId - Subscriber phone number (tel:880...)
   * @param {number|string} amount - Amount to charge
   * @returns {Promise<string>} Status code 'S1000' on success
   */
  async cass(externalTrxId, subscriberId, amount) {
    if (!subscriberId) {
      throw new Error('Address should be a string or an array of strings');
    }
    return this._cassMany(externalTrxId, subscriberId, amount);
  }

  /** @private */
  async _cassMany(externalTrxId, subscriberId, amount) {
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      externalTrxId,
      subscriberId,
      paymentInstrumentName: 'Mobile Account',
      amount: String(amount),
    };

    const response = await this.sendRequest(payload, this.serverURL);
    return this._handleResponse(response);
  }

  /** @private */
  _handleResponse(jsonResponse) {
    if (!jsonResponse) {
      throw new CassException('Invalid server URL', '500');
    }

    const { statusCode, statusDetail } = jsonResponse;

    if (statusCode === 'S1000') {
      return 'S1000';
    }

    throw new CassException(statusDetail || 'Unknown error', statusCode || 'UNKNOWN');
  }
}

// ─── Balance Query ──────────────────────────────────────────────────
class BalanceQuery extends Core {
  constructor(applicationId, password) {
    super();
    this.applicationId = applicationId;
    this.password = password;
    this.serverURL = 'https://developer.bdapps.com/caas/balance/query';
  }

  /**
   * Query the balance of a subscriber
   * @param {string} subscriberId - Subscriber phone number
   * @param {string} paymentInstrumentName - Payment instrument (default: 'Mobile Account')
   * @returns {Promise<object>} Balance info
   */
  async queryBalance(subscriberId, paymentInstrumentName = 'Mobile Account') {
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId,
      paymentInstrumentName,
    };

    return this.sendRequest(payload, this.serverURL);
  }
}

// ─── Payment Instrument List ────────────────────────────────────────
class PaymentInstrumentList extends Core {
  constructor(applicationId, password) {
    super();
    this.applicationId = applicationId;
    this.password = password;
    this.serverURL = 'https://developer.bdapps.com/caas/list/pi';
  }

  /**
   * Get payment instruments for a subscriber
   * @param {string} subscriberId - Subscriber phone number
   * @param {string} type - Type filter: 'sync', 'async', or 'all'
   * @returns {Promise<object>} Payment instrument list
   */
  async getList(subscriberId, type = 'all') {
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId,
      type,
    };

    return this.sendRequest(payload, this.serverURL);
  }
}

module.exports = { DirectDebitSender, BalanceQuery, PaymentInstrumentList, CassException };
