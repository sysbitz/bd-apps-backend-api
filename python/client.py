"""
BDApps API Client - Interactive CLI Test Program
Tests all API endpoints through the FastAPI backend.
"""

import asyncio
import json
import os
import sys

from dotenv import load_dotenv

load_dotenv()

try:
    import httpx
except ImportError:
    print("Please install httpx: pip install httpx")
    sys.exit(1)

SERVER_URL = f"http://localhost:{os.getenv('PORT', '8000')}"


async def make_request(method: str, path: str, data: dict = None):
    """Make an HTTP request to the server."""
    url = f"{SERVER_URL}{path}"
    print(f"\n  → {method.upper()} {url}")
    if data:
        print(f"  → Payload: {json.dumps(data, indent=2)}")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "get":
                response = await client.get(url)
            else:
                response = await client.post(
                    url, json=data, headers={"Content-Type": "application/json"}
                )

            print(f"\n  ✅ Response ({response.status_code}):")
            print(f"  {json.dumps(response.json(), indent=2)}")
            return response.json()
    except httpx.ConnectError:
        print(f"\n  ❌ Connection Error: Cannot connect to {url}")
        print(f"  Make sure the server is running: python server.py")
        return None
    except Exception as e:
        print(f"\n  ❌ Error: {e}")
        return None


# ─── Test Functions ──────────────────────────────────────────────────

async def test_health_check():
    print("\n━━━ Health Check ━━━")
    await make_request("get", "/api/v1/health")


async def test_sms_send():
    print("\n━━━ SMS Send ━━━")
    address = input("  Enter destination address (e.g., tel:8801812345678): ")
    message = input("  Enter message: ")
    await make_request("post", "/api/v1/sms/send", {
        "message": message,
        "destinationAddresses": [address],
    })


async def test_sms_broadcast():
    print("\n━━━ SMS Broadcast ━━━")
    message = input("  Enter broadcast message: ")
    await make_request("post", "/api/v1/sms/broadcast", {"message": message})


async def test_sms_receive():
    print("\n━━━ SMS Receive (Simulate Webhook) ━━━")
    await make_request("post", "/api/v1/sms/receive", {
        "message": "Test incoming SMS",
        "requestId": "51307311302350037",
        "applicationId": os.getenv("BDAPPS_APP_ID", "APP_010000"),
        "sourceAddress": "tel:8801812345678",
        "version": "1.0",
        "encoding": "0",
    })


async def test_ussd_send():
    print("\n━━━ USSD Send ━━━")
    address = input("  Enter destination address (e.g., tel:8801812345678): ")
    message = input("  Enter USSD message: ")
    import time
    session_id = str(int(time.time() * 1000))
    await make_request("post", "/api/v1/ussd/send", {
        "sessionId": session_id,
        "message": message,
        "destinationAddress": address,
        "ussdOperation": "mt-cont",
    })


async def test_ussd_receive():
    print("\n━━━ USSD Receive (Simulate Webhook) ━━━")
    await make_request("post", "/api/v1/ussd/receive", {
        "message": "010",
        "ussdOperation": "mo-init",
        "requestId": "071308060343170263",
        "sessionId": "1209992331266121",
        "encoding": "16",
        "applicationId": os.getenv("BDAPPS_APP_ID", "APP_010000"),
        "sourceAddress": "tel:8801812345678",
        "version": "1.0",
    })


async def test_direct_debit():
    print("\n━━━ CAAS Direct Debit ━━━")
    subscriber_id = input("  Enter subscriber ID (e.g., tel:8801812345678): ")
    amount = input("  Enter amount to charge: ")
    import time
    await make_request("post", "/api/v1/caas/direct-debit", {
        "externalTrxId": str(int(time.time() * 1000)),
        "subscriberId": subscriber_id,
        "amount": amount,
    })


