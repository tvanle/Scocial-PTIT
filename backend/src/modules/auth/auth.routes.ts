import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate, validateBody } from '../../middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  verifyResetCodeSchema,
  resetPasswordSchema,
  verify2FASchema,
  disable2FASchema,
} from './auth.validator';

const router = Router();

// ==================== PUBLIC ROUTES ====================

// Register & Login
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);

// Token management
router.post('/refresh-token', validateBody(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authController.logout);

// Email verification (public - for resend by email)
router.post('/resend-verification', validateBody(resendVerificationSchema), authController.resendVerificationByEmail);

// Forgot password flow
router.post('/forgot-password', validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-reset-code', validateBody(verifyResetCodeSchema), authController.verifyResetCode);
router.post('/reset-password', validateBody(resetPasswordSchema), authController.resetPassword);

// ==================== PROTECTED ROUTES ====================

// Profile
router.get('/me', authenticate, authController.me);

// Logout all devices
router.post('/logout-all', authenticate, authController.logoutAll);

// Change password
router.post('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword);

// Email verification (protected - for authenticated users)
router.post('/verify-email', authenticate, validateBody(verifyEmailSchema), authController.verifyEmail);
router.post('/send-verification', authenticate, authController.resendVerification);

// Two-Factor Authentication (2FA)
router.post('/2fa/setup', authenticate, authController.setup2FA);
router.post('/2fa/enable', authenticate, validateBody(verify2FASchema), authController.enable2FA);
router.post('/2fa/disable', authenticate, validateBody(disable2FASchema), authController.disable2FA);

export default router;
