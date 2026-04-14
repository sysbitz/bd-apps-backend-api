/**
 * BDApps API Client - Interactive CLI Test Program
 * Tests all API endpoints through the Express.js backend
 */

require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const SERVER_URL = `http://localhost:${process.env.PORT || 3000}`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function makeRequest(method, path, data = null) {
  try {
    const url = `${SERVER_URL}${path}`;
    console.log(`\n  → ${method.toUpperCase()} ${url}`);
    if (data) console.log(`  → Payload: ${JSON.stringify(data, null, 2)}`);

    const response = method === 'get'
      ? await axios.get(url)
      : await axios.post(url, data, { headers: { 'Content-Type': 'application/json' } });

    console.log(`\n  ✅ Response (${response.status}):`);
    console.log(`  ${JSON.stringify(response.data, null, 2)}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.log(`\n  ❌ Error (${error.response.status}):`);
      console.log(`  ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`\n  ❌ Connection Error: ${error.message}`);
      console.log(`  Make sure the server is running: npm start`);
    }
    return null;
  }
}

// ─── Test Functions ─────────────────────────────────────────────────

async function testHealthCheck() {
  console.log('\n━━━ Health Check ━━━');
  await makeRequest('get', '/api/v1/health');
}

async function testSmsSend() {
  console.log('\n━━━ SMS Send ━━━');
  const address = await ask('  Enter destination address (e.g., tel:8801812345678): ');
  const message = await ask('  Enter message: ');
  await makeRequest('post', '/api/v1/sms/send', {
    message,
    destinationAddresses: [address],
  });
}

async function testSmsBroadcast() {
  console.log('\n━━━ SMS Broadcast ━━━');
  const message = await ask('  Enter broadcast message: ');
  await makeRequest('post', '/api/v1/sms/broadcast', { message });
}

async function testSmsReceive() {
  console.log('\n━━━ SMS Receive (Simulate Webhook) ━━━');
  await makeRequest('post', '/api/v1/sms/receive', {
    message: 'Test incoming SMS',
    requestId: '51307311302350037',
    applicationId: process.env.BDAPPS_APP_ID || 'APP_010000',
    sourceAddress: 'tel:8801812345678',
    version: '1.0',
    encoding: '0',
  });
}

async function testUssdSend() {
  console.log('\n━━━ USSD Send ━━━');
  const address = await ask('  Enter destination address (e.g., tel:8801812345678): ');
  const message = await ask('  Enter USSD message: ');
  const sessionId = Date.now().toString();
  await makeRequest('post', '/api/v1/ussd/send', {
    sessionId,
    message,
    destinationAddress: address,
    ussdOperation: 'mt-cont',
  });
}

async function testUssdReceive() {
  console.log('\n━━━ USSD Receive (Simulate Webhook) ━━━');
  await makeRequest('post', '/api/v1/ussd/receive', {
    message: '010',
    ussdOperation: 'mo-init',
    requestId: '071308060343170263',
    sessionId: '1209992331266121',
    encoding: '16',
    applicationId: process.env.BDAPPS_APP_ID || 'APP_010000',
    sourceAddress: 'tel:8801812345678',
    version: '1.0',
  });
}

async function testDirectDebit() {
  console.log('\n━━━ CAAS Direct Debit ━━━');
  const subscriberId = await ask('  Enter subscriber ID (e.g., tel:8801812345678): ');
  const amount = await ask('  Enter amount to charge: ');
  await makeRequest('post', '/api/v1/caas/direct-debit', {
    externalTrxId: String(Date.now()),
    subscriberId,
    amount,
  });
}

async function testBalanceQuery() {
  console.log('\n━━━ CAAS Balance Query ━━━');
  const subscriberId = await ask('  Enter subscriber ID (e.g., tel:8801812345678): ');
  await makeRequest('post', '/api/v1/caas/balance-query', {
    subscriberId,
    paymentInstrumentName: 'Mobile Account',
  });
}

