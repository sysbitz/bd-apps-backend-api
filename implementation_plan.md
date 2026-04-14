# BDApps PHP → JavaScript & Python Conversion

Convert the BDApps PHP SDK and example scripts into JavaScript and Python with REST API backends and client test programs.

## Source PHP Files Analysis

| PHP File | Purpose | Key Classes/Functions |
|---|---|---|
| `sdk_file.php` | Core SDK — SMS, USSD, CAAS, Subscription, WebApi classes | `Core`, `SMSReceiver`, `SMSSender`, `UssdReceiver`, `UssdSender`, `DirectDebitSender`, `Subscription`, `WebApi`, `Logger` |
| `sms.php` | SMS receive/send example | Uses `SMSReceiver`, `SMSSender` |
| `ussd.php` | USSD session handler | Uses `UssdReceiver`, `UssdSender`, `Subscription` |
| `caas.php` | Direct debit charging example | Uses `DirectDebitSender`, `SmsSender` |
| `send_otp.php` | OTP request via curl | Direct curl call to `/subscription/otp/request` |
| `verify_otp.php` | OTP verification via curl | Direct curl call to `/subscription/otp/verify` |
| `subscription_notification.php` | Subscription notification webhook | Reads incoming JSON body, logs it |

## Environment Variables (`.env`)

Extracted from PHP hardcoded values and API docs:

```env
BDAPPS_BASE_URL=https://developer.bdapps.com
BDAPPS_APP_ID=APP_010000
BDAPPS_PASSWORD=569f9edcb7f5753d47ceb13722065566
BDAPPS_SERVICE_PROVIDER_APP_ID=DSAPP_000003
BDAPPS_HASH_SECRET=8c899b6b56e6855605ea61be994012e7
BDAPPS_APP_HASH=App Name
```

> **Note:** The PHP code stores credentials as plain variables (e.g., `$appid = "APP_010000"`). We've centralized these into `.env` files for both JS and Python.

---

## Proposed Changes

### Project Structure

```
Demo Pro App/
├── api/                          # (existing docs, untouched)
├── javascript/
│   ├── .env
│   ├── package.json
│   ├── sdk/
│   │   ├── core.js               # Core HTTP request helper
│   │   ├── sms.js                # SMSSender, SMSReceiver classes
│   │   ├── ussd.js               # UssdSender, UssdReceiver classes
│   │   ├── caas.js               # DirectDebitSender class
│   │   ├── subscription.js       # Subscription class
│   │   ├── otp.js                # OTP request/verify functions
│   │   ├── webapi.js             # WebApi subscription activation class
│   │   ├── logger.js             # Logger utility
│   │   └── index.js              # Re-exports all SDK modules
│   ├── server.js                 # Express.js REST API backend
│   └── client.js                 # Client test program
├── python/
│   ├── .env
│   ├── requirements.txt
│   ├── sdk/
│   │   ├── __init__.py
│   │   ├── core.py               # Core HTTP request helper
│   │   ├── sms.py                # SMSSender, SMSReceiver classes
│   │   ├── ussd.py               # UssdSender, UssdReceiver classes
│   │   ├── caas.py               # DirectDebitSender class
│   │   ├── subscription.py       # Subscription class
│   │   ├── otp.py                # OTP request/verify functions
│   │   ├── webapi.py             # WebApi subscription activation class
│   │   ├── logger.py             # Logger utility
│   │   └── exceptions.py         # Custom exception classes
│   ├── server.py                 # FastAPI REST API backend
│   └── client.py                 # Client test program
└── php/                          # Original PHP files
```

---

### JavaScript Implementation

#### `.env`
Environment variables for BDApps credentials.

#### `package.json`
Dependencies: `express`, `axios`, `dotenv`, `cors`

#### SDK modules (`sdk/`)
- **core.js** — `sendRequest(jsonData, url)` using `axios.post`
- **sms.js** — `SMSReceiver` (parses incoming JSON), `SMSSender` (send/broadcast SMS)
- **ussd.js** — `UssdReceiver` (parses incoming USSD JSON), `UssdSender` (send USSD)
- **caas.js** — `DirectDebitSender` (direct debit charge)
- **subscription.js** — `Subscription` (getStatus, subscribe, unSubscribe)
- **otp.js** — `sendOtp(mobile)`, `verifyOtp(referenceNo, otp)` functions
- **webapi.js** — `WebApi` class for subscription activation
- **logger.js** — File logger using `fs`
- **index.js** — Re-exports all modules

#### `server.js`
Express.js REST API with these endpoints:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/sms/send` | Send SMS to one or more addresses |
| POST | `/api/v1/sms/broadcast` | Broadcast SMS to all subscribers |
| POST | `/api/v1/ussd/send` | Send USSD message |
| POST | `/api/v1/caas/direct-debit` | Charge subscriber via direct debit |
| POST | `/api/v1/caas/balance-query` | Query subscriber balance |
| POST | `/api/v1/caas/payment-instruments` | Get payment instrument list |
| POST | `/api/v1/subscription/status` | Get subscription status |
| POST | `/api/v1/subscription/subscribe` | Subscribe a user |
| POST | `/api/v1/subscription/unsubscribe` | Unsubscribe a user |
| POST | `/api/v1/otp/request` | Request OTP |
| POST | `/api/v1/otp/verify` | Verify OTP |
| POST | `/api/v1/notification` | Receive subscription notification (webhook) |
| GET  | `/api/v1/health` | Health check |

#### `client.js`
Interactive CLI client that tests every API endpoint through the Express backend, with a menu to select which operation to test.

---

### Python Implementation

#### `.env`
Same environment variables as JavaScript.

#### `requirements.txt`
Dependencies: `fastapi`, `uvicorn`, `httpx`, `python-dotenv`, `pydantic`

#### SDK modules (`sdk/`)
- Mirrors the JavaScript SDK structure using Python classes
- Uses `httpx` for HTTP requests
- Custom exceptions in `exceptions.py`

#### `server.py`
FastAPI REST API with the same endpoint structure as the Express.js server.

#### `client.py`
Interactive CLI client that tests every API endpoint through the FastAPI backend.

---

## Verification Plan

### Automated Tests
- Run `node client.js` to verify all JS endpoints
- Run `python client.py` to verify all Python endpoints
- Start both servers and ensure no import or syntax errors

### Manual Verification
- User to verify with real BDApps credentials
