# BDApps SDK — Multi-Language API Wrapper

A comprehensive SDK and REST API gateway for the **BDApps** (Bangladesh Developer Apps) platform, supporting **SMS**, **USSD**, **CAAS (Charging as a Service)**, **OTP**, and **Subscription** services. Originally written in PHP, now available in **JavaScript (Node.js)** and **Python**.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [JavaScript (Express.js)](#javascript-expressjs)
  - [Python (FastAPI)](#python-fastapi)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
  - [Health Check](#1-health-check)
  - [SMS APIs](#2-sms-apis)
  - [USSD APIs](#3-ussd-apis)
  - [CAAS APIs](#4-caas-apis)
  - [Subscription APIs](#5-subscription-apis)
  - [OTP APIs](#6-otp-apis)
  - [Notification Webhook](#7-notification-webhook)
- [SDK Usage (Direct)](#sdk-usage-direct)
- [Client Test Program](#client-test-program)
- [PHP Source Reference](#php-source-reference)
- [Status Codes](#status-codes)
- [License](#license)

---

## Overview

**BDApps** is a mobile application platform by Robi Axiata (Bangladesh) that provides APIs for:

| Service | Description |
|---------|-------------|
| **SMS** | Send and receive SMS messages via HTTP API |
| **USSD** | Initiate and manage USSD sessions |
| **CAAS** | Charge subscribers via Direct Debit, query balances, list payment instruments |
| **OTP** | Request and verify one-time passwords for MSISDN verification |
| **Subscription** | Manage user subscriptions (subscribe, unsubscribe, check status) |

This project provides:
1. **SDK Libraries** — Reusable classes for each BDApps service
2. **REST API Servers** — Express.js (JavaScript) and FastAPI (Python) backends
3. **CLI Test Clients** — Interactive programs to test all endpoints
4. **Original PHP Code** — The source PHP files for reference

---

## Project Structure

```
Demo Pro App/
│
├── README.md                      ← You are here
├── implementation_plan.md         ← Technical implementation plan
├── task.md                        ← Task completion checklist
├── walkthrough.md                 ← Conversion walkthrough & mapping
│
├── api/                           ← API Documentation
│   ├── bdapps_docs.txt            ← Full API docs (text format)
│   ├── bdapps-API Documentation-DGD v1.1.3.pdf  ← Official PDF docs
│   └── api_list.txt               ← API path reference
│
├── php/                           ← Original PHP source files
│   ├── sdk_file.php               ← Core SDK (all classes)
│   ├── sms.php                    ← SMS example
│   ├── ussd.php                   ← USSD example
│   ├── caas.php                   ← CAAS Direct Debit example
│   ├── send_otp.php               ← OTP request
│   ├── verify_otp.php             ← OTP verification
│   └── subscription_notification.php  ← Notification webhook
│
├── javascript/                    ← JavaScript Implementation
│   ├── .env                       ← Environment variables
│   ├── package.json               ← Dependencies
│   ├── server.js                  ← Express.js REST API server
│   ├── client.js                  ← Interactive CLI test client
│   └── sdk/                       ← SDK library modules
│       ├── index.js               ← Re-exports all modules
│       ├── core.js                ← Core HTTP handler
│       ├── sms.js                 ← SMS Sender/Receiver
│       ├── ussd.js                ← USSD Sender/Receiver
│       ├── caas.js                ← CAAS Direct Debit/Balance/PI
│       ├── subscription.js        ← Subscription management
│       ├── otp.js                 ← OTP request/verify
│       ├── webapi.js              ← Subscription activation
│       └── logger.js              ← File logger
│
└── python/                        ← Python Implementation
    ├── .env                       ← Environment variables
    ├── requirements.txt           ← Dependencies
    ├── server.py                  ← FastAPI REST API server
    ├── client.py                  ← Interactive CLI test client
    └── sdk/                       ← SDK library package
        ├── __init__.py            ← Package exports
        ├── core.py                ← Core HTTP handler
        ├── exceptions.py          ← Custom exceptions
        ├── sms.py                 ← SMS Sender/Receiver
        ├── ussd.py                ← USSD Sender/Receiver
        ├── caas.py                ← CAAS Direct Debit/Balance/PI
        ├── subscription.py        ← Subscription management
        ├── otp.py                 ← OTP request/verify
        ├── webapi.py              ← Subscription activation
        └── logger.py              ← File logger
```

---

## Quick Start

### JavaScript (Express.js)

```bash
cd javascript
npm install
npm start                  # Server starts on http://localhost:3000
```

In a separate terminal:
```bash
cd javascript
npm run client             # Interactive test client
```

### Python (FastAPI)

```bash
cd python
pip install -r requirements.txt
python server.py           # Server starts on http://localhost:8000
```

In a separate terminal:
```bash
cd python
python client.py           # Interactive test client
```

> **💡 Tip:** FastAPI auto-generates interactive Swagger docs at **http://localhost:8000/docs**

---

## Configuration

Both implementations use `.env` files for configuration. Update these with your actual BDApps credentials:

```env
# BDApps API Configuration
BDAPPS_BASE_URL=https://developer.bdapps.com
BDAPPS_APP_ID=APP_010000
BDAPPS_PASSWORD=569f9edcb7f5753d47ceb13722065566
BDAPPS_SERVICE_PROVIDER_APP_ID=DSAPP_000003
BDAPPS_HASH_SECRET=8c899b6b56e6855605ea61be994012e7
BDAPPS_APP_HASH=App Name

# Server Configuration
PORT=3000    # JavaScript (use 8000 for Python)
```

| Variable | Description |
|----------|-------------|
| `BDAPPS_BASE_URL` | BDApps API base URL |
| `BDAPPS_APP_ID` | Your application ID (provided during provisioning) |
| `BDAPPS_PASSWORD` | Your application password (MD5 hash, provided during provisioning) |
| `BDAPPS_SERVICE_PROVIDER_APP_ID` | Service provider application ID |
| `BDAPPS_HASH_SECRET` | Secret key for SHA256 signature generation |
| `BDAPPS_APP_HASH` | Application hash for OTP SMS Retriever API |
| `PORT` | Server port number |

---

## API Documentation

All endpoints use **JSON** request/response bodies with `Content-Type: application/json`.

**Base URLs:**
- JavaScript: `http://localhost:3000`
- Python: `http://localhost:8000`

---

### 1. Health Check

Check server status and list available endpoints.

**`GET /api/v1/health`**

**Response:**
```json
{
  "status": "ok",
  "service": "BDApps API Gateway",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "endpoints": [
    "POST /api/v1/sms/send",
    "POST /api/v1/sms/broadcast",
    "..."
  ]
}
```

---

### 2. SMS APIs

#### 2.1 Send SMS

Send an SMS to one or more destination addresses.

**`POST /api/v1/sms/send`**

**Request Body:**
```json
{
  "message": "Hello World",
  "destinationAddresses": ["tel:8801812345678"],
  "sourceAddress": "shortcode",
  "encoding": "0",
  "version": "1.0",
  "deliveryStatusRequest": "1",
  "binaryHeader": null,
  "chargingAmount": "5.00"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ | SMS message content |
| `destinationAddresses` | string[] | ✅ | List of phone numbers (`tel:88XXXXXXXXXXX`) |
| `sourceAddress` | string | ❌ | Sender address / shortcode |
| `encoding` | string | ❌ | `0` = Text, `16` = Bengali, `240` = Flash, `245` = Binary |
| `version` | string | ❌ | API version (e.g., `"1.0"`) |
| `deliveryStatusRequest` | string | ❌ | `"0"` = No report, `"1"` = Report required |
| `binaryHeader` | string | ❌ | Hex string for Flash/Binary SMS |
| `chargingAmount` | string | ❌ | Amount to charge (e.g., `"8.25"`) |

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "SMS sent successfully",
  "result": true
}
```

#### 2.2 Broadcast SMS

Broadcast a message to all subscribed users.

**`POST /api/v1/sms/broadcast`**

**Request Body:**
```json
{
  "message": "Broadcast message to all subscribers"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ | Broadcast message content |

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Broadcast sent successfully",
  "result": true
}
```

#### 2.3 Receive SMS (Webhook)

Webhook endpoint to receive incoming SMS messages from subscribers.

**`POST /api/v1/sms/receive`**

**Request Body (sent by BDApps platform):**
```json
{
  "message": "Test Message",
  "requestId": "51307311302350037",
  "applicationId": "APP_000006",
  "sourceAddress": "tel:8801832160987",
  "version": "1.0",
  "encoding": "0"
}
```

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Process completed successfully."
}
```

---

### 3. USSD APIs

#### 3.1 Send USSD

Send a USSD message to a subscriber.

**`POST /api/v1/ussd/send`**

**Request Body:**
```json
{
  "sessionId": "1330929317043",
  "message": "1. Press One\n2. Press Two\n3. Exit",
  "destinationAddress": "tel:8801812345678",
  "ussdOperation": "mt-cont"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | ✅ | Unique session identifier |
| `message` | string | ✅ | USSD menu/message content |
| `destinationAddress` | string | ✅ | Subscriber phone number |
| `ussdOperation` | string | ❌ | `mo-init`, `mo-cont`, `mt-init`, `mt-cont`, `mt-fin` (default: `mo-cont`) |

**USSD Operations:**
| Operation | Description |
|-----------|-------------|
| `mo-init` | Subscriber initiates a USSD session |
| `mo-cont` | Subscriber continues an existing session |
| `mt-init` | Application initiates a USSD session |
| `mt-cont` | Application continues an existing session |
| `mt-fin` | Application ends the session with a final message |

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "USSD sent successfully",
  "result": { "statusCode": "S1000", "requestId": "101308060614220956" }
}
```

#### 3.2 Receive USSD (Webhook)

Webhook endpoint to receive incoming USSD messages from subscribers.

**`POST /api/v1/ussd/receive`**

**Request Body (sent by BDApps platform):**
```json
{
  "message": "010",
  "ussdOperation": "mo-init",
  "requestId": "071308060343170263",
  "sessionId": "1209992331266121",
  "encoding": "16",
  "applicationId": "APP_003117",
  "sourceAddress": "tel:8801812345678",
  "version": "1.0"
}
```

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Success"
}
```

---

### 4. CAAS APIs

#### 4.1 Direct Debit

Charge a specific amount from a subscriber's account.

**`POST /api/v1/caas/direct-debit`**

**Request Body:**
```json
{
  "externalTrxId": "25609",
  "subscriberId": "tel:8801812345678",
  "amount": "5"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `externalTrxId` | string | ✅ | Your transaction ID (for matching responses) |
| `subscriberId` | string | ✅ | Subscriber phone number (`tel:88XXXXXXXXXXX`) |
| `amount` | string | ✅ | Amount to charge (e.g., `"5"` or `"78.05"`) |

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Direct debit processed successfully"
}
```

#### 4.2 Balance Query

Query a subscriber's account balance.

**`POST /api/v1/caas/balance-query`**

**Request Body:**
```json
{
  "subscriberId": "tel:8801812345678",
  "paymentInstrumentName": "Mobile Account"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subscriberId` | string | ✅ | Subscriber phone number |
| `paymentInstrumentName` | string | ❌ | Default: `"Mobile Account"` |

**Response:**
```json
{
  "statusCode": "S1000",
  "chargeableBalance": "100",
  "statusDetail": "Request was successfully processed",
  "accountStatus": "0",
  "accountType": "PREPAID"
}
```

#### 4.3 Payment Instruments

Get the list of available payment instruments for a subscriber.

**`POST /api/v1/caas/payment-instruments`**

**Request Body:**
```json
{
  "subscriberId": "tel:8801812345678",
  "type": "all"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subscriberId` | string | ✅ | Subscriber phone number |
| `type` | string | ❌ | `"sync"`, `"async"`, or `"all"` (default: `"all"`) |

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Success",
  "paymentInstrumentList": [
    { "name": "Mobile Account", "type": "sync" }
  ]
}
```

---

### 5. Subscription APIs

#### 5.1 Get Subscription Status

Check if a subscriber is registered/subscribed.

**`POST /api/v1/subscription/status`**

**Request Body:**
```json
{
  "subscriberId": "tel:8801812345678"
}
```

**Response:**
```json
{
  "statusCode": "S1000",
  "subscriptionStatus": "REGISTERED"
}
```

#### 5.2 Subscribe

Subscribe a user to the application.

**`POST /api/v1/subscription/subscribe`**

**Request Body:**
```json
{
  "subscriberId": "tel:8801812345678"
}
```

**Response:**
```json
{
  "statusCode": "S1000",
  "subscriptionStatus": "REGISTERED"
}
```

#### 5.3 Unsubscribe

Unsubscribe a user from the application.

**`POST /api/v1/subscription/unsubscribe`**

**Request Body:**
```json
{
  "subscriberId": "tel:8801812345678"
}
```

**Response:**
```json
{
  "statusCode": "S1000",
  "subscriptionStatus": "UNREGISTERED"
}
```

#### 5.4 Subscription Activation (WebApi)

Activate a subscription via the WebApi mechanism (with SHA256 signature).

**`POST /api/v1/subscription/activate`**

**Request Body:**
```json
{
  "subscriberId": "tel:8801812345678"
}
```

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Success"
}
```

---

### 6. OTP APIs

#### 6.1 Request OTP

Request a one-time password to be sent to a mobile number for verification.

**`POST /api/v1/otp/request`**

**Request Body:**
```json
{
  "userMobile": "01812345678",
  "applicationHash": "abcdefgh",
  "client": "MOBILEAPP",
  "device": "Samsung S10",
  "os": "android 8",
  "appCode": "https://play.google.com/store/apps/details?id=com.example.app"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userMobile` | string | ✅ | Mobile number (without `tel:88` prefix) |
| `applicationHash` | string | ❌ | App hash for SMS Retriever API (11 chars) |
| `client` | string | ❌ | `"MOBILEAPP"` or `"WEBAPP"` |
| `device` | string | ❌ | Device model (e.g., `"Samsung S10"`) |
| `os` | string | ❌ | OS version (e.g., `"android 8"`) |
| `appCode` | string | ❌ | App store URL or web link |

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Success",
  "referenceNo": "213561321321613",
  "version": "1.0"
}
```

#### 6.2 Verify OTP

Verify the OTP entered by the user.

**`POST /api/v1/otp/verify`**

**Request Body:**
```json
{
  "referenceNo": "213561321321613",
  "otp": "123456"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `referenceNo` | string | ✅ | Reference number from OTP request response |
| `otp` | string | ✅ | 6-digit OTP entered by the user |

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Success",
  "subscriptionStatus": "REGISTERED",
  "version": "1.0",
  "subscriberId": "tel:maskedsubscriberid"
}
```

---

### 7. Notification Webhook

Receive subscription notification events from the BDApps platform.

**`POST /api/v1/notification`**

**Request Body (sent by BDApps platform):**
```json
{
  "timeStamp": "2024-01-01T00:00:00.000Z",
  "status": "REGISTERED",
  "applicationId": "APP_010000",
  "subscriberId": "tel:8801812345678",
  "frequency": "DAILY"
}
```

**Response:**
```json
{
  "statusCode": "S1000",
  "statusDetail": "Notification received successfully"
}
```

---

## SDK Usage (Direct)

You can also use the SDK modules directly without the REST server.

### JavaScript

```javascript
require('dotenv').config();
const { SMSSender, OTPService, Subscription } = require('./sdk');

// Send SMS
const sender = new SMSSender(
  'https://developer.bdapps.com/sms/send',
  process.env.BDAPPS_APP_ID,
  process.env.BDAPPS_PASSWORD
);
const result = await sender.sms('Hello!', ['tel:8801812345678']);

// Request OTP
const otp = new OTPService(
  process.env.BDAPPS_APP_ID,
  process.env.BDAPPS_PASSWORD
);
const otpResult = await otp.sendOtp('01812345678');

// Check subscription
const sub = new Subscription(
  'https://developer.bdapps.com/subscription/send',
  process.env.BDAPPS_PASSWORD,
  process.env.BDAPPS_APP_ID
);
const status = await sub.getStatus('tel:8801812345678');
```

### Python

```python
import asyncio
from dotenv import load_dotenv
import os

load_dotenv()
from sdk import SMSSender, OTPService, Subscription

async def main():
    # Send SMS
    sender = SMSSender(
        "https://developer.bdapps.com/sms/send",
        os.getenv("BDAPPS_APP_ID"),
        os.getenv("BDAPPS_PASSWORD"),
    )
    result = await sender.sms("Hello!", ["tel:8801812345678"])

    # Request OTP
    otp = OTPService(os.getenv("BDAPPS_APP_ID"), os.getenv("BDAPPS_PASSWORD"))
    otp_result = await otp.send_otp("01812345678")

    # Check subscription
    sub = Subscription(
        "https://developer.bdapps.com/subscription/send",
        os.getenv("BDAPPS_PASSWORD"),
        os.getenv("BDAPPS_APP_ID"),
    )
    status = await sub.get_status("tel:8801812345678")

asyncio.run(main())
```

---

## Client Test Program

Both languages include an interactive CLI client with a menu-driven interface:

```
┌─────────────────────────────────────────┐
│           Select an Operation            │
├─────────────────────────────────────────┤
│  0.  Run ALL tests automatically         │
│  1.  Health Check                        │
│  2.  SMS Send                            │
│  3.  SMS Broadcast                       │
│  4.  SMS Receive (Simulate)              │
│  5.  USSD Send                           │
│  6.  USSD Receive (Simulate)             │
│  7.  CAAS Direct Debit                   │
│  8.  CAAS Balance Query                  │
│  9.  CAAS Payment Instruments            │
│  10. Subscription Status                 │
│  11. Subscribe                           │
│  12. Unsubscribe                         │
│  13. OTP Request                         │
│  14. OTP Verify                          │
│  15. Subscription Activation             │
│  16. Notification (Simulate)             │
│  q.  Quit                                │
└─────────────────────────────────────────┘
```

Select **0** to run all tests automatically with sample data, or pick individual endpoints to test interactively.

---

## PHP Source Reference

The original PHP files that were converted:

| PHP File | What It Does |
|----------|-------------|
| `php/sdk_file.php` | Core SDK with all classes: `Core`, `SMSReceiver`, `SMSSender`, `UssdReceiver`, `UssdSender`, `DirectDebitSender`, `Subscription`, `WebApi`, `Logger` |
| `php/sms.php` | SMS receive and reply example |
| `php/ussd.php` | USSD session handler with subscription check |
| `php/caas.php` | Direct debit charging with SMS confirmation |
| `php/send_otp.php` | OTP request via cURL |
| `php/verify_otp.php` | OTP verification via cURL |
| `php/subscription_notification.php` | Webhook handler for subscription events |

---

## Status Codes

### Success Codes

| Code | Description |
|------|-------------|
| `S1000` | Request processed successfully |

### Error Codes (Non Retry-able)

| Code | Description |
|------|-------------|
| `E1303` | IP address not provisioned |
| `E1308` | Permanent charging error (e.g., Insufficient Balance) |
| `E1309` | SMS service not allowed for this application |
| `E1311` | MT SMS not enabled |
| `E1312` | Invalid request |
| `E1313` | Authentication failed |
| `E1315` | SMS service not found or inactive |
| `E1317` | Invalid MSISDN |
| `E1325` | Invalid address format (expected: `tel:8801812345678`) |
| `E1328` | Charging operation not allowed |
| `E1331` | Source address not allowed |
| `E1334` | Message too long |
| `E1335` | Advertisement message too long |
| `E1337` | Duplicate request |
| `E1341` | Request failed for all destinations |
| `E1342` | MSISDN blacklisted |
| `E1343` | MSISDN not whitelisted |
| `E1601` | Unexpected system error |

### Error Codes (Retry-able)

| Code | Description |
|------|-------------|
| `E1318` | Transaction limit per second exceeded |
| `E1319` | Daily transaction limit exceeded |
| `E1326` | Insufficient balance |
| `E1602` | Message delivery failed |
| `E1603` | Temporary system error |
| `E1850` | Invalid OTP |
| `E1851` | OTP request expired |
| `E1852` | Maximum OTP attempts reached |

---

## License

This project is a conversion of BDApps PHP SDK. Original SDK © hSenid Mobile Solutions. See `api/bdapps_docs.txt` for full API documentation.