async function testPaymentInstruments() {
  console.log('\n━━━ CAAS Payment Instruments ━━━');
  const subscriberId = await ask('  Enter subscriber ID (e.g., tel:8801812345678): ');
  await makeRequest('post', '/api/v1/caas/payment-instruments', {
    subscriberId,
    type: 'all',
  });
}

async function testSubscriptionStatus() {
  console.log('\n━━━ Subscription Status ━━━');
  const subscriberId = await ask('  Enter subscriber ID (e.g., tel:8801812345678): ');
  await makeRequest('post', '/api/v1/subscription/status', { subscriberId });
}

async function testSubscribe() {
  console.log('\n━━━ Subscribe ━━━');
  const subscriberId = await ask('  Enter subscriber ID (e.g., tel:8801812345678): ');
  await makeRequest('post', '/api/v1/subscription/subscribe', { subscriberId });
}

async function testUnsubscribe() {
  console.log('\n━━━ Unsubscribe ━━━');
  const subscriberId = await ask('  Enter subscriber ID (e.g., tel:8801812345678): ');
  await makeRequest('post', '/api/v1/subscription/unsubscribe', { subscriberId });
}

async function testOtpRequest() {
  console.log('\n━━━ OTP Request ━━━');
  const userMobile = await ask('  Enter mobile number (e.g., 01812345678): ');
  await makeRequest('post', '/api/v1/otp/request', { userMobile });
}

async function testOtpVerify() {
  console.log('\n━━━ OTP Verify ━━━');
  const referenceNo = await ask('  Enter reference number: ');
  const otp = await ask('  Enter OTP: ');
  await makeRequest('post', '/api/v1/otp/verify', { referenceNo, otp });
}

async function testSubscriptionActivation() {
  console.log('\n━━━ Subscription Activation (WebApi) ━━━');
  const subscriberId = await ask('  Enter subscriber ID (e.g., tel:8801812345678): ');
  await makeRequest('post', '/api/v1/subscription/activate', { subscriberId });
}

async function testNotification() {
  console.log('\n━━━ Notification Webhook (Simulate) ━━━');
  await makeRequest('post', '/api/v1/notification', {
    timeStamp: new Date().toISOString(),
    status: 'REGISTERED',
    applicationId: process.env.BDAPPS_APP_ID || 'APP_010000',
    subscriberId: 'tel:8801812345678',
    frequency: 'DAILY',
  });
}

