"""
USSD module - USSD Sender and Receiver classes.
Equivalent to PHP UssdSender and UssdReceiver classes in sdk_file.php.
"""

from typing import Optional

from .core import Core
from .exceptions import BDAppsException


class UssdException(BDAppsException):
    """Exception for USSD service errors."""
    pass


class UssdReceiver:
    """
    Parse incoming USSD request JSON.
    Equivalent to PHP UssdReceiver class.
    """

    def __init__(self, data: dict):
        if not data or ("sourceAddress" not in data and "message" not in data):
            raise ValueError("Some of the required parameters are not provided")

        self.source_address = data.get("sourceAddress")
        self.message = data.get("message")
        self.request_id = data.get("requestId")
        self.application_id = data.get("applicationId")
        self.encoding = data.get("encoding")
        self.version = data.get("version")
        self.session_id = data.get("sessionId")
        self.ussd_operation = data.get("ussdOperation")
        self.thejson = data
        self.response = {"statusCode": "S1000", "statusDetail": "Success"}

    def get_json(self) -> dict:
        return self.thejson

    def get_address(self) -> Optional[str]:
        return self.source_address

    def get_message(self) -> Optional[str]:
        return self.message

    def get_request_id(self) -> Optional[str]:
        return self.request_id

    def get_application_id(self) -> Optional[str]:
        return self.application_id

    def get_encoding(self) -> Optional[str]:
        return self.encoding

    def get_version(self) -> Optional[str]:
        return self.version

    def get_session_id(self) -> Optional[str]:
        return self.session_id

    def get_ussd_operation(self) -> Optional[str]:
        return self.ussd_operation

    def get_response(self) -> dict:
        return self.response


class UssdSender(Core):
    """
    Send USSD messages.
    Equivalent to PHP UssdSender class.
    """

    def __init__(self, server_url: str, application_id: str, password: str):
        super().__init__()
        self.server_url = server_url
        self.application_id = application_id
        self.password = password

    async def ussd(
        self,
        session_id: str,
        message: str,
        destination_address: str,
        ussd_operation: str = "mo-cont",
    ) -> dict:
        """
        Send USSD message.

        Args:
            session_id: Session identifier.
            message: Message content.
            destination_address: Destination phone number.
            ussd_operation: USSD operation type (default: 'mo-cont').

        Returns:
            Response from BDApps.
        """
        if not destination_address:
            raise ValueError("address should be a string or an array of strings")

        return await self._ussd_many(
            message, session_id, ussd_operation, destination_address
        )

    async def _ussd_many(
        self,
        message: str,
        session_id: str,
        ussd_operation: str,
        destination_address: str,
    ) -> dict:
        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            "message": message,
            "destinationAddress": destination_address,
            "sessionId": session_id,
            "ussdOperation": ussd_operation,
            "encoding": "440",
        }

        return await self.send_request(payload, self.server_url)
