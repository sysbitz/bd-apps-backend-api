"""
BDApps REST API Server - FastAPI
Serves all BDApps SDK operations via REST endpoints.
"""

import os
from datetime import datetime
from typing import Optional, List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sdk import (
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
)

load_dotenv()

# ─── Configuration ───────────────────────────────────────────────────
BASE_URL = os.getenv("BDAPPS_BASE_URL", "https://developer.bdapps.com")
APP_ID = os.getenv("BDAPPS_APP_ID", "")
PASSWORD = os.getenv("BDAPPS_PASSWORD", "")
SP_APP_ID = os.getenv("BDAPPS_SERVICE_PROVIDER_APP_ID", "DSAPP_000003")
HASH_SECRET = os.getenv("BDAPPS_HASH_SECRET", "")

logger = Logger()

# ─── FastAPI App ─────────────────────────────────────────────────────
app = FastAPI(
    title="BDApps API Gateway",
    description="REST API gateway for BDApps SMS, USSD, CAAS, OTP, and Subscription services",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request Models ─────────────────────────────────────────────────
class SMSSendRequest(BaseModel):
    message: str
    destinationAddresses: List[str]
    sourceAddress: Optional[str] = None
    encoding: Optional[str] = None
    version: Optional[str] = None
    deliveryStatusRequest: Optional[str] = None
    binaryHeader: Optional[str] = None
    chargingAmount: Optional[str] = None


class SMSBroadcastRequest(BaseModel):
    message: str


class SMSReceiveRequest(BaseModel):
    message: str
    requestId: Optional[str] = None
    applicationId: Optional[str] = None
    sourceAddress: Optional[str] = None
    version: Optional[str] = None
    encoding: Optional[str] = None


class USSDSendRequest(BaseModel):
    sessionId: str
    message: str
    destinationAddress: str
    ussdOperation: Optional[str] = "mo-cont"


class USSDReceiveRequest(BaseModel):
    message: str
    ussdOperation: Optional[str] = None
    requestId: Optional[str] = None
    sessionId: Optional[str] = None
    encoding: Optional[str] = None
    applicationId: Optional[str] = None
    sourceAddress: Optional[str] = None
    version: Optional[str] = None


class DirectDebitRequest(BaseModel):
    externalTrxId: str
    subscriberId: str
    amount: str


class BalanceQueryRequest(BaseModel):
    subscriberId: str
    paymentInstrumentName: Optional[str] = "Mobile Account"


class PaymentInstrumentsRequest(BaseModel):
    subscriberId: str
    type: Optional[str] = "all"


class SubscriberRequest(BaseModel):
    subscriberId: str


class OTPRequestModel(BaseModel):
    userMobile: str
    applicationHash: Optional[str] = None
    client: Optional[str] = None
    device: Optional[str] = None
    os: Optional[str] = None
    appCode: Optional[str] = None


class OTPVerifyRequest(BaseModel):
    referenceNo: str
    otp: str


class NotificationRequest(BaseModel):
    timeStamp: Optional[str] = None
    status: Optional[str] = None
    applicationId: Optional[str] = None
    subscriberId: Optional[str] = None
    frequency: Optional[str] = None


# ─── Health Check ────────────────────────────────────────────────────
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "service": "BDApps API Gateway (FastAPI)",
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "POST /api/v1/sms/send",
            "POST /api/v1/sms/broadcast",
            "POST /api/v1/sms/receive",
            "POST /api/v1/ussd/send",
            "POST /api/v1/ussd/receive",
            "POST /api/v1/caas/direct-debit",
            "POST /api/v1/caas/balance-query",
            "POST /api/v1/caas/payment-instruments",
            "POST /api/v1/subscription/status",
            "POST /api/v1/subscription/subscribe",
            "POST /api/v1/subscription/unsubscribe",
            "POST /api/v1/otp/request",
            "POST /api/v1/otp/verify",
            "POST /api/v1/subscription/activate",
            "POST /api/v1/notification",
        ],
    }


# ─── SMS: Send ───────────────────────────────────────────────────────
@app.post("/api/v1/sms/send")
async def sms_send(req: SMSSendRequest):
    try:
        sender = SMSSender(f"{BASE_URL}/sms/send", APP_ID, PASSWORD)
        if req.sourceAddress:
            sender.set_source_address(req.sourceAddress)
        if req.encoding:
            sender.set_encoding(req.encoding)
        if req.version:
            sender.set_version(req.version)
        if req.deliveryStatusRequest:
            sender.set_delivery_status_request(req.deliveryStatusRequest)
        if req.binaryHeader:
            sender.set_binary_header(req.binaryHeader)
        if req.chargingAmount:
            sender.set_charging_amount(req.chargingAmount)

        result = await sender.sms(req.message, req.destinationAddresses)
        logger.write_log(f"SMS sent to {req.destinationAddresses}")
        return {"statusCode": "S1000", "statusDetail": "SMS sent successfully", "result": result}
    except Exception as e:
        logger.write_log(f"SMS send error: {e}")
        return {"statusCode": getattr(e, "status_code", "E1601"), "statusDetail": str(e)}


