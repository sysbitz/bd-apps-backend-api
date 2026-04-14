/**
 * BDApps SDK - Main entry point
 * Re-exports all SDK modules for easy importing
 */

const { SMSSender, SMSReceiver, SMSServiceException } = require('./sms');
const { UssdSender, UssdReceiver, UssdException } = require('./ussd');
const { DirectDebitSender, BalanceQuery, PaymentInstrumentList, CassException } = require('./caas');
const { Subscription, SubscriptionException } = require('./subscription');
const OTPService = require('./otp');
const WebApi = require('./webapi');
const Logger = require('./logger');
const Core = require('./core');

module.exports = {
  // Core
  Core,

  // SMS
  SMSSender,
  SMSReceiver,
  SMSServiceException,

  // USSD
  UssdSender,
  UssdReceiver,
  UssdException,

  // CAAS
  DirectDebitSender,
  BalanceQuery,
  PaymentInstrumentList,
  CassException,

  // Subscription
  Subscription,
  SubscriptionException,

  // OTP
  OTPService,

  // WebApi
  WebApi,

  // Logger
  Logger,
};
