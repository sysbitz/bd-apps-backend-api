"""
Logger module - File-based logging utility.
Equivalent to PHP Logger class in sdk_file.php.
"""

import os
from datetime import datetime


class Logger:
    """Simple file-based logger."""

    def __init__(self, log_file: str = "LogData.log"):
        self.log_file = os.path.abspath(log_file)

    def write_log(self, log_stream: str) -> None:
        """
        Write a log entry with timestamp.

        Args:
            log_stream: Log message to write.
        """
        timestamp = datetime.now().strftime("%a %b %d %H:%M:%S %Z %Y")
        log_entry = f"[{timestamp}] {log_stream}\n"

        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry)
        except OSError as e:
            print(f"Failed to write log: {e}")
