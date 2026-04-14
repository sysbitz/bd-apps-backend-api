"""
Base exception classes for BDApps SDK.
"""


class BDAppsException(Exception):
    """Base exception for all BDApps errors."""

    def __init__(self, message: str, status_code: str = "UNKNOWN", response=None):
        super().__init__(message)
        self.status_code = status_code
        self.status_detail = message
        self.raw_response = response

    def get_error_code(self) -> str:
        return self.status_code

    def get_error_message(self) -> str:
        return self.status_detail

    def get_raw_response(self):
        return self.raw_response
