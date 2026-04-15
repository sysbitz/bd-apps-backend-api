/**
 * Subscription module - Subscription management
 */

const axios = require("axios");
const https = require("https");

// ─── Custom Exception ───────────────────────────────────────────────
class SubscriptionException extends Error {
	constructor(message, code, response = null) {
		super(message);
		this.name = "SubscriptionException";
		this.statusMessage = message;
		this.code = code;
		this.rawResponse = response;
	}
}

// ─── Helper: normalize subscriberId ────────────────────────────────
// BDApps strictly requires format:  tel:8801XXXXXXXXX  (NO space after "tel:")
function normalizeSubscriberId(address) {
	if (!address) return address;

	// Remove ALL spaces first
	let clean = address.replace(/\s+/g, "");

	// Already correct format
	if (clean.startsWith("tel:")) return clean;

	// Has country code but no prefix
	if (clean.startsWith("880")) return `tel:${clean}`;

	// Local number starting with 0  →  strip leading 0, add 880
	if (clean.startsWith("0")) return `tel:88${clean.slice(1)}`;

	// Local number starting with 1 (e.g. 1XXXXXXXXX)
	if (clean.startsWith("1")) return `tel:880${clean}`;

	return `tel:${clean}`;
}

// ─── Subscription ───────────────────────────────────────────────────
class Subscription {
	constructor(server, password, applicationId) {
		this.server = server;
		this.password = password;
		this.applicationId = applicationId;
	}

	async getStatus(address) {
		const url = "https://developer.bdapps.com/subscription/getstatus";
		const payload = {
			applicationId: this.applicationId,
			password: this.password,
			subscriberId: normalizeSubscriberId(address),
		};

		return this._sendRequest(payload, url);
	}

	async subscribe(address) {
		const url = "https://developer.bdapps.com/subscription/send";
		const payload = {
			applicationId: this.applicationId,
			password: this.password,
			subscriberId: normalizeSubscriberId(address),
			version: "1.0",
			action: "1",
		};

		return this._sendRequest(payload, url);
	}

	async unSubscribe(address) {
		const url = "https://developer.bdapps.com/subscription/send";
		const payload = {
			applicationId: this.applicationId,
			password: this.password,
			subscriberId: normalizeSubscriberId(address),
			version: "1.0",
			action: "0",
		};

		return this._sendRequest(payload, url);
	}

	/** @private */
	async _sendRequest(payload, url) {
		try {
			const httpsAgent = new https.Agent({
				rejectUnauthorized: false,
				keepAlive: true,
			});

			const response = await axios.post(url, payload, {
				headers: { "Content-Type": "application/json" },
				httpsAgent,
				timeout: 15000,
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
			throw new SubscriptionException(
				error.message,
				error.code || "ECONNRESET",
			);
		}
	}

	/** @private */
	_handleResponse(resp) {
		if (!resp || resp === "") {
			throw new SubscriptionException("Server URL is invalid", "500");
		}
		return resp;
	}
}

module.exports = { Subscription, SubscriptionException, normalizeSubscriberId };
