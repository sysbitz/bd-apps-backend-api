/**
 * OTP module - OTP request and verification
 * Equivalent to PHP send_otp.php and verify_otp.php
 */

const axios = require('axios');

class OTPService {
  /**
   * @param {string} applicationId - Application ID
   * @param {string} password - Application password
   * @param {string} baseURL - BDApps base URL
   */
  constructor(applicationId, password, baseURL = 'https://developer.bdapps.com') {
    this.applicationId = applicationId;
    this.password = password;
    this.baseURL = baseURL;
  }

  /**
   * Request OTP for a mobile number
   * @param {string} userMobile - Mobile number (without country code prefix, e.g., '01847026XX')
   * @param {object} [metaData] - Optional application meta data
   * @returns {Promise<object>} Response with referenceNo
   */
  async sendOtp(userMobile, metaData = null) {
    // Format mobile number with tel:88 prefix
    const subscriberId = userMobile.startsWith('tel:')
      ? userMobile
      : `tel:88${userMobile}`;

    const requestData = {
      applicationId: this.applicationId,
      password: this.password,
      subscriberId,
      applicationHash: metaData?.applicationHash || 'App Name',
      applicationMetaData: {
        client: metaData?.client || 'MOBILEAPP',
        device: metaData?.device || 'Samsung S10',
        os: metaData?.os || 'android 8',
        appCode: metaData?.appCode || 'https://play.google.com/store/apps/details?id=lk.dialog.megarunlor',
      },
    };

    const url = `${this.baseURL}/subscription/otp/request`;

    try {
      const response = await axios.post(url, requestData, {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      });

      return response.data;
    } catch (error) {
      if (error.response) return error.response.data;
      throw error;
    }
  }

  /**
   * Verify OTP
   * @param {string} referenceNo - Reference number from sendOtp response
   * @param {string} otp - One-time password to verify
   * @returns {Promise<object>} Response with subscriptionStatus
   */
  async verifyOtp(referenceNo, otp) {
    const requestData = {
      applicationId: this.applicationId,
      password: this.password,
      referenceNo,
      otp,
    };

    const url = `${this.baseURL}/subscription/otp/verify`;

    try {
      const response = await axios.post(url, requestData, {
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      });

      return response.data;
    } catch (error) {
      if (error.response) return error.response.data;
      throw error;
    }
  }
}

module.exports = OTPService;
