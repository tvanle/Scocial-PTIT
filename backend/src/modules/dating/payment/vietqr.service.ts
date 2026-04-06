/**
 * VietQR Payment Service
 * Generates VietQR code for direct bank transfer
 */

// VietQR Configuration
const VIETQR_CONFIG = {
  bankId: process.env.VIETQR_BANK_ID || 'MB',
  accountNo: process.env.VIETQR_ACCOUNT_NO || '',
  accountName: process.env.VIETQR_ACCOUNT_NAME || '',
  template: 'compact2', // compact, compact2, qr_only, print
};

export interface VietQRParams {
  amount: number;
  transactionCode: string;
  description?: string;
}

/**
 * Generate VietQR image URL
 * Uses VietQR.io API to generate QR code
 */
export function generateVietQRUrl(params: VietQRParams): string {
  const { amount, transactionCode, description } = params;

  // Build transfer description with transaction code for tracking
  const transferInfo = description
    ? `${transactionCode} ${description}`
    : `PTIT Premium ${transactionCode}`;

  // VietQR URL format
  const baseUrl = 'https://img.vietqr.io/image';
  const bankId = VIETQR_CONFIG.bankId;
  const accountNo = VIETQR_CONFIG.accountNo;
  const template = VIETQR_CONFIG.template;

  // Build URL with query params
  const queryParams = new URLSearchParams({
    amount: amount.toString(),
    addInfo: transferInfo,
    accountName: VIETQR_CONFIG.accountName,
  });

  return `${baseUrl}/${bankId}-${accountNo}-${template}.png?${queryParams.toString()}`;
}

/**
 * Generate VietQR data for frontend
 */
export function generateVietQRData(params: VietQRParams) {
  return {
    qrUrl: generateVietQRUrl(params),
    bankId: VIETQR_CONFIG.bankId,
    accountNo: VIETQR_CONFIG.accountNo,
    accountName: VIETQR_CONFIG.accountName,
    amount: params.amount,
    transferInfo: `PTIT Premium ${params.transactionCode}`,
    transactionCode: params.transactionCode,
  };
}

export default {
  generateVietQRUrl,
  generateVietQRData,
  VIETQR_CONFIG,
};
