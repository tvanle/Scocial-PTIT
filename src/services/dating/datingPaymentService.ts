/**
 * Dating Payment Service
 * Handles subscription and payment operations
 */

import apiClient from '../api/apiClient';
import { ENDPOINTS } from '../../constants/api';

export interface SubscriptionLimits {
  dailySwipes: number;
  dailySuperLikes: number;
  dailyRewinds: number;
  canSeeLikes: boolean;
  canSeeWhoLikedYou: boolean;
  canRewind: boolean;
}

export interface SubscriptionInfo {
  tier: 'FREE' | 'PREMIUM';
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
  limits: SubscriptionLimits;
}

export interface UsageInfo {
  swipeCount: number;
  superLikeCount: number;
  rewindCount: number;
  swipesRemaining: number;
  superLikesRemaining: number;
  rewindsRemaining: number;
  canSwipe: boolean;
  canSuperLike: boolean;
  canRewind: boolean;
}

export interface PricingPlan {
  type: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  price: number;
  durationDays: number;
  label: string;
  description: string;
  savings?: string;
  formattedPrice: string;
  monthlyPrice: string;
}

export interface PaymentTransaction {
  id: string;
  vnpTxnRef: string;
  amount: number;
  description: string;
  planType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  vnpBankCode?: string;
  vnpCardType?: string;
  paidAt?: string;
  createdAt: string;
}

class DatingPaymentService {
  /**
   * Get subscription info and daily usage
   */
  async getSubscriptionInfo(): Promise<{
    subscription: SubscriptionInfo;
    usage: UsageInfo;
  }> {
    const response = await apiClient.get(ENDPOINTS.DATING.SUBSCRIPTION);
    return response.data;
  }

  /**
   * Get pricing plans
   */
  async getPricingPlans(): Promise<{ plans: PricingPlan[] }> {
    const response = await apiClient.get(ENDPOINTS.DATING.PRICING_PLANS);
    return response.data;
  }

  /**
   * Create payment and get VNPay URL (deprecated)
   */
  async createPayment(planType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'): Promise<{
    paymentUrl: string;
    transactionId: string;
  }> {
    const response = await apiClient.post(ENDPOINTS.DATING.CREATE_PAYMENT, {
      planType,
    });
    return response.data;
  }

  /**
   * Create VietQR payment
   */
  async createVietQRPayment(planType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'): Promise<{
    qrData: {
      qrUrl: string;
      bankId: string;
      accountNo: string;
      accountName: string;
      amount: number;
      transferInfo: string;
      transactionCode: string;
    };
    transactionId: string;
  }> {
    const response = await apiClient.post(ENDPOINTS.DATING.CREATE_VIETQR_PAYMENT, {
      planType,
    });
    return response.data;
  }

  /**
   * Confirm payment (for VietQR) - manual
   */
  async confirmPayment(transactionId: string): Promise<{
    success: boolean;
    message: string;
    subscriptionInfo?: SubscriptionInfo;
  }> {
    const response = await apiClient.post(ENDPOINTS.DATING.CONFIRM_PAYMENT, {
      transactionId,
    });
    return response.data;
  }

  /**
   * Verify payment via SePay API - polling
   */
  async verifyPayment(transactionId: string): Promise<{
    success: boolean;
    message: string;
    status: 'SUCCESS' | 'PENDING' | 'NOT_FOUND';
  }> {
    const response = await apiClient.post(ENDPOINTS.DATING.VERIFY_PAYMENT, {
      transactionId,
    });
    return response.data;
  }

  /**
   * Verify VNPay return (after redirect back from VNPay) - deprecated
   */
  async verifyVNPayReturn(params: Record<string, string>): Promise<{
    success: boolean;
    message: string;
    transactionId?: string;
    subscriptionInfo?: SubscriptionInfo;
  }> {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(
      `${ENDPOINTS.DATING.VNPAY_RETURN}?${queryString}`,
    );
    return response.data;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    page = 1,
    limit = 10,
  ): Promise<{
    transactions: PaymentTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const response = await apiClient.get(ENDPOINTS.DATING.TRANSACTIONS, {
      params: { page, limit },
    });
    return response.data;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<{
    transaction: PaymentTransaction;
  }> {
    const response = await apiClient.get(
      ENDPOINTS.DATING.TRANSACTION_DETAIL(transactionId),
    );
    return response.data;
  }

  /**
   * Check if user can swipe (based on subscription)
   */
  async canSwipe(): Promise<boolean> {
    const { usage } = await this.getSubscriptionInfo();
    return usage.canSwipe;
  }

  /**
   * Check if user is premium
   */
  async isPremium(): Promise<boolean> {
    const { subscription } = await this.getSubscriptionInfo();
    return subscription.tier === 'PREMIUM' && subscription.status === 'ACTIVE';
  }
}

export const datingPaymentService = new DatingPaymentService();
export default datingPaymentService;
