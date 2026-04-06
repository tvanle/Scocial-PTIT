/**
 * SePay Service
 * Handles SePay payment verification via API polling
 */

import { PrismaClient } from '@prisma/client';
import subscriptionService, { PlanType } from './subscription.service';

const prisma = new PrismaClient();

const SEPAY_CONFIG = {
  apiToken: process.env.SEPAY_API_TOKEN || '',
  apiUrl: 'https://my.sepay.vn/userapi/transactions/list',
};

// SePay transaction interface
export interface SepayTransaction {
  id: string;
  transaction_date: string;
  account_number: string;
  transaction_content: string;
  amount_in: number;
  amount_out: number;
  accumulated: string;
  reference_number: string;
}

export interface SepayApiResponse {
  status: number;
  messages: {
    success: boolean;
  };
  transactions: SepayTransaction[];
}

/**
 * Fetch recent transactions from SePay API
 */
export async function fetchRecentTransactions(limit: number = 20): Promise<SepayTransaction[]> {
  try {
    const response = await fetch(`${SEPAY_CONFIG.apiUrl}?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SEPAY_CONFIG.apiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[SePay API] Error:', response.status, response.statusText);
      return [];
    }

    const data = (await response.json()) as SepayApiResponse;

    if (!data.messages?.success) {
      console.error('[SePay API] Failed:', data);
      return [];
    }

    return data.transactions || [];
  } catch (error) {
    console.error('[SePay API] Fetch error:', error);
    return [];
  }
}

/**
 * Check if a specific transaction has been paid
 * Returns the matching SePay transaction if found
 */
export async function checkTransactionPaid(txnRef: string, expectedAmount: number): Promise<{
  paid: boolean;
  sepayTransaction?: SepayTransaction;
}> {
  const transactions = await fetchRecentTransactions(50);

  // Look for transaction with matching code in content
  const matchingTxn = transactions.find(txn => {
    const content = txn.transaction_content.toUpperCase();
    const amount = txn.amount_in;

    // Check if content contains our transaction reference and amount matches
    return content.includes(txnRef.toUpperCase()) && amount >= expectedAmount;
  });

  if (matchingTxn) {
    console.log('[SePay] Found matching transaction:', matchingTxn);
    return { paid: true, sepayTransaction: matchingTxn };
  }

  return { paid: false };
}

/**
 * Verify and process payment for a transaction
 */
export async function verifyAndProcessPayment(transactionId: string, userId: string): Promise<{
  success: boolean;
  message: string;
  status: 'SUCCESS' | 'PENDING' | 'NOT_FOUND';
}> {
  // Find pending transaction
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    return {
      success: false,
      message: 'Không tìm thấy giao dịch',
      status: 'NOT_FOUND',
    };
  }

  // Already processed
  if (transaction.status === 'SUCCESS') {
    return {
      success: true,
      message: 'Giao dịch đã được xác nhận trước đó',
      status: 'SUCCESS',
    };
  }

  if (transaction.status !== 'PENDING') {
    return {
      success: false,
      message: 'Giao dịch đã hết hạn hoặc thất bại',
      status: 'NOT_FOUND',
    };
  }

  // Check with SePay API
  const { paid, sepayTransaction } = await checkTransactionPaid(
    transaction.vnpTxnRef,
    transaction.amount,
  );

  if (!paid) {
    return {
      success: false,
      message: 'Chưa nhận được thanh toán. Vui lòng đợi hoặc kiểm tra lại nội dung chuyển khoản.',
      status: 'PENDING',
    };
  }

  // Payment confirmed - update transaction
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      paidAt: new Date(),
      rawResponse: sepayTransaction as any,
    },
  });

  // Upgrade subscription
  await subscriptionService.upgradeToPremium(
    transaction.userId,
    transaction.planType as PlanType,
  );

  console.log('[SePay] Payment confirmed for user:', transaction.userId);

  return {
    success: true,
    message: 'Thanh toán thành công! Bạn đã được nâng cấp lên Premium.',
    status: 'SUCCESS',
  };
}

// Webhook handler (kept for future use)
export interface SepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  code: string | null;
  content: string;
  transferType: 'in' | 'out';
  transferAmount: number;
  accumulated: number;
  subAccount: string | null;
  referenceCode: string;
  description: string;
}

export async function processWebhook(payload: SepayWebhookPayload): Promise<{
  success: boolean;
  message: string;
}> {
  console.log('[SePay Webhook] Received:', JSON.stringify(payload, null, 2));

  if (payload.transferType !== 'in') {
    return { success: true, message: 'Ignored outgoing transfer' };
  }

  const content = payload.content.toUpperCase();
  const txnRefMatch = content.match(/PTIT[A-Z0-9]+/);

  if (!txnRefMatch) {
    return { success: true, message: 'No transaction code found' };
  }

  const txnRef = txnRefMatch[0];

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { vnpTxnRef: txnRef },
  });

  if (!transaction || transaction.status !== 'PENDING') {
    return { success: true, message: 'Transaction not found or already processed' };
  }

  if (payload.transferAmount < transaction.amount) {
    return { success: false, message: 'Amount mismatch' };
  }

  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      paidAt: new Date(),
      rawResponse: payload as any,
    },
  });

  await subscriptionService.upgradeToPremium(
    transaction.userId,
    transaction.planType as PlanType,
  );

  return { success: true, message: 'Payment confirmed successfully' };
}

export default {
  fetchRecentTransactions,
  checkTransactionPaid,
  verifyAndProcessPayment,
  processWebhook,
};
