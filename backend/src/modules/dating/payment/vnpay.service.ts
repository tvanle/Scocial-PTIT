/**
 * VNPay Payment Service
 * Handles VNPay payment URL creation and verification
 */

import crypto from 'crypto';
import qs from 'qs';

// VNPay Configuration
const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'DEMOV210',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'SECRETKEY123456789',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'ptitsocial://payment/vnpay-return',
  vnp_IpnUrl: process.env.VNPAY_IPN_URL || '',
  vnp_Version: '2.1.0',
  vnp_Command: 'pay',
  vnp_CurrCode: 'VND',
  vnp_Locale: 'vn',
};

export interface CreatePaymentParams {
  orderId: string;
  amount: number; // VND
  orderInfo: string;
  ipAddress: string;
  bankCode?: string;
}

export interface VNPayReturnParams {
  vnp_TmnCode: string;
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo?: string;
  vnp_CardType: string;
  vnp_PayDate: string;
  vnp_OrderInfo: string;
  vnp_TransactionNo: string;
  vnp_ResponseCode: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
  [key: string]: string | undefined;
}

export interface VerifyResult {
  isValid: boolean;
  isSuccess: boolean;
  responseCode: string;
  transactionNo: string;
  txnRef: string;
  amount: number;
  bankCode: string;
  cardType: string;
  payDate: string;
  rawData: VNPayReturnParams;
}

/**
 * Sort object by keys alphabetically
 */
function sortObject(obj: Record<string, string>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

/**
 * Create HMAC SHA512 signature
 */
function createSignature(data: string, secret: string): string {
  return crypto
    .createHmac('sha512', secret)
    .update(Buffer.from(data, 'utf-8'))
    .digest('hex');
}

/**
 * Format date for VNPay (yyyyMMddHHmmss)
 */
function formatVnpayDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

/**
 * Create VNPay payment URL
 */
export function createPaymentUrl(params: CreatePaymentParams): string {
  const vnpParams: Record<string, string> = {
    vnp_Version: VNPAY_CONFIG.vnp_Version,
    vnp_Command: VNPAY_CONFIG.vnp_Command,
    vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
    vnp_Locale: VNPAY_CONFIG.vnp_Locale,
    vnp_CurrCode: VNPAY_CONFIG.vnp_CurrCode,
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: (params.amount * 100).toString(), // VNPay requires amount * 100
    vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
    vnp_IpAddr: params.ipAddress,
    vnp_CreateDate: formatVnpayDate(new Date()),
  };

  if (params.bankCode) {
    vnpParams.vnp_BankCode = params.bankCode;
  }

  // Sort and create query string
  const sortedParams = sortObject(vnpParams);
  const signData = qs.stringify(sortedParams, { encode: false });
  const signature = createSignature(signData, VNPAY_CONFIG.vnp_HashSecret);

  // Add signature
  sortedParams.vnp_SecureHash = signature;

  // Build final URL
  const queryString = qs.stringify(sortedParams, { encode: false });
  return `${VNPAY_CONFIG.vnp_Url}?${queryString}`;
}

/**
 * Verify VNPay return URL parameters
 */
export function verifyReturnUrl(params: VNPayReturnParams): VerifyResult {
  const secureHash = params.vnp_SecureHash;

  // Remove hash from params for verification
  const verifyParams: Record<string, string> = {};
  for (const key of Object.keys(params)) {
    if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && params[key]) {
      verifyParams[key] = params[key] as string;
    }
  }

  // Sort and create signature
  const sortedParams = sortObject(verifyParams);
  const signData = qs.stringify(sortedParams, { encode: false });
  const checkSignature = createSignature(signData, VNPAY_CONFIG.vnp_HashSecret);

  const isValid = secureHash === checkSignature;
  const isSuccess = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';

  return {
    isValid,
    isSuccess,
    responseCode: params.vnp_ResponseCode,
    transactionNo: params.vnp_TransactionNo,
    txnRef: params.vnp_TxnRef,
    amount: parseInt(params.vnp_Amount, 10) / 100,
    bankCode: params.vnp_BankCode,
    cardType: params.vnp_CardType,
    payDate: params.vnp_PayDate,
    rawData: params,
  };
}

/**
 * Get response code message
 */
export function getResponseMessage(code: string): string {
  const messages: Record<string, string> = {
    '00': 'Giao dịch thành công',
    '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking.',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán.',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
    '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
    '75': 'Ngân hàng thanh toán đang bảo trì.',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
    '99': 'Các lỗi khác.',
  };
  return messages[code] || 'Lỗi không xác định';
}

export default {
  createPaymentUrl,
  verifyReturnUrl,
  getResponseMessage,
};