# ─── SMS: Broadcast ──────────────────────────────────────────────────
@app.post("/api/v1/sms/broadcast")
async def sms_broadcast(req: SMSBroadcastRequest):
    try:
        sender = SMSSender(f"{BASE_URL}/sms/send", APP_ID, PASSWORD)
        result = await sender.broadcast(req.message)
        logger.write_log("SMS broadcast sent")
        return {"statusCode": "S1000", "statusDetail": "Broadcast sent successfully", "result": result}
    except Exception as e:
        logger.write_log(f"SMS broadcast error: {e}")
        return {"statusCode": getattr(e, "status_code", "E1601"), "statusDetail": str(e)}


# ─── SMS: Receive (Webhook) ─────────────────────────────────────────
@app.post("/api/v1/sms/receive")
async def sms_receive(req: SMSReceiveRequest):
    try:
        receiver = SMSReceiver(req.model_dump())
        data = {
            "version": receiver.get_version(),
            "applicationId": receiver.get_application_id(),
            "sourceAddress": receiver.get_address(),
            "message": receiver.get_message(),
            "requestId": receiver.get_request_id(),
            "encoding": receiver.get_encoding(),
        }
        logger.write_log(f"SMS received from {data['sourceAddress']}: {data['message']}")
        return receiver.get_response()
    except Exception as e:
        logger.write_log(f"SMS receive error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── USSD: Send ──────────────────────────────────────────────────────
@app.post("/api/v1/ussd/send")
async def ussd_send(req: USSDSendRequest):
    try:
        sender = UssdSender(f"{BASE_URL}/ussd/send", APP_ID, PASSWORD)
        result = await sender.ussd(
            req.sessionId, req.message, req.destinationAddress, req.ussdOperation or "mo-cont"
        )
        logger.write_log(f"USSD sent to {req.destinationAddress}")
        return {"statusCode": "S1000", "statusDetail": "USSD sent successfully", "result": result}
    except Exception as e:
        logger.write_log(f"USSD send error: {e}")
        return {"statusCode": getattr(e, "status_code", "E1601"), "statusDetail": str(e)}


# ─── USSD: Receive (Webhook) ────────────────────────────────────────
@app.post("/api/v1/ussd/receive")
async def ussd_receive(req: USSDReceiveRequest):
    try:
        receiver = UssdReceiver(req.model_dump())
        data = {
            "sourceAddress": receiver.get_address(),
            "message": receiver.get_message(),
            "requestId": receiver.get_request_id(),
            "applicationId": receiver.get_application_id(),
            "encoding": receiver.get_encoding(),
            "version": receiver.get_version(),
            "sessionId": receiver.get_session_id(),
            "ussdOperation": receiver.get_ussd_operation(),
        }
        logger.write_log(f"USSD received from {data['sourceAddress']}: {data['message']}")
        return receiver.get_response()
    except Exception as e:
        logger.write_log(f"USSD receive error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── CAAS: Direct Debit ─────────────────────────────────────────────
@app.post("/api/v1/caas/direct-debit")
async def caas_direct_debit(req: DirectDebitRequest):
    try:
        debit_sender = DirectDebitSender(f"{BASE_URL}/caas/direct/debit", APP_ID, PASSWORD)
        status = await debit_sender.cass(req.externalTrxId, req.subscriberId, req.amount)
        logger.write_log(f"Direct debit charged: {req.subscriberId} amount {req.amount}")
        return {"statusCode": status, "statusDetail": "Direct debit processed successfully"}
    except Exception as e:
        logger.write_log(f"Direct debit error: {e}")
        return {"statusCode": getattr(e, "status_code", "E1601"), "statusDetail": str(e)}


# ─── CAAS: Balance Query ────────────────────────────────────────────
@app.post("/api/v1/caas/balance-query")
async def caas_balance_query(req: BalanceQueryRequest):
    try:
        balance_query = BalanceQuery(APP_ID, PASSWORD)
        result = await balance_query.query_balance(
            req.subscriberId, req.paymentInstrumentName or "Mobile Account"
        )
        logger.write_log(f"Balance queried for {req.subscriberId}")
        return result
    except Exception as e:
        logger.write_log(f"Balance query error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── CAAS: Payment Instruments ──────────────────────────────────────
@app.post("/api/v1/caas/payment-instruments")
async def caas_payment_instruments(req: PaymentInstrumentsRequest):
    try:
        pi_list = PaymentInstrumentList(APP_ID, PASSWORD)
        result = await pi_list.get_list(req.subscriberId, req.type or "all")
        logger.write_log(f"Payment instruments queried for {req.subscriberId}")
        return result
    except Exception as e:
        logger.write_log(f"Payment instruments error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── Subscription: Get Status ───────────────────────────────────────
@app.post("/api/v1/subscription/status")
async def subscription_status(req: SubscriberRequest):
    try:
        subscription = Subscription(f"{BASE_URL}/subscription/send", PASSWORD, APP_ID)
        status = await subscription.get_status(req.subscriberId)
        logger.write_log(f"Subscription status for {req.subscriberId}: {status}")
        return {"statusCode": "S1000", "subscriptionStatus": status}
    except Exception as e:
        logger.write_log(f"Subscription status error: {e}")
        return {"statusCode": getattr(e, "status_code", "E1601"), "statusDetail": str(e)}


# ─── Subscription: Subscribe ────────────────────────────────────────
@app.post("/api/v1/subscription/subscribe")
async def subscription_subscribe(req: SubscriberRequest):
    try:
        subscription = Subscription(f"{BASE_URL}/subscription/send", PASSWORD, APP_ID)
        status = await subscription.subscribe(req.subscriberId)
        logger.write_log(f"Subscribed: {req.subscriberId}")
        return {"statusCode": "S1000", "subscriptionStatus": status}
    except Exception as e:
        logger.write_log(f"Subscribe error: {e}")
        return {"statusCode": getattr(e, "status_code", "E1601"), "statusDetail": str(e)}


# ─── Subscription: Unsubscribe ──────────────────────────────────────
@app.post("/api/v1/subscription/unsubscribe")
async def subscription_unsubscribe(req: SubscriberRequest):
    try:
        subscription = Subscription(f"{BASE_URL}/subscription/send", PASSWORD, APP_ID)
        status = await subscription.unsubscribe(req.subscriberId)
        logger.write_log(f"Unsubscribed: {req.subscriberId}")
        return {"statusCode": "S1000", "subscriptionStatus": status}
    except Exception as e:
        logger.write_log(f"Unsubscribe error: {e}")
        return {"statusCode": getattr(e, "status_code", "E1601"), "statusDetail": str(e)}


# ─── OTP: Request ───────────────────────────────────────────────────
@app.post("/api/v1/otp/request")
async def otp_request(req: OTPRequestModel):
    try:
        otp_service = OTPService(APP_ID, PASSWORD, BASE_URL)
        meta_data = {
            "applicationHash": req.applicationHash,
            "client": req.client,
            "device": req.device,
            "os": req.os,
            "appCode": req.appCode,
        }
        result = await otp_service.send_otp(req.userMobile, meta_data)
        logger.write_log(f"OTP requested for {req.userMobile}")
        return result
    except Exception as e:
        logger.write_log(f"OTP request error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── OTP: Verify ────────────────────────────────────────────────────
@app.post("/api/v1/otp/verify")
async def otp_verify(req: OTPVerifyRequest):
    try:
        otp_service = OTPService(APP_ID, PASSWORD, BASE_URL)
        result = await otp_service.verify_otp(req.referenceNo, req.otp)
        logger.write_log(f"OTP verified: ref {req.referenceNo}")
        return result
    except Exception as e:
        logger.write_log(f"OTP verify error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── Subscription Activation (WebApi) ───────────────────────────────
@app.post("/api/v1/subscription/activate")
async def subscription_activate(req: SubscriberRequest):
    try:
        web_api = WebApi(APP_ID, SP_APP_ID, HASH_SECRET)
        web_api.get_app_and_subscriber(req.subscriberId)
        result = await web_api.request_send()
        logger.write_log(f"Subscription activation sent for: {req.subscriberId}")
        return result
    except Exception as e:
        logger.write_log(f"Subscription activation error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── Notification Webhook ───────────────────────────────────────────
@app.post("/api/v1/notification")
async def notification(req: NotificationRequest):
    try:
        log_entry = (
            f"TimeStamp:{req.timeStamp} |Status:{req.status} "
            f"|App Id:{req.applicationId} |SubscriberId:{req.subscriberId} "
            f"|Frequency:{req.frequency}"
        )
        logger.write_log(f"Subscription Notification: {log_entry}")
        print(f"[Notification] {log_entry}")
        return {"statusCode": "S1000", "statusDetail": "Notification received successfully"}
    except Exception as e:
        logger.write_log(f"Notification error: {e}")
        return {"statusCode": "E1601", "statusDetail": str(e)}


# ─── Run Server ─────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    print(f"\n╔══════════════════════════════════════════════════╗")
    print(f"║       BDApps API Gateway - FastAPI               ║")
    print(f"╠══════════════════════════════════════════════════╣")
    print(f"║  Server running on: http://localhost:{port}        ║")
    print(f"║  Docs:              http://localhost:{port}/docs   ║")
    print(f"║  App ID:            {APP_ID:<28}║")
    print(f"╚══════════════════════════════════════════════════╝\n")

    uvicorn.run(app, host="0.0.0.0", port=port)