async def test_balance_query():
    print("\n━━━ CAAS Balance Query ━━━")
    subscriber_id = input("  Enter subscriber ID (e.g., tel:8801812345678): ")
    await make_request("post", "/api/v1/caas/balance-query", {
        "subscriberId": subscriber_id,
        "paymentInstrumentName": "Mobile Account",
    })


async def test_payment_instruments():
    print("\n━━━ CAAS Payment Instruments ━━━")
    subscriber_id = input("  Enter subscriber ID (e.g., tel:8801812345678): ")
    await make_request("post", "/api/v1/caas/payment-instruments", {
        "subscriberId": subscriber_id,
        "type": "all",
    })


async def test_subscription_status():
    print("\n━━━ Subscription Status ━━━")
    subscriber_id = input("  Enter subscriber ID (e.g., tel:8801812345678): ")
    await make_request("post", "/api/v1/subscription/status", {"subscriberId": subscriber_id})


async def test_subscribe():
    print("\n━━━ Subscribe ━━━")
    subscriber_id = input("  Enter subscriber ID (e.g., tel:8801812345678): ")
    await make_request("post", "/api/v1/subscription/subscribe", {"subscriberId": subscriber_id})


async def test_unsubscribe():
    print("\n━━━ Unsubscribe ━━━")
    subscriber_id = input("  Enter subscriber ID (e.g., tel:8801812345678): ")
    await make_request("post", "/api/v1/subscription/unsubscribe", {"subscriberId": subscriber_id})


async def test_otp_request():
    print("\n━━━ OTP Request ━━━")
    user_mobile = input("  Enter mobile number (e.g., 01812345678): ")
    await make_request("post", "/api/v1/otp/request", {"userMobile": user_mobile})


async def test_otp_verify():
    print("\n━━━ OTP Verify ━━━")
    reference_no = input("  Enter reference number: ")
    otp = input("  Enter OTP: ")
    await make_request("post", "/api/v1/otp/verify", {"referenceNo": reference_no, "otp": otp})


async def test_subscription_activation():
    print("\n━━━ Subscription Activation (WebApi) ━━━")
    subscriber_id = input("  Enter subscriber ID (e.g., tel:8801812345678): ")
    await make_request("post", "/api/v1/subscription/activate", {"subscriberId": subscriber_id})


async def test_notification():
    print("\n━━━ Notification Webhook (Simulate) ━━━")
    from datetime import datetime
    await make_request("post", "/api/v1/notification", {
        "timeStamp": datetime.now().isoformat(),
        "status": "REGISTERED",
        "applicationId": os.getenv("BDAPPS_APP_ID", "APP_010000"),
        "subscriberId": "tel:8801812345678",
        "frequency": "DAILY",
    })