async function runAllTests() {
  console.log('\n══════════════════════════════════════════');
  console.log('  Running ALL API Tests Automatically');
  console.log('══════════════════════════════════════════');

  await testHealthCheck();
  await testSmsReceive();
  await testUssdReceive();
  await testNotification();

  console.log('\n━━━ SMS Send (Auto) ━━━');
  await makeRequest('post', '/api/v1/sms/send', {
    message: 'Test SMS from client',
    destinationAddresses: ['tel:8801812345678'],
  });

  console.log('\n━━━ SMS Broadcast (Auto) ━━━');
  await makeRequest('post', '/api/v1/sms/broadcast', {
    message: 'Test broadcast from client',
  });

  console.log('\n━━━ USSD Send (Auto) ━━━');
  await makeRequest('post', '/api/v1/ussd/send', {
    sessionId: Date.now().toString(),
    message: '1. Option A\n2. Option B\n3. Exit',
    destinationAddress: 'tel:8801812345678',
    ussdOperation: 'mt-cont',
  });

  console.log('\n━━━ CAAS Direct Debit (Auto) ━━━');
  await makeRequest('post', '/api/v1/caas/direct-debit', {
    externalTrxId: String(Date.now()),
    subscriberId: 'tel:8801812345678',
    amount: '5',
  });

  console.log('\n━━━ CAAS Balance Query (Auto) ━━━');
  await makeRequest('post', '/api/v1/caas/balance-query', {
    subscriberId: 'tel:8801812345678',
    paymentInstrumentName: 'Mobile Account',
  });

  console.log('\n━━━ CAAS Payment Instruments (Auto) ━━━');
  await makeRequest('post', '/api/v1/caas/payment-instruments', {
    subscriberId: 'tel:8801812345678',
    type: 'all',
  });

  console.log('\n━━━ Subscription Status (Auto) ━━━');
  await makeRequest('post', '/api/v1/subscription/status', {
    subscriberId: 'tel:8801812345678',
  });

  console.log('\n━━━ Subscribe (Auto) ━━━');
  await makeRequest('post', '/api/v1/subscription/subscribe', {
    subscriberId: 'tel:8801812345678',
  });

  console.log('\n━━━ Unsubscribe (Auto) ━━━');
  await makeRequest('post', '/api/v1/subscription/unsubscribe', {
    subscriberId: 'tel:8801812345678',
  });

  console.log('\n━━━ OTP Request (Auto) ━━━');
  await makeRequest('post', '/api/v1/otp/request', {
    userMobile: '01812345678',
  });

  console.log('\n━━━ OTP Verify (Auto) ━━━');
  await makeRequest('post', '/api/v1/otp/verify', {
    referenceNo: '213561321321613',
    otp: '123456',
  });

  console.log('\n━━━ Subscription Activation (Auto) ━━━');
  await makeRequest('post', '/api/v1/subscription/activate', {
    subscriberId: 'tel:8801812345678',
  });

  console.log('\n══════════════════════════════════════════');
  console.log('  All tests completed!');
  console.log('══════════════════════════════════════════\n');
}

// ─── Main Menu ──────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║      BDApps API Client - JavaScript               ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Server: ' + SERVER_URL.padEnd(40) + '║');
  console.log('╚══════════════════════════════════════════════════╝');

  while (true) {
    console.log('\n┌─────────────────────────────────────────┐');
    console.log('│           Select an Operation            │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│  0.  Run ALL tests automatically         │');
    console.log('│  1.  Health Check                        │');
    console.log('│  2.  SMS Send                            │');
    console.log('│  3.  SMS Broadcast                       │');
    console.log('│  4.  SMS Receive (Simulate)              │');
    console.log('│  5.  USSD Send                           │');
    console.log('│  6.  USSD Receive (Simulate)             │');
    console.log('│  7.  CAAS Direct Debit                   │');
    console.log('│  8.  CAAS Balance Query                  │');
    console.log('│  9.  CAAS Payment Instruments            │');
    console.log('│  10. Subscription Status                 │');
    console.log('│  11. Subscribe                           │');
    console.log('│  12. Unsubscribe                         │');
    console.log('│  13. OTP Request                         │');
    console.log('│  14. OTP Verify                          │');
    console.log('│  15. Subscription Activation             │');
    console.log('│  16. Notification (Simulate)             │');
    console.log('│  q.  Quit                                │');
    console.log('└─────────────────────────────────────────┘');

    const choice = await ask('\n  Enter choice: ');

    const actions = {
      '0': runAllTests,
      '1': testHealthCheck,
      '2': testSmsSend,
      '3': testSmsBroadcast,
      '4': testSmsReceive,
      '5': testUssdSend,
      '6': testUssdReceive,
      '7': testDirectDebit,
      '8': testBalanceQuery,
      '9': testPaymentInstruments,
      '10': testSubscriptionStatus,
      '11': testSubscribe,
      '12': testUnsubscribe,
      '13': testOtpRequest,
      '14': testOtpVerify,
      '15': testSubscriptionActivation,
      '16': testNotification,
    };

    if (choice.toLowerCase() === 'q') {
      console.log('\n  Goodbye! 👋\n');
      rl.close();
      process.exit(0);
    }

    if (actions[choice]) {
      await actions[choice]();
    } else {
      console.log('\n  ⚠️  Invalid choice. Please try again.');
    }
  }
}

main().catch(console.error);
