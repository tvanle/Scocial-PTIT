/**
 * Payment Routes
 */

import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate, validateBody } from '../../../middleware';
import { createPaymentSchema } from './payment.schema';

const router = Router();

// Public routes (no auth required)
router.get('/vnpay/ipn', paymentController.vnpayIpn);
router.post('/sepay/webhook', paymentController.sepayWebhook);

// Protected routes
router.use(authenticate);

// Get subscription info and usage
router.get('/subscription', paymentController.getSubscriptionInfo);

// Get pricing plans
router.get('/plans', paymentController.getPricingPlans);

// Create payment (VNPay - deprecated)
router.post(
  '/create',
  validateBody(createPaymentSchema),
  paymentController.createPayment,
);

// Create VietQR payment
router.post(
  '/vietqr/create',
  validateBody(createPaymentSchema),
  paymentController.createVietQRPayment,
);

// Confirm payment (for VietQR) - manual
router.post('/confirm', paymentController.confirmPayment);

// Verify payment via SePay API - polling
router.post('/verify', paymentController.verifyPayment);

// VNPay return (for mobile app verification)
router.get('/vnpay/return', paymentController.vnpayReturn);

// Transaction history
router.get('/transactions', paymentController.getTransactionHistory);

// Get single transaction
router.get('/transactions/:transactionId', paymentController.getTransaction);

export default router;
