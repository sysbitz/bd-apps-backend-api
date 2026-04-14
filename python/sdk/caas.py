"""
CAAS module - Direct Debit / Balance Query / Payment Instruments.
Equivalent to PHP DirectDebitSender class in sdk_file.php.
"""

from typing import Optional, Union

from .core import Core
from .exceptions import BDAppsException


class CassException(BDAppsException):
    """Exception for CAAS service errors."""
    pass


class DirectDebitSender(Core):
    """
    Charge a subscriber via direct debit.
    Equivalent to PHP DirectDebitSender class.
    """

    def __init__(self, server_url: str, application_id: str, password: str):
        super().__init__()
        self.server_url = server_url
        self.application_id = application_id
        self.password = password

    async def cass(
        self, external_trx_id: str, subscriber_id: str, amount: Union[str, int, float]
    ) -> str:
        """
        Charge a subscriber via direct debit.

        Args:
            external_trx_id: External transaction ID.
            subscriber_id: Subscriber phone number (tel:880...).
            amount: Amount to charge.

        Returns:
            Status code 'S1000' on success.
        """
        if not subscriber_id:
            raise ValueError("Address should be a string or an array of strings")

        return await self._cass_many(external_trx_id, subscriber_id, amount)

    async def _cass_many(
        self, external_trx_id: str, subscriber_id: str, amount: Union[str, int, float]
    ) -> str:
        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            "externalTrxId": external_trx_id,
            "subscriberId": subscriber_id,
            "paymentInstrumentName": "Mobile Account",
            "amount": str(amount),
        }

        response = await self.send_request(payload, self.server_url)
        return self._handle_response(response)

    def _handle_response(self, json_response: dict) -> str:
        if not json_response:
            raise CassException("Invalid server URL", "500")

        status_code = json_response.get("statusCode", "")
        status_detail = json_response.get("statusDetail", "Unknown error")

        if status_code == "S1000":
            return "S1000"

        raise CassException(status_detail, status_code)


class BalanceQuery(Core):
    """Query subscriber account balance."""

    def __init__(self, application_id: str, password: str):
        super().__init__()
        self.application_id = application_id
        self.password = password
        self.server_url = "https://developer.bdapps.com/caas/balance/query"

    async def query_balance(
        self,
        subscriber_id: str,
        payment_instrument_name: str = "Mobile Account",
    ) -> dict:
        """
        Query the balance of a subscriber.

        Args:
            subscriber_id: Subscriber phone number.
            payment_instrument_name: Payment instrument (default: 'Mobile Account').

        Returns:
            Balance info dictionary.
        """
        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            "subscriberId": subscriber_id,
            "paymentInstrumentName": payment_instrument_name,
        }

        return await self.send_request(payload, self.server_url)


class PaymentInstrumentList(Core):
    """Get available payment instruments for a subscriber."""

    def __init__(self, application_id: str, password: str):
        super().__init__()
        self.application_id = application_id
        self.password = password
        self.server_url = "https://developer.bdapps.com/caas/list/pi"

    async def get_list(
        self, subscriber_id: str, pi_type: str = "all"
    ) -> dict:
        """
        Get payment instruments for a subscriber.

        Args:
            subscriber_id: Subscriber phone number.
            pi_type: Type filter: 'sync', 'async', or 'all'.

        Returns:
            Payment instrument list dictionary.
        """
        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            "subscriberId": subscriber_id,
            "type": pi_type,
        }

        return await self.send_request(payload, self.server_url)
