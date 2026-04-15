/**
 * BDApps REST API Server - Express.js
 * Optimized for cPanel + Better Debugging
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const {
	SMSSender,
	SMSReceiver,
	UssdSender,
	UssdReceiver,
	DirectDebitSender,
	BalanceQuery,
	PaymentInstrumentList,
	Subscription,
	OTPService,
	WebApi,
	Logger,
} = require("./sdk");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BDAPPS_BASE_URL || "https://developer.bdapps.com";

const APP_ID = process.env.BDAPPS_APP_ID || "";
const PASSWORD = process.env.BDAPPS_PASSWORD || "";
const SP_APP_ID = process.env.BDAPPS_SERVICE_PROVIDER_APP_ID || "";
const HASH_SECRET = process.env.BDAPPS_API_SECRET_KEY || "";

const logger = new Logger();

// ─── Health & Debug Routes ─────────────────────────────────────
app.get("/api/v1/health", (req, res) => {
	res.json({ status: "ok", service: "BDApps API Gateway" });
});

app.get("/api/v1/my-ip", (req, res) => {
	const ip =
		req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
		req.socket.remoteAddress ||
		"unknown";

	console.log(`[IP DEBUG] Outbound IP: ${ip}`);
	res.json({
		statusCode: "S1000",
		your_outbound_ip: ip,
		instruction: "Add this IP to bdapps → Allowed Host Addresses",
	});
});

// ─── OTP Request (with debug) ─────────────────────────────────
app.post("/api/v1/otp/request", async (req, res) => {
	try {
		console.log(
			"🔑 [OTP REQUEST] APP_ID used:",
			APP_ID ? APP_ID.substring(0, 8) + "..." : "MISSING",
		);
		console.log("🔑 [OTP REQUEST] PASSWORD present:", !!PASSWORD);

		const { userMobile } = req.body;
		if (!userMobile)
			return res
				.status(400)
				.json({ statusCode: "E1312", statusDetail: "userMobile is required." });

		const otpService = new OTPService(APP_ID, PASSWORD, BASE_URL);
		const result = await otpService.sendOtp(userMobile, req.body);

		logger.writeLog(`OTP requested for ${userMobile}`);
		res.json(result);
	} catch (error) {
		console.error("❌ [OTP REQUEST ERROR]", error.message);
		logger.writeLog(`OTP request error: ${error.message}`);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── OTP Verify ───────────────────────────────────────────────
app.post("/api/v1/otp/verify", async (req, res) => {
	try {
		const { referenceNo, otp } = req.body;
		if (!referenceNo || !otp)
			return res
				.status(400)
				.json({
					statusCode: "E1312",
					statusDetail: "referenceNo and otp required.",
				});

		const otpService = new OTPService(APP_ID, PASSWORD, BASE_URL);
		const result = await otpService.verifyOtp(referenceNo, otp);

		logger.writeLog(`OTP verified: ${referenceNo}`);
		res.json(result);
	} catch (error) {
		console.error("❌ [OTP VERIFY ERROR]", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── Subscription Status (with debug) ───────────────────────
app.post("/api/v1/subscription/status", async (req, res) => {
	try {
		console.log(
			"🔑 [SUBSCRIPTION STATUS] APP_ID used:",
			APP_ID ? APP_ID.substring(0, 8) + "..." : "MISSING",
		);

		const { subscriberId } = req.body;
		if (!subscriberId)
			return res
				.status(400)
				.json({
					statusCode: "E1312",
					statusDetail: "subscriberId is required.",
				});

		const subscription = new Subscription(
			`${BASE_URL}/subscription/send`,
			PASSWORD,
			APP_ID,
		);
		const status = await subscription.getStatus(subscriberId);

		logger.writeLog(`Subscription status for ${subscriberId}: ${status}`);
		res.json({ statusCode: "S1000", subscriptionStatus: status });
	} catch (error) {
		console.error("❌ [SUBSCRIPTION STATUS ERROR]", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// Keep all your other routes exactly as they were (SMS, USSD, CAAS, etc.)
// I have kept them unchanged below for brevity — just copy them from your old file

// ... [All your other endpoints: sms/send, sms/broadcast, ussd, caas, subscription/subscribe, etc.] ...

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`✅ BDApps API Gateway started on port ${PORT}`);
	console.log(`🌐 Live at: https://server.lokhalapps.com`);
	console.log(`🔍 Test IP : /api/v1/my-ip`);
	console.log(`🔍 Test OTP: /api/v1/otp/request`);

	if (!APP_ID || !PASSWORD) {
		console.error(
			"❌ CRITICAL: BDAPPS_APP_ID or BDAPPS_PASSWORD is missing in cPanel!",
		);
	} else {
		console.log(`🔑 App ID loaded successfully (${APP_ID.substring(0, 8)}...)`);
	}
});

module.exports = app;
