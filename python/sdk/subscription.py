"""
Subscription module - Subscription management.
Equivalent to PHP Subscription class in sdk_file.php.
"""

import httpx

from .exceptions import BDAppsException


class SubscriptionException(BDAppsException):
    """Exception for Subscription service errors."""
    pass


class Subscription:
    """
    Manage subscriptions: get status, subscribe, unsubscribe.
    Equivalent to PHP Subscription class.
    """

    def __init__(self, server: str, password: str, application_id: str):
        self.server = server
        self.password = password
        self.application_id = application_id

    async def get_status(self, address: str) -> str:
        """
        Get subscription status for a subscriber.

        Args:
            address: Subscriber address (tel:880...).

        Returns:
            Subscription status string.
        """
        url = "https://developer.bdapps.com/subscription/getstatus"
        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            "subscriberId": address,
        }

        response = await self._send_request(payload, url)
        return response.get("subscriptionStatus", "UNKNOWN")

    async def subscribe(self, address: str) -> str:
        """
        Subscribe a user.

        Args:
            address: Subscriber address (tel:880...).

        Returns:
            Subscription status string.
        """
        url = "https://developer.bdapps.com/subscription/send"
        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            "subscriberId": address,
            "version": "1.0",
            "action": "1",
        }

        response = await self._send_request(payload, url)
        return response.get("subscriptionStatus", "UNKNOWN")

    async def unsubscribe(self, address: str) -> str:
        """
        Unsubscribe a user.

        Args:
            address: Subscriber address (tel:880...).

        Returns:
            Subscription status string.
        """
        url = "https://developer.bdapps.com/subscription/send"
        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            "subscriberId": address,
            "version": "1.0",
            "action": "0",
        }

        response = await self._send_request(payload, url)
        return response.get("subscriptionStatus", "UNKNOWN")

    async def _send_request(self, payload: dict, url: str) -> dict:
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                return self._handle_response(response.json())
        except httpx.HTTPStatusError as e:
            if e.response is not None:
                return self._handle_response(e.response.json())
            raise

    def _handle_response(self, resp: dict) -> dict:
        if not resp:
            raise SubscriptionException("Server URL is invalid", "500")
        return resp
