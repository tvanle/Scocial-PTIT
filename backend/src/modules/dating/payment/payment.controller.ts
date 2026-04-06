/**
 * Payment Controller
 * Handles payment-related HTTP requests
 */

import { Response, NextFunction, Request } from 'express';
import { AuthRequest } from '../../../shared/types';
import { HTTP_STATUS } from '../../../shared/constants';
import { sendSuccess } from '../../../shared/utils';
import paymentService from './payment.service';
import subscriptionService from './subscription.service';
import { VNPayReturnParams } from './vnpay.service';
import sepayService, { SepayWebhookPayload } from './sepay.service';

export class PaymentController {
  /**
   * Get subscription info and usage
   */
  async getSubscriptionInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const [subscriptionInfo, usageInfo] = await Promise.all([
        subscriptionService.getSubscriptionInfo(userId),
        subscriptionService.getDailyUsage(userId),
      ]);

      sendSuccess(
        res,
        {
          subscription: subscriptionInfo,
          usage: usageInfo,
        },
        'Lấy thông tin subscription thành công',
        HTTP_STATUS.OK,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pricing plans
   */
  async getPricingPlans(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const plans = subscriptionService.getPricingPlans();

      sendSuccess(
        res,
        { plans },
        'Lấy danh sách gói thành công',
        HTTP_STATUS.OK,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create payment URL (VNPay - deprecated)
   */
  async createPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { planType } = req.body;

      // Get client IP
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const result = await paymentService.createPayment({
        userId,
        planType,
        ipAddress,
      });

      sendSuccess(
        res,
        result,
        'Tạo link thanh toán thành công',
        HTTP_STATUS.CREATED,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create VietQR payment
   */
  async createVietQRPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { planType } = req.body;

      // Get client IP
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        req.socket.remoteAddress ||
        '127.0.0.1';

      const result = await paymentService.createVietQRPayment({
        userId,
        planType,
        ipAddress,
      });

      sendSuccess(
        res,
        result,
        'Tạo mã QR thanh toán thành công',
        HTTP_STATUS.CREATED,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirm payment (for VietQR) - manual confirm
   */
  async confirmPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { transactionId } = req.body;

      const result = await paymentService.confirmPayment(transactionId, userId);

      sendSuccess(
        res,
        result,
        result.message,
        result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify payment via SePay API polling
   */
  async verifyPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { transactionId } = req.body;

      const result = await sepayService.verifyAndProcessPayment(transactionId, userId);

      sendSuccess(
        res,
        result,
        result.message,
        result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle VNPay return (IPN - Instant Payment Notification)
   * This is called by VNPay server
   */
  async vnpayIpn(req: Request, res: Response) {
    try {
      const params = req.query as unknown as VNPayReturnParams;
      const result = await paymentService.processVNPayReturn(params);

      // VNPay expects specific response format
      if (result.success) {
        res.json({ RspCode: '00', Message: 'success' });
      } else {
        res.json({ RspCode: '99', Message: result.message });
      }
    } catch (error) {
      console.error('VNPay IPN error:', error);
      res.json({ RspCode: '99', Message: 'Unknown error' });
    }
  }

  /**
   * Handle VNPay return (for mobile app)
   * Called when user is redirected back from VNPay
   */
  async vnpayReturn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const params = req.query as unknown as VNPayReturnParams;
      const result = await paymentService.processVNPayReturn(params);

      sendSuccess(
        res,
        result,
        result.message,
        result.success ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await paymentService.getTransactionHistory(userId, page, limit);

      sendSuccess(
        res,
        result,
        'Lấy lịch sử giao dịch thành công',
        HTTP_STATUS.OK,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const transactionId = req.params.transactionId as string;

      const transaction = await paymentService.getTransaction(transactionId, userId);

      if (!transaction) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy giao dịch',
        });
      }

      sendSuccess(
        res,
        { transaction },
        'Lấy thông tin giao dịch thành công',
        HTTP_STATUS.OK,
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle SePay webhook
   * Called by SePay when a new transaction is received
   */
  async sepayWebhook(req: Request, res: Response) {
    try {
      const payload = req.body as SepayWebhookPayload;
      console.log('[SePay Webhook] Incoming request');

      const result = await sepayService.processWebhook(payload);

      // SePay expects 200 OK response
      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      console.error('[SePay Webhook] Error:', error);
      // Still return 200 to prevent SePay from retrying
      res.status(200).json({
        success: false,
        message: 'Internal error',
      });
    }
  }
}

export const paymentController = new PaymentController();
