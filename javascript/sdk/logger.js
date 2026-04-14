/**
 * Logger module - File-based logging utility
 * Equivalent to PHP Logger class in sdk_file.php
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(logFile = 'LogData.log') {
    this.logFile = path.resolve(logFile);
  }

  /**
   * Write a log entry with timestamp
   * @param {string} logStream - Log message to write
   */
  writeLog(logStream) {
    const timestamp = new Date().toString();
    const logEntry = `[${timestamp}] ${logStream}\n`;

    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error(`Failed to write log: ${error.message}`);
    }
  }
}

module.exports = Logger;
