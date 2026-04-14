/**
 * Core module - Base HTTP request handler for BDApps API
 * Equivalent to PHP Core class in sdk_file.php
 */

const axios = require('axios');

class Core {
  /**
   * Send a POST request with JSON payload to the given URL
   * @param {object|string} jsonData - JSON data to send
   * @param {string} url - Target URL
   * @returns {Promise<object>} Parsed JSON response
   */
  async sendRequest(jsonData, url) {
    try {
      const payload = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData);

      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        // Equivalent to CURLOPT_SSL_VERIFYPEER = false
        httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        return error.response.data;
      }
      throw error;
    }
  }
}

module.exports = Core;
