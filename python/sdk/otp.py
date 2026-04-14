"""
OTP module - OTP request and verification.
Equivalent to PHP send_otp.php and verify_otp.php.
"""

from typing import Optional

import httpx


class OTPService:
    """OTP request and verification service."""

    def __init__(
        self,
        application_id: str,
        password: str,
        base_url: str = "https://developer.bdapps.com",
    ):
        self.application_id = application_id
        self.password = password
        self.base_url = base_url

    async def send_otp(
        self, user_mobile: str, meta_data: Optional[dict] = None
    ) -> dict:
        """
        Request OTP for a mobile number.

        Args:
            user_mobile: Mobile number (without country code prefix, e.g., '01847026XX').
            meta_data: Optional application metadata dict.

        Returns:
            Response dict with referenceNo on success.
        """
        # Format mobile number with tel:88 prefix
        subscriber_id = (
            user_mobile
            if user_mobile.startswith("tel:")
            else f"tel:88{user_mobile}"
        )

        meta = meta_data or {}
        request_data = {
            "applicationId": self.application_id,
            "password": self.password,
            "subscriberId": subscriber_id,
            "applicationHash": meta.get("applicationHash", "App Name"),
            "applicationMetaData": {
                "client": meta.get("client", "MOBILEAPP"),
                "device": meta.get("device", "Samsung S10"),
                "os": meta.get("os", "android 8"),
                "appCode": meta.get(
                    "appCode",
                    "https://play.google.com/store/apps/details?id=lk.dialog.megarunlor",
                ),
            },
        }

        url = f"{self.base_url}/subscription/otp/request"

        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=request_data,
                    headers={"Content-Type": "application/json"},
                )
                return response.json()
        except Exception as e:
            return {"statusCode": "E1601", "statusDetail": str(e)}

    async def verify_otp(self, reference_no: str, otp: str) -> dict:
        """
        Verify OTP.

        Args:
            reference_no: Reference number from send_otp response.
            otp: One-time password to verify.

        Returns:
            Response dict with subscriptionStatus on success.
        """
        request_data = {
            "applicationId": self.application_id,
            "password": self.password,
            "referenceNo": reference_no,
            "otp": otp,
        }

        url = f"{self.base_url}/subscription/otp/verify"

        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=request_data,
                    headers={"Content-Type": "application/json"},
                )
                return response.json()
        except Exception as e:
            return {"statusCode": "E1601", "statusDetail": str(e)}
