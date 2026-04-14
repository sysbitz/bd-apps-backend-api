"""
SMS module - SMS Sender and Receiver classes.
Equivalent to PHP SMSSender and SMSReceiver classes in sdk_file.php.
"""

import json
from typing import Optional, Union

from .core import Core
from .exceptions import BDAppsException


class SMSServiceException(BDAppsException):
    """Exception for SMS service errors."""
    pass


class SMSReceiver:
    """
    Parse incoming SMS notification JSON.
    Equivalent to PHP SMSReceiver class.
    """

    def __init__(self, json_request: dict):
        if not json_request or (
            "sourceAddress" not in json_request and "message" not in json_request
        ):
            self.response = {
                "statusCode": "E1312",
                "statusDetail": "Request is Invalid.",
            }
            self.thejson = None
            self.version = None
            self.application_id = None
            self.source_address = None
            self.message = None
            self.request_id = None
            self.encoding = None
        else:
            self.thejson = json_request
            self.version = json_request.get("version")
            self.application_id = json_request.get("applicationId")
            self.source_address = json_request.get(
                "sourceAddress", json_request.get("address")
            )
            self.message = json_request.get("message")
            self.request_id = json_request.get("requestId")
            self.encoding = json_request.get("encoding")
            self.response = {
                "statusCode": "S1000",
                "statusDetail": "Process completed successfully.",
            }

    def get_version(self) -> Optional[str]:
        return self.version

    def get_encoding(self) -> Optional[str]:
        return self.encoding

    def get_application_id(self) -> Optional[str]:
        return self.application_id

    def get_address(self) -> Optional[str]:
        return self.source_address

    def get_message(self) -> Optional[str]:
        return self.message

    def get_request_id(self) -> Optional[str]:
        return self.request_id

    def get_json(self) -> Optional[dict]:
        return self.thejson

    def get_response(self) -> dict:
        return self.response


class SMSSender(Core):
    """
    Send SMS to one or more addresses.
    Equivalent to PHP SMSSender class.
    """

    def __init__(self, server_url: str, application_id: str, password: str):
        super().__init__()

        if not server_url or not application_id or not password:
            raise SMSServiceException("Request Invalid.", "E1312")

        self.application_id = application_id
        self.password = password
        self.server_url = server_url

        # Optional fields
        self.source_address: Optional[str] = None
        self.charging_amount: Optional[str] = None
        self.encoding: Optional[str] = None
        self.version: Optional[str] = None
        self.delivery_status_request: Optional[str] = None
        self.binary_header: Optional[str] = None

    async def broadcast(self, message: str) -> bool:
        """Broadcast a message to all subscribed users."""
        return await self.sms(message, ["tel:all"])

    async def sms(self, message: str, addresses: Union[str, list]) -> bool:
        """
        Send SMS to one or more addresses.

        Args:
            message: Message to send.
            addresses: Single address string or list of addresses.

        Returns:
            True if successful.
        """
        if not addresses:
            raise SMSServiceException("Format of the address is invalid.", "E1325")

        address_list = [addresses] if isinstance(addresses, str) else addresses
        json_stream = self._resolve_json_stream(message, address_list)

        if json_stream:
            response = await self.send_request(json.loads(json_stream), self.server_url)
            return self._handle_response(response)

        return False

    def _handle_response(self, json_response: dict) -> bool:
        if not json_response:
            raise SMSServiceException("Invalid server URL", "500")

        status_code = json_response.get("statusCode", "")
        status_detail = json_response.get("statusDetail", "Unknown error")

        if status_code == "S1000":
            return True

        raise SMSServiceException(status_detail, status_code)

    def _resolve_json_stream(self, message: str, addresses: list) -> str:
        message_details = {
            "message": message,
            "destinationAddresses": addresses,
        }

        if self.source_address:
            message_details["sourceAddress"] = self.source_address
        if self.delivery_status_request:
            message_details["deliveryStatusRequest"] = self.delivery_status_request
        if self.binary_header:
            message_details["binaryHeader"] = self.binary_header
        if self.version:
            message_details["version"] = self.version
        if self.encoding:
            message_details["encoding"] = self.encoding

        payload = {
            "applicationId": self.application_id,
            "password": self.password,
            **message_details,
        }

        return json.dumps(payload)

    # Setters
    def set_source_address(self, source_address: str):
        self.source_address = source_address

    def set_charging_amount(self, charging_amount: str):
        self.charging_amount = charging_amount

    def set_encoding(self, encoding: str):
        self.encoding = encoding

    def set_version(self, version: str):
        self.version = version

    def set_binary_header(self, binary_header: str):
        self.binary_header = binary_header

    def set_delivery_status_request(self, delivery_status_request: str):
        self.delivery_status_request = delivery_status_request
