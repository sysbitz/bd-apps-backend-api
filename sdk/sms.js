/**
 * SMS module - SMS Sender and Receiver classes
 * Equivalent to PHP SMSSender and SMSReceiver classes in sdk_file.php
 */

const Core = require('./core');

// ─── Custom Exception ───────────────────────────────────────────────
class SMSServiceException extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'SMSServiceException';
    this.statusCode = statusCode;
    this.statusDetail = message;
  }

  getErrorCode() {
    return this.statusCode;
  }

  getErrorMessage() {
    return this.statusDetail;
  }
}

// ─── SMS Receiver ───────────────────────────────────────────────────
class SMSReceiver {
  /**
   * Parse incoming SMS notification JSON
   * @param {object} jsonRequest - Parsed JSON body from incoming request
   */
  constructor(jsonRequest) {
    if (!jsonRequest || (!jsonRequest.sourceAddress && !jsonRequest.message)) {
      this.response = { statusCode: 'E1312', statusDetail: 'Request is Invalid.' };
    } else {
      this.thejson = jsonRequest;
      this.version = jsonRequest.version || null;
      this.applicationId = jsonRequest.applicationId || null;
      this.sourceAddress = jsonRequest.sourceAddress || jsonRequest.address || null;
      this.message = jsonRequest.message || null;
      this.requestId = jsonRequest.requestId || null;
      this.encoding = jsonRequest.encoding || null;
      this.response = { statusCode: 'S1000', statusDetail: 'Process completed successfully.' };
    }
  }

  getVersion() { return this.version; }
  getEncoding() { return this.encoding; }
  getApplicationId() { return this.applicationId; }
  getAddress() { return this.sourceAddress; }
  getMessage() { return this.message; }
  getRequestId() { return this.requestId; }
  getJson() { return this.thejson; }
  getResponse() { return this.response; }
}

// ─── SMS Sender ─────────────────────────────────────────────────────
class SMSSender extends Core {
  /**
   * @param {string} serverURL - BDApps SMS send URL
   * @param {string} applicationId - Application ID
   * @param {string} password - Application password
   */
  constructor(serverURL, applicationId, password) {
    super();

    if (!serverURL || !applicationId || !password) {
      throw new SMSServiceException('Request Invalid.', 'E1312');
    }

    this.applicationId = applicationId;
    this.password = password;
    this.serverURL = serverURL;

    // Optional fields
    this.sourceAddress = null;
    this.chargingAmount = null;
    this.encoding = null;
    this.version = null;
    this.deliveryStatusRequest = null;
    this.binaryHeader = null;
  }

  /**
   * Broadcast a message to all subscribed users
   * @param {string} message - Message to broadcast
   * @returns {Promise<boolean>}
   */
  async broadcast(message) {
    return this.sms(message, ['tel:all']);
  }

  /**
   * Send SMS to one or more addresses
   * @param {string} message - Message to send
   * @param {string|string[]} addresses - Destination address(es)
   * @returns {Promise<boolean>}
   */
  async sms(message, addresses) {
    if (!addresses || (Array.isArray(addresses) && addresses.length === 0)) {
      throw new SMSServiceException('Format of the address is invalid.', 'E1325');
    }

    const addressList = typeof addresses === 'string' ? [addresses] : addresses;
    const jsonStream = this._resolveJsonStream(message, addressList);

    if (jsonStream) {
      const response = await this.sendRequest(JSON.parse(jsonStream), this.serverURL);
      return this._handleResponse(response);
    }

    return false;
  }

  /** @private */
  _handleResponse(jsonResponse) {
    if (!jsonResponse) {
      throw new SMSServiceException('Invalid server URL', '500');
    }

    const { statusCode, statusDetail } = jsonResponse;

    if (statusCode === 'S1000') {
      return true;
    }

    throw new SMSServiceException(statusDetail || 'Unknown error', statusCode || 'UNKNOWN');
  }

  /** @private */
  _resolveJsonStream(message, addresses) {
    const messageDetails = {
      message,
      destinationAddresses: addresses,
    };

    if (this.sourceAddress) messageDetails.sourceAddress = this.sourceAddress;
    if (this.deliveryStatusRequest) messageDetails.deliveryStatusRequest = this.deliveryStatusRequest;
    if (this.binaryHeader) messageDetails.binaryHeader = this.binaryHeader;
    if (this.version) messageDetails.version = this.version;
    if (this.encoding) messageDetails.encoding = this.encoding;

    const payload = {
      applicationId: this.applicationId,
      password: this.password,
      ...messageDetails,
    };

    return JSON.stringify(payload);
  }

  // Setters
  setSourceAddress(sourceAddress) { this.sourceAddress = sourceAddress; }
  setChargingAmount(chargingAmount) { this.chargingAmount = chargingAmount; }
  setEncoding(encoding) { this.encoding = encoding; }
  setVersion(version) { this.version = version; }
  setBinaryHeader(binaryHeader) { this.binaryHeader = binaryHeader; }
  setDeliveryStatusRequest(deliveryStatusRequest) { this.deliveryStatusRequest = deliveryStatusRequest; }
}

module.exports = { SMSSender, SMSReceiver, SMSServiceException };