async def run_all_tests():
    print("\n══════════════════════════════════════════")
    print("  Running ALL API Tests Automatically")
    print("══════════════════════════════════════════")

    await test_health_check()
    await test_sms_receive()
    await test_ussd_receive()
    await test_notification()

    print("\n━━━ SMS Send (Auto) ━━━")
    await make_request("post", "/api/v1/sms/send", {
        "message": "Test SMS from Python client",
        "destinationAddresses": ["tel:8801812345678"],
    })

    print("\n━━━ SMS Broadcast (Auto) ━━━")
    await make_request("post", "/api/v1/sms/broadcast", {
        "message": "Test broadcast from Python client",
    })

    print("\n━━━ USSD Send (Auto) ━━━")
    import time
    await make_request("post", "/api/v1/ussd/send", {
        "sessionId": str(int(time.time() * 1000)),
        "message": "1. Option A\n2. Option B\n3. Exit",
        "destinationAddress": "tel:8801812345678",
        "ussdOperation": "mt-cont",
    })

    print("\n━━━ CAAS Direct Debit (Auto) ━━━")
    await make_request("post", "/api/v1/caas/direct-debit", {
        "externalTrxId": str(int(time.time() * 1000)),
        "subscriberId": "tel:8801812345678",
        "amount": "5",
    })

    print("\n━━━ CAAS Balance Query (Auto) ━━━")
    await make_request("post", "/api/v1/caas/balance-query", {
        "subscriberId": "tel:8801812345678",
        "paymentInstrumentName": "Mobile Account",
    })

    print("\n━━━ CAAS Payment Instruments (Auto) ━━━")
    await make_request("post", "/api/v1/caas/payment-instruments", {
        "subscriberId": "tel:8801812345678",
        "type": "all",
    })

    print("\n━━━ Subscription Status (Auto) ━━━")
    await make_request("post", "/api/v1/subscription/status", {
        "subscriberId": "tel:8801812345678",
    })

    print("\n━━━ Subscribe (Auto) ━━━")
    await make_request("post", "/api/v1/subscription/subscribe", {
        "subscriberId": "tel:8801812345678",
    })

    print("\n━━━ Unsubscribe (Auto) ━━━")
    await make_request("post", "/api/v1/subscription/unsubscribe", {
        "subscriberId": "tel:8801812345678",
    })

    print("\n━━━ OTP Request (Auto) ━━━")
    await make_request("post", "/api/v1/otp/request", {
        "userMobile": "01812345678",
    })

    print("\n━━━ OTP Verify (Auto) ━━━")
    await make_request("post", "/api/v1/otp/verify", {
        "referenceNo": "213561321321613",
        "otp": "123456",
    })

    print("\n━━━ Subscription Activation (Auto) ━━━")
    await make_request("post", "/api/v1/subscription/activate", {
        "subscriberId": "tel:8801812345678",
    })

    print("\n══════════════════════════════════════════")
    print("  All tests completed!")
    print("══════════════════════════════════════════\n")


# ─── Main Menu ───────────────────────────────────────────────────────
async def main():
    print("\n╔══════════════════════════════════════════════════╗")
    print("║       BDApps API Client - Python                  ║")
    print(f"║  Server: {SERVER_URL:<40}║")
    print("╚══════════════════════════════════════════════════╝")

    actions = {
        "0": run_all_tests,
        "1": test_health_check,
        "2": test_sms_send,
        "3": test_sms_broadcast,
        "4": test_sms_receive,
        "5": test_ussd_send,
        "6": test_ussd_receive,
        "7": test_direct_debit,
        "8": test_balance_query,
        "9": test_payment_instruments,
        "10": test_subscription_status,
        "11": test_subscribe,
        "12": test_unsubscribe,
        "13": test_otp_request,
        "14": test_otp_verify,
        "15": test_subscription_activation,
        "16": test_notification,
    }

    while True:
        print("\n┌─────────────────────────────────────────┐")
        print("│           Select an Operation            │")
        print("├─────────────────────────────────────────┤")
        print("│  0.  Run ALL tests automatically         │")
        print("│  1.  Health Check                        │")
        print("│  2.  SMS Send                            │")
        print("│  3.  SMS Broadcast                       │")
        print("│  4.  SMS Receive (Simulate)              │")
        print("│  5.  USSD Send                           │")
        print("│  6.  USSD Receive (Simulate)             │")
        print("│  7.  CAAS Direct Debit                   │")
        print("│  8.  CAAS Balance Query                  │")
        print("│  9.  CAAS Payment Instruments            │")
        print("│  10. Subscription Status                 │")
        print("│  11. Subscribe                           │")
        print("│  12. Unsubscribe                         │")
        print("│  13. OTP Request                         │")
        print("│  14. OTP Verify                          │")
        print("│  15. Subscription Activation             │")
        print("│  16. Notification (Simulate)             │")
        print("│  q.  Quit                                │")
        print("└─────────────────────────────────────────┘")

        choice = input("\n  Enter choice: ").strip()

        if choice.lower() == "q":
            print("\n  Goodbye! 👋\n")
            sys.exit(0)

        if choice in actions:
            await actions[choice]()
        else:
            print("\n  ⚠️  Invalid choice. Please try again.")


if __name__ == "__main__":
    asyncio.run(main())
