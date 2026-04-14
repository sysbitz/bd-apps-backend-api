"""
WebApi module - Subscription activation via web API.
Equivalent to PHP WebApi class in sdk_file.php.
"""

import hashlib
import os
import random
from datetime import datetime
from typing import Optional

from .core import Core


class WebApi(Core):
    """
    Subscription activation via web API.
    Equivalent to PHP WebApi class.
    """

    def __init__(
        self,
        application_id: Optional[str] = None,
        service_provider_app_id: str = "DSAPP_000003",
        hash_secret: str = "8c899b6b56e6855605ea61be994012e7",
    ):
        super().__init__()
        self.url = "https://developer.bdapps.com/subscription/activate"
        self.request_id = str(random.randint(100000000000000000, 999999999999999999))
        self.request_time = self._get_time()
        self.service_provider_app_id = service_provider_app_id
        self.hash_secret = hash_secret
        self.application_id = application_id
        self.subscriber_id: Optional[str] = None
        self.request_signature: Optional[str] = None

    def _get_time(self) -> str:
        """Get current time in Asia/Dhaka timezone format."""
        # Format: YYYY-MM-DD HH:MM:SS.000
        now = datetime.now()
        return now.strftime("%Y-%m-%d %H:%M:%S.000")

    def get_app_and_subscriber(self, address: str) -> None:
        """
        Set the subscriber and compute the request signature.

        Args:
            address: Subscriber address.
        """
        self.subscriber_id = address

        # Try to read applicationId from appid.txt if not set
        if not self.application_id:
            try:
                app_id_file = os.path.abspath("appid.txt")
                with open(app_id_file, "r") as f:
                    self.application_id = f.readline().strip()
            except FileNotFoundError:
                pass  # applicationId must be set via constructor or env

        # Generate SHA256 signature
        sig_input = f"{self.application_id}{self.request_time}{self.hash_secret}"
        self.request_signature = hashlib.sha256(sig_input.encode()).hexdigest()

    async def request_send(self) -> dict:
        """
        Send the subscription activation request.

        Returns:
            Response from BDApps.
        """
        payload = {
            "requestId": self.request_id,
            "requestTime": self.request_time,
            "serviceProviderAppId": self.service_provider_app_id,
            "requestSignature": self.request_signature,
            "applicationId": self.application_id,
            "subscriberId": self.subscriber_id,
        }

        return await self.send_request(payload, self.url)
