/**
 * USSD module - USSD Sender and Receiver classes
 * Equivalent to PHP UssdSender and UssdReceiver classes in sdk_file.php
 */

const Core = require('./core');

// ─── Custom Exception ───────────────────────────────────────────────
class UssdException extends Error {
  constructor(message, code, response = null) {
    super(message);
    this.name = 'UssdException';
    this.statusMessage = message;
    this.code = code;
    this.rawResponse = response;
  }

  getStatusCode() { return this.code; }
  getStatusMessage() { return this.statusMessage; }
  getRawResponse() { return this.rawResponse; }
}

// ─── USSD Receiver ──────────────────────────────────────────────────
class UssdReceiver {
  /**
   * Parse incoming USSD request JSON
   * @param {object} data - Parsed JSON body from incoming request
   */
  constructor(data) {
    if (!data || (!data.sourceAddress && !data.message)) {
      throw new Error('Some of the required parameters are not provided');
    }

    this.sourceAddress = data.sourceAddress || null;
    this.message = data.message || null;
    this.requestId = data.requestId || null;
    this.applicationId = data.applicationId || null;
    this.encoding = data.encoding || null;
    this.version = data.version || null;
    this.sessionId = data.sessionId || null;
    this.ussdOperation = data.ussdOperation || null;
    this.thejson = data;

    this.response = { statusCode: 'S1000', statusDetail: 'Success' };
  }

  getJson() { return this.thejson; }
  getAddress() { return this.sourceAddress; }
  getMessage() { return this.message; }
  getRequestID() { return this.requestId; }
  getApplicationId() { return this.applicationId; }
  getEncoding() { return this.encoding; }
  getVersion() { return this.version; }
  getSessionId() { return this.sessionId; }
  getUssdOperation() { return this.ussdOperation; }
  getResponse() { return this.response; }
}

// ─── USSD Sender ────────────────────────────────────────────────────
class UssdSender extends Core {
  /**
   * @param {string} serverURL - BDApps USSD send URL
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
   * Send USSD message
   * @param {string} sessionId - Session identifier
   * @param {string} message - Message content
   * @param {string} destinationAddress - Destination phone number
   * @param {string} ussdOperation - USSD operation type (default: 'mo-cont')
   * @returns {Promise<object>} Response from BDApps
   */
  async ussd(sessionId, message, destinationAddress, ussdOperation = 'mo-cont') {
    if (!destinationAddress) {
      throw new Error('address should be a string or an array of strings');
    }
    return this._ussdMany(message, sessionId, ussdOperation, destinationAddress);
  }

  /** @private */
  async _ussdMany(message, sessionId, ussdOperation, destinationAddress) {
    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      message,
      destinationAddress,
      sessionId,
      ussdOperation,
      encoding: '440',
    };

    return this.sendRequest(payload, this.serverURL);
  }
}

module.exports = { UssdSender, UssdReceiver, UssdException };
