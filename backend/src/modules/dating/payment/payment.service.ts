/**
 * Payment Service
 * Handles payment transactions and VNPay processing
 */

import { PrismaClient, PaymentPlanType, TransactionStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import vnpayService, { VNPayReturnParams } from './vnpay.service';
import vietqrService from './vietqr.service';
import subscriptionService, { PRICING_PLANS, PlanType } from './subscription.service';

const prisma = new PrismaClient();

export interface CreatePaymentInput {
  userId: string;
  planType: PlanType;
  ipAddress: string;
}

export interface PaymentResult {
  success: boolean;
  message: string;
  transactionId?: string;
  subscriptionInfo?: Awaited<ReturnType<typeof subscriptionService.getSubscriptionInfo>>;
}

/**
 * Generate unique transaction reference
 */
function generateTxnRef(): string {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PTIT${timestamp}${random}`;
}

/**
 * Create payment URL for VNPay
 */
export async function createPayment(input: CreatePaymentInput): Promise<{
  paymentUrl: string;
  transactionId: string;
}> {
  const { userId, planType, ipAddress } = input;
  const plan = PRICING_PLANS[planType];

  if (!plan) {
    throw new Error('Invalid plan type');
  }

  // Ensure subscription exists
  const subscription = await subscriptionService.getOrCreateSubscription(userId);

  // Generate transaction reference
  const vnpTxnRef = generateTxnRef();

  // Create transaction record
  const transaction = await prisma.paymentTransaction.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      vnpTxnRef,
      amount: plan.price,
      description: `Nâng cấp Premium - ${plan.label}`,
      planType: planType as PaymentPlanType,
      status: 'PENDING',
      ipAddress,
    },
  });

  // Create VNPay payment URL
  const paymentUrl = vnpayService.createPaymentUrl({
    orderId: vnpTxnRef,
    amount: plan.price,
    orderInfo: `PTIT Social Premium - ${plan.label}`,
    ipAddress,
  });

  return {
    paymentUrl,
    transactionId: transaction.id,
  };
}

/**
 * Process VNPay return/callback
 */
export async function processVNPayReturn(params: VNPayReturnParams): Promise<PaymentResult> {
  const verifyResult = vnpayService.verifyReturnUrl(params);

  // Find transaction
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { vnpTxnRef: verifyResult.txnRef },
    include: { subscription: true },
  });

  if (!transaction) {
    return {
      success: false,
      message: 'Không tìm thấy giao dịch',
    };
  }

  // Already processed
  if (transaction.status !== 'PENDING') {
    return {
      success: transaction.status === 'SUCCESS',
      message:
        transaction.status === 'SUCCESS'
          ? 'Giao dịch đã được xử lý thành công'
          : 'Giao dịch đã được xử lý trước đó',
      transactionId: transaction.id,
    };
  }

  // Verify signature
  if (!verifyResult.isValid) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        vnpResponseCode: verifyResult.responseCode,
        rawResponse: verifyResult.rawData as any,
      },
    });

    return {
      success: false,
      message: 'Chữ ký không hợp lệ',
      transactionId: transaction.id,
    };
  }

  // Check payment success
  if (!verifyResult.isSuccess) {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'FAILED',
        vnpTransactionNo: verifyResult.transactionNo,
        vnpBankCode: verifyResult.bankCode,
        vnpCardType: verifyResult.cardType,
        vnpResponseCode: verifyResult.responseCode,
        rawResponse: verifyResult.rawData as any,
      },
    });

    return {
      success: false,
      message: vnpayService.getResponseMessage(verifyResult.responseCode),
      transactionId: transaction.id,
    };
  }

  // Payment successful - update transaction
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      vnpTransactionNo: verifyResult.transactionNo,
      vnpBankCode: verifyResult.bankCode,
      vnpCardType: verifyResult.cardType,
      vnpResponseCode: verifyResult.responseCode,
      rawResponse: verifyResult.rawData as any,
      paidAt: new Date(),
    },
  });

  // Upgrade subscription
  await subscriptionService.upgradeToPremium(
    transaction.userId,
    transaction.planType as PlanType,
  );

  // Get updated subscription info
  const subscriptionInfo = await subscriptionService.getSubscriptionInfo(transaction.userId);

  return {
    success: true,
    message: 'Thanh toán thành công! Bạn đã được nâng cấp lên Premium.',
    transactionId: transaction.id,
    subscriptionInfo,
  };
}

/**
 * Get user's transaction history
 */
export async function getTransactionHistory(
  userId: string,
  page: number = 1,
  limit: number = 10,
) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        vnpTxnRef: true,
        amount: true,
        description: true,
        planType: true,
        status: true,
        vnpBankCode: true,
        paidAt: true,
        createdAt: true,
      },
    }),
    prisma.paymentTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get transaction by ID
 */
export async function getTransaction(transactionId: string, userId: string) {
  return prisma.paymentTransaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
    select: {
      id: true,
      vnpTxnRef: true,
      amount: true,
      description: true,
      planType: true,
      status: true,
      vnpBankCode: true,
      vnpCardType: true,
      paidAt: true,
      createdAt: true,
    },
  });
}

/**
 * Cancel expired pending transactions
 */
export async function cancelExpiredTransactions(): Promise<number> {
  const expireTime = new Date();
  expireTime.setMinutes(expireTime.getMinutes() - 15); // 15 minutes timeout

  const result = await prisma.paymentTransaction.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: expireTime },
    },
    data: {
      status: 'EXPIRED',
    },
  });

  return result.count;
}

/**
 * Create VietQR payment
 */
export async function createVietQRPayment(input: CreatePaymentInput): Promise<{
  qrData: ReturnType<typeof vietqrService.generateVietQRData>;
  transactionId: string;
}> {
  const { userId, planType, ipAddress } = input;
  const plan = PRICING_PLANS[planType];

  if (!plan) {
    throw new Error('Invalid plan type');
  }

  // Ensure subscription exists
  const subscription = await subscriptionService.getOrCreateSubscription(userId);

  // Generate transaction reference (shorter for bank transfer)
  const txnRef = generateTxnRef();

  // Create transaction record
  const transaction = await prisma.paymentTransaction.create({
    data: {
      userId,
      subscriptionId: subscription.id,
      vnpTxnRef: txnRef, // Reuse this field for VietQR
      amount: plan.price,
      description: `Nâng cấp Premium - ${plan.label}`,
      planType: planType as PaymentPlanType,
      status: 'PENDING',
      ipAddress,
    },
  });

  // Generate VietQR data
  const qrData = vietqrService.generateVietQRData({
    amount: plan.price,
    transactionCode: txnRef,
  });

  return {
    qrData,
    transactionId: transaction.id,
  };
}

/**
 * Confirm payment manually (for VietQR payments)
 * In production, this should verify with bank API
 */
export async function confirmPayment(
  transactionId: string,
  userId: string,
): Promise<PaymentResult> {
  const transaction = await prisma.paymentTransaction.findFirst({
    where: {
      id: transactionId,
      userId,
      status: 'PENDING',
    },
  });

  if (!transaction) {
    return {
      success: false,
      message: 'Không tìm thấy giao dịch hoặc giao dịch đã được xử lý',
    };
  }

  // Update transaction status
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      paidAt: new Date(),
    },
  });

  // Upgrade subscription
  await subscriptionService.upgradeToPremium(
    transaction.userId,
    transaction.planType as PlanType,
  );

  // Get updated subscription info
  const subscriptionInfo = await subscriptionService.getSubscriptionInfo(transaction.userId);

  return {
    success: true,
    message: 'Thanh toán thành công! Bạn đã được nâng cấp lên Premium.',
    transactionId: transaction.id,
    subscriptionInfo,
  };
}

export default {
  createPayment,
  createVietQRPayment,
  processVNPayReturn,
  confirmPayment,
  getTransactionHistory,
  getTransaction,
  cancelExpiredTransactions,
};
