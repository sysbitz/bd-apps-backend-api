"""
Core module - Base HTTP request handler for BDApps API.
Equivalent to PHP Core class in sdk_file.php.
"""

import httpx


class Core:
    """Base class providing HTTP POST request functionality."""

    async def send_request(self, json_data: dict, url: str) -> dict:
        """
        Send a POST request with JSON payload to the given URL.

        Args:
            json_data: JSON-serializable dictionary to send.
            url: Target URL.

        Returns:
            Parsed JSON response as a dictionary.
        """
        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=json_data,
                    headers={"Content-Type": "application/json"},
                )
                return response.json()
        except httpx.HTTPStatusError as e:
            if e.response is not None:
                return e.response.json()
            raise
        except Exception as e:
            raise e
