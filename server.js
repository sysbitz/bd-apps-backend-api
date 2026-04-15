/**
 * BDApps REST API Server - Express.js
 * Fixed version for cPanel
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { SMSSender, SMSReceiver } = require("./sdk/sms");
const { UssdSender, UssdReceiver } = require("./sdk/ussd");
const { Subscription } = require("./sdk/subscription");
const OTPService = require("./sdk/otp");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BDAPPS_BASE_URL || "https://developer.bdapps.com";
const APP_ID = process.env.BDAPPS_APP_ID || "";
const PASSWORD = process.env.BDAPPS_API_SECRET_KEY || "";

// ─── Guard: warn on startup if creds missing ───────────────────
if (!APP_ID || !PASSWORD) {
	console.error(
		"❌ CRITICAL: BDAPPS_APP_ID or BDAPPS_PASSWORD is missing in cPanel env!",
	);
}

// ─── Health & Debug ────────────────────────────────────────────
app.get("/api/v1/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/v1/debug-env", (req, res) => {
	res.json({
		BASE_URL,
		APP_ID: APP_ID ? APP_ID.substring(0, 6) + "..." : "❌ MISSING",
		PASSWORD: PASSWORD ? "✅ loaded" : "❌ MISSING",
	});
});

app.get("/api/v1/my-ip", (req, res) => {
	const ip =
		req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
		req.socket.remoteAddress ||
		"unknown";
	res.json({ outbound_ip: ip });
});

// ─── Subscription: Status ──────────────────────────────────────
// POST /api/v1/subscription/status
// Body: { "subscriberId": "tel:8801XXXXXXXXX" }
app.post("/api/v1/subscription/status", async (req, res) => {
	try {
		const { subscriberId } = req.body;
		if (!subscriberId)
			return res
				.status(400)
				.json({
					statusCode: "E1312",
					statusDetail: "subscriberId is required",
				});

		// ✅ Correct order: (server, password, applicationId)
		const subscription = new Subscription(BASE_URL, PASSWORD, APP_ID);
		const result = await subscription.getStatus(subscriberId);
		res.json(result);
	} catch (error) {
		console.error("❌ SUB STATUS ERROR:", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── Subscription: Subscribe ───────────────────────────────────
// POST /api/v1/subscription/subscribe
// Body: { "subscriberId": "tel:8801XXXXXXXXX" }
app.post("/api/v1/subscription/subscribe", async (req, res) => {
	try {
		const { subscriberId } = req.body;
		if (!subscriberId)
			return res
				.status(400)
				.json({
					statusCode: "E1312",
					statusDetail: "subscriberId is required",
				});

		// ✅ Correct order: (server, password, applicationId)
		const subscription = new Subscription(BASE_URL, PASSWORD, APP_ID);
		const result = await subscription.subscribe(subscriberId);
		res.json(result);
	} catch (error) {
		console.error("❌ SUBSCRIBE ERROR:", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── Subscription: Unsubscribe ─────────────────────────────────
// POST /api/v1/subscription/unsubscribe
// Body: { "subscriberId": "tel:8801XXXXXXXXX" }
app.post("/api/v1/subscription/unsubscribe", async (req, res) => {
	try {
		const { subscriberId } = req.body;
		if (!subscriberId)
			return res
				.status(400)
				.json({
					statusCode: "E1312",
					statusDetail: "subscriberId is required",
				});

		// ✅ Correct order: (server, password, applicationId)
		const subscription = new Subscription(BASE_URL, PASSWORD, APP_ID);
		const result = await subscription.unSubscribe(subscriberId);
		res.json(result);
	} catch (error) {
		console.error("❌ UNSUBSCRIBE ERROR:", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── SMS: Send ─────────────────────────────────────────────────
// POST /api/v1/sms/send
// Body: { "message": "Hello", "destinationAddresses": ["tel:8801XXXXXXXXX"] }
app.post("/api/v1/sms/send", async (req, res) => {
	try {
		const { message, destinationAddresses, sourceAddress, encoding } = req.body;
		if (!message || !destinationAddresses?.length)
			return res
				.status(400)
				.json({
					statusCode: "E1312",
					statusDetail: "message and destinationAddresses are required",
				});

		const sender = new SMSSender(`${BASE_URL}/sms/send`, APP_ID, PASSWORD);
		if (sourceAddress) sender.setSourceAddress(sourceAddress);
		if (encoding) sender.setEncoding(encoding);

		await sender.sms(message, destinationAddresses);
		res.json({
			statusCode: "S1000",
			statusDetail: "Message sent successfully",
		});
	} catch (error) {
		console.error("❌ SMS SEND ERROR:", error.message);
		res
			.status(500)
			.json({
				statusCode: error.statusCode || "E1601",
				statusDetail: error.message,
			});
	}
});

// ─── SMS: Broadcast ────────────────────────────────────────────
// POST /api/v1/sms/broadcast
// Body: { "message": "Hello everyone" }
app.post("/api/v1/sms/broadcast", async (req, res) => {
	try {
		const { message } = req.body;
		if (!message)
			return res
				.status(400)
				.json({ statusCode: "E1312", statusDetail: "message is required" });

		const sender = new SMSSender(`${BASE_URL}/sms/send`, APP_ID, PASSWORD);
		await sender.broadcast(message);
		res.json({
			statusCode: "S1000",
			statusDetail: "Broadcast sent successfully",
		});
	} catch (error) {
		console.error("❌ SMS BROADCAST ERROR:", error.message);
		res
			.status(500)
			.json({
				statusCode: error.statusCode || "E1601",
				statusDetail: error.message,
			});
	}
});

// ─── SMS: Receive (inbound webhook from BDApps) ────────────────
// POST /api/v1/sms/receive
app.post("/api/v1/sms/receive", (req, res) => {
	try {
		const receiver = new SMSReceiver(req.body);
		console.log(
			"📥 Inbound SMS from:",
			receiver.getAddress(),
			"→",
			receiver.getMessage(),
		);
		// TODO: handle inbound message (save to DB, trigger reply, etc.)
		res.json(receiver.getResponse());
	} catch (error) {
		console.error("❌ SMS RECEIVE ERROR:", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── OTP: Request ─────────────────────────────────────────────
// POST /api/v1/otp/request
// Body: { "userMobile": "01XXXXXXXXX" }
app.post("/api/v1/otp/request", async (req, res) => {
	try {
		const { userMobile } = req.body;
		if (!userMobile)
			return res
				.status(400)
				.json({ statusCode: "E1312", statusDetail: "userMobile is required" });

		const otpService = new OTPService(APP_ID, PASSWORD, BASE_URL);
		const result = await otpService.sendOtp(userMobile, req.body);
		res.json(result);
	} catch (error) {
		console.error("❌ OTP REQUEST ERROR:", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── OTP: Verify ──────────────────────────────────────────────
// POST /api/v1/otp/verify
// Body: { "referenceNo": "...", "otp": "123456" }
app.post("/api/v1/otp/verify", async (req, res) => {
	try {
		const { referenceNo, otp } = req.body;
		if (!referenceNo || !otp)
			return res
				.status(400)
				.json({
					statusCode: "E1312",
					statusDetail: "referenceNo and otp are required",
				});

		const otpService = new OTPService(APP_ID, PASSWORD, BASE_URL);
		const result = await otpService.verifyOtp(referenceNo, otp);
		res.json(result);
	} catch (error) {
		console.error("❌ OTP VERIFY ERROR:", error.message);
		res.status(500).json({ statusCode: "E1601", statusDetail: error.message });
	}
});

// ─── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
	console.log(`✅ BDApps API Gateway running on port ${PORT}`);
	console.log(`🔍 Debug: GET /api/v1/debug-env`);
	console.log(`🔍 Health: GET /api/v1/health`);
});

module.exports = app;
