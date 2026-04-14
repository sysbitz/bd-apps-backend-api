/**
 * BDApps REST API Server - Express.js
 * Serves all BDApps SDK operations via REST endpoints
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
} = require('./sdk');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BDAPPS_BASE_URL || 'https://developer.bdapps.com';
const APP_ID = process.env.BDAPPS_APP_ID || '';
const PASSWORD = process.env.BDAPPS_PASSWORD || '';
const SP_APP_ID = process.env.BDAPPS_SERVICE_PROVIDER_APP_ID || '';
const HASH_SECRET = process.env.BDAPPS_API_SECRET_KEY || "";

const logger = new Logger();

// ─── Health Check ───────────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BDApps API Gateway',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/v1/sms/send',
      'POST /api/v1/sms/broadcast',
      'POST /api/v1/sms/receive',
      'POST /api/v1/ussd/send',
      'POST /api/v1/ussd/receive',
      'POST /api/v1/caas/direct-debit',
      'POST /api/v1/caas/balance-query',
      'POST /api/v1/caas/payment-instruments',
      'POST /api/v1/subscription/status',
      'POST /api/v1/subscription/subscribe',
      'POST /api/v1/subscription/unsubscribe',
      'POST /api/v1/otp/request',
      'POST /api/v1/otp/verify',
      'POST /api/v1/subscription/activate',
      'POST /api/v1/notification',
    ],
  });
});

// ─── SMS: Send ──────────────────────────────────────────────────────
app.post('/api/v1/sms/send', async (req, res) => {
  try {
    const { message, destinationAddresses, sourceAddress, encoding, version, deliveryStatusRequest, binaryHeader, chargingAmount } = req.body;

    if (!message || !destinationAddresses) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'message and destinationAddresses are required.' });
    }

    const sender = new SMSSender(`${BASE_URL}/sms/send`, APP_ID, PASSWORD);
    if (sourceAddress) sender.setSourceAddress(sourceAddress);
    if (encoding) sender.setEncoding(encoding);
    if (version) sender.setVersion(version);
    if (deliveryStatusRequest) sender.setDeliveryStatusRequest(deliveryStatusRequest);
    if (binaryHeader) sender.setBinaryHeader(binaryHeader);
    if (chargingAmount) sender.setChargingAmount(chargingAmount);

    const result = await sender.sms(message, destinationAddresses);
    logger.writeLog(`SMS sent to ${JSON.stringify(destinationAddresses)}`);

    res.json({ statusCode: 'S1000', statusDetail: 'SMS sent successfully', result });
  } catch (error) {
    logger.writeLog(`SMS send error: ${error.message}`);
    res.status(500).json({ statusCode: error.statusCode || 'E1601', statusDetail: error.message });
  }
});

// ─── SMS: Broadcast ─────────────────────────────────────────────────
app.post('/api/v1/sms/broadcast', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'message is required.' });
    }

    const sender = new SMSSender(`${BASE_URL}/sms/send`, APP_ID, PASSWORD);
    const result = await sender.broadcast(message);
    logger.writeLog(`SMS broadcast sent`);

    res.json({ statusCode: 'S1000', statusDetail: 'Broadcast sent successfully', result });
  } catch (error) {
    logger.writeLog(`SMS broadcast error: ${error.message}`);
    res.status(500).json({ statusCode: error.statusCode || 'E1601', statusDetail: error.message });
  }
});

// ─── SMS: Receive (Webhook) ─────────────────────────────────────────
app.post('/api/v1/sms/receive', (req, res) => {
  try {
    const receiver = new SMSReceiver(req.body);
    const data = {
      version: receiver.getVersion(),
      applicationId: receiver.getApplicationId(),
      sourceAddress: receiver.getAddress(),
      message: receiver.getMessage(),
      requestId: receiver.getRequestId(),
      encoding: receiver.getEncoding(),
    };

    logger.writeLog(`SMS received from ${data.sourceAddress}: ${data.message}`);
    res.json(receiver.getResponse());
  } catch (error) {
    logger.writeLog(`SMS receive error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── USSD: Send ─────────────────────────────────────────────────────
app.post('/api/v1/ussd/send', async (req, res) => {
  try {
    const { sessionId, message, destinationAddress, ussdOperation } = req.body;

    if (!sessionId || !message || !destinationAddress) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'sessionId, message, and destinationAddress are required.' });
    }

    const sender = new UssdSender(`${BASE_URL}/ussd/send`, APP_ID, PASSWORD);
    const result = await sender.ussd(sessionId, message, destinationAddress, ussdOperation || 'mo-cont');
    logger.writeLog(`USSD sent to ${destinationAddress}`);

    res.json({ statusCode: 'S1000', statusDetail: 'USSD sent successfully', result });
  } catch (error) {
    logger.writeLog(`USSD send error: ${error.message}`);
    res.status(500).json({ statusCode: error.statusCode || 'E1601', statusDetail: error.message });
  }
});

// ─── USSD: Receive (Webhook) ────────────────────────────────────────
app.post('/api/v1/ussd/receive', (req, res) => {
  try {
    const receiver = new UssdReceiver(req.body);
    const data = {
      sourceAddress: receiver.getAddress(),
      message: receiver.getMessage(),
      requestId: receiver.getRequestID(),
      applicationId: receiver.getApplicationId(),
      encoding: receiver.getEncoding(),
      version: receiver.getVersion(),
      sessionId: receiver.getSessionId(),
      ussdOperation: receiver.getUssdOperation(),
    };

    logger.writeLog(`USSD received from ${data.sourceAddress}: ${data.message}`);
    res.json(receiver.getResponse());
  } catch (error) {
    logger.writeLog(`USSD receive error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── CAAS: Direct Debit ─────────────────────────────────────────────
app.post('/api/v1/caas/direct-debit', async (req, res) => {
  try {
    const { externalTrxId, subscriberId, amount } = req.body;

    if (!externalTrxId || !subscriberId || !amount) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'externalTrxId, subscriberId, and amount are required.' });
    }

    const debitSender = new DirectDebitSender(`${BASE_URL}/caas/direct/debit`, APP_ID, PASSWORD);
    const status = await debitSender.cass(externalTrxId, subscriberId, amount);
    logger.writeLog(`Direct debit charged: ${subscriberId} amount ${amount}`);

    res.json({ statusCode: status, statusDetail: 'Direct debit processed successfully' });
  } catch (error) {
    logger.writeLog(`Direct debit error: ${error.message}`);
    res.status(500).json({ statusCode: error.code || 'E1601', statusDetail: error.message });
  }
});

// ─── CAAS: Balance Query ────────────────────────────────────────────
app.post('/api/v1/caas/balance-query', async (req, res) => {
  try {
    const { subscriberId, paymentInstrumentName } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'subscriberId is required.' });
    }

    const balanceQuery = new BalanceQuery(APP_ID, PASSWORD);
    const result = await balanceQuery.queryBalance(subscriberId, paymentInstrumentName || 'Mobile Account');
    logger.writeLog(`Balance queried for ${subscriberId}`);

    res.json(result);
  } catch (error) {
    logger.writeLog(`Balance query error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── CAAS: Payment Instruments ──────────────────────────────────────
app.post('/api/v1/caas/payment-instruments', async (req, res) => {
  try {
    const { subscriberId, type } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'subscriberId is required.' });
    }

    const piList = new PaymentInstrumentList(APP_ID, PASSWORD);
    const result = await piList.getList(subscriberId, type || 'all');
    logger.writeLog(`Payment instruments queried for ${subscriberId}`);

    res.json(result);
  } catch (error) {
    logger.writeLog(`Payment instruments error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── Subscription: Get Status ───────────────────────────────────────
app.post('/api/v1/subscription/status', async (req, res) => {
  try {
    const { subscriberId } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'subscriberId is required.' });
    }

    const subscription = new Subscription(`${BASE_URL}/subscription/send`, PASSWORD, APP_ID);
    const status = await subscription.getStatus(subscriberId);
    logger.writeLog(`Subscription status for ${subscriberId}: ${status}`);

    res.json({ statusCode: 'S1000', subscriptionStatus: status });
  } catch (error) {
    logger.writeLog(`Subscription status error: ${error.message}`);
    res.status(500).json({ statusCode: error.code || 'E1601', statusDetail: error.message });
  }
});

// ─── Subscription: Subscribe ────────────────────────────────────────
app.post('/api/v1/subscription/subscribe', async (req, res) => {
  try {
    const { subscriberId } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'subscriberId is required.' });
    }

    const subscription = new Subscription(`${BASE_URL}/subscription/send`, PASSWORD, APP_ID);
    const status = await subscription.subscribe(subscriberId);
    logger.writeLog(`Subscribed: ${subscriberId}`);

    res.json({ statusCode: 'S1000', subscriptionStatus: status });
  } catch (error) {
    logger.writeLog(`Subscribe error: ${error.message}`);
    res.status(500).json({ statusCode: error.code || 'E1601', statusDetail: error.message });
  }
});

// ─── Subscription: Unsubscribe ──────────────────────────────────────
app.post('/api/v1/subscription/unsubscribe', async (req, res) => {
  try {
    const { subscriberId } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'subscriberId is required.' });
    }

    const subscription = new Subscription(`${BASE_URL}/subscription/send`, PASSWORD, APP_ID);
    const status = await subscription.unSubscribe(subscriberId);
    logger.writeLog(`Unsubscribed: ${subscriberId}`);

    res.json({ statusCode: 'S1000', subscriptionStatus: status });
  } catch (error) {
    logger.writeLog(`Unsubscribe error: ${error.message}`);
    res.status(500).json({ statusCode: error.code || 'E1601', statusDetail: error.message });
  }
});

// ─── OTP: Request ───────────────────────────────────────────────────
app.post('/api/v1/otp/request', async (req, res) => {
  try {
    const { userMobile, applicationHash, client, device, os, appCode } = req.body;

    if (!userMobile) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'userMobile is required.' });
    }

    const otpService = new OTPService(APP_ID, PASSWORD, BASE_URL);
    const result = await otpService.sendOtp(userMobile, { applicationHash, client, device, os, appCode });
    logger.writeLog(`OTP requested for ${userMobile}`);

    res.json(result);
  } catch (error) {
    logger.writeLog(`OTP request error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── OTP: Verify ────────────────────────────────────────────────────
app.post('/api/v1/otp/verify', async (req, res) => {
  try {
    const { referenceNo, otp } = req.body;

    if (!referenceNo || !otp) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'referenceNo and otp are required.' });
    }

    const otpService = new OTPService(APP_ID, PASSWORD, BASE_URL);
    const result = await otpService.verifyOtp(referenceNo, otp);
    logger.writeLog(`OTP verified: ref ${referenceNo}`);

    res.json(result);
  } catch (error) {
    logger.writeLog(`OTP verify error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── Subscription Activation (WebApi) ───────────────────────────────
app.post('/api/v1/subscription/activate', async (req, res) => {
  try {
    const { subscriberId } = req.body;

    if (!subscriberId) {
      return res.status(400).json({ statusCode: 'E1312', statusDetail: 'subscriberId is required.' });
    }

    const webApi = new WebApi(APP_ID, SP_APP_ID, HASH_SECRET);
    webApi.getAppAndSubscriber(subscriberId);
    const result = await webApi.requestSend();
    logger.writeLog(`Subscription activation sent for: ${subscriberId}`);

    res.json(result);
  } catch (error) {
    logger.writeLog(`Subscription activation error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── Notification Webhook ───────────────────────────────────────────
app.post('/api/v1/notification', (req, res) => {
  try {
    const { timeStamp, status, applicationId, subscriberId, frequency } = req.body;

    const logEntry = `TimeStamp:${timeStamp} |Status:${status} |App Id:${applicationId} |SubscriberId:${subscriberId} |Frequency:${frequency}`;
    logger.writeLog(`Subscription Notification: ${logEntry}`);

    console.log(`[Notification] ${logEntry}`);

    res.json({ statusCode: 'S1000', statusDetail: 'Notification received successfully' });
  } catch (error) {
    logger.writeLog(`Notification error: ${error.message}`);
    res.status(500).json({ statusCode: 'E1601', statusDetail: error.message });
  }
});

// ─── Start Server ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║       BDApps API Gateway - Express.js            ║`);
  console.log(`╠══════════════════════════════════════════════════╣`);
  console.log(`║  Server running on: http://localhost:${PORT}        ║`);
  console.log(`║  Health check:      GET  /api/v1/health           ║`);
  console.log(`║  App ID:            ${APP_ID.padEnd(28)}║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});

module.exports = app;
