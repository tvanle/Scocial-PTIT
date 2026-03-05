import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { AuthRequest } from '../../shared/types';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../shared/constants';
import { sendSuccess } from '../../shared/utils';

export class AuthController {
  // ==================== REGISTER / LOGIN ====================

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      sendSuccess(res, result, SUCCESS_MESSAGES.REGISTER_SUCCESS, HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      sendSuccess(res, result, SUCCESS_MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  // ==================== TOKEN MANAGEMENT ====================

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.logoutAll(req.user!.userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  // ==================== PASSWORD ====================

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { currentPassword, newPassword } = req.body;
      await authService.changePassword(req.user!.userId, currentPassword, newPassword);
      sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_CHANGED);
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.forgotPassword(req.body.email);
      sendSuccess(res, null, SUCCESS_MESSAGES.RESET_EMAIL_SENT);
    } catch (error) {
      next(error);
    }
  }

  async verifyResetCode(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyResetCode(req.body.email, req.body.code);
      sendSuccess(res, result, SUCCESS_MESSAGES.RESET_CODE_VERIFIED);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code, newPassword } = req.body;
      await authService.resetPassword(email, code, newPassword);
      sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  // ==================== EMAIL VERIFICATION ====================

  async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.verifyEmail(req.user!.userId, req.body.code);
      sendSuccess(res, null, SUCCESS_MESSAGES.EMAIL_VERIFIED);
    } catch (error) {
      next(error);
    }
  }

  async resendVerification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await authService.sendVerificationEmail(req.user!.userId);
      sendSuccess(res, null, SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT);
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.resendVerificationEmail(req.body.email);
      sendSuccess(res, null, SUCCESS_MESSAGES.VERIFICATION_EMAIL_SENT);
    } catch (error) {
      next(error);
    }
  }

  // ==================== TWO-FACTOR AUTH ====================

  async setup2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.setup2FA(req.user!.userId);
      sendSuccess(res, result, SUCCESS_MESSAGES.TWO_FACTOR_SETUP);
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.enable2FA(req.user!.userId, req.body.code);
      sendSuccess(res, result, SUCCESS_MESSAGES.TWO_FACTOR_ENABLED);
    } catch (error) {
      next(error);
    }
  }

  async disable2FA(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code, password } = req.body;
      await authService.disable2FA(req.user!.userId, code, password);
      sendSuccess(res, null, SUCCESS_MESSAGES.TWO_FACTOR_DISABLED);
    } catch (error) {
      next(error);
    }
  }

  // ==================== PROFILE ====================

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.getCurrentUser(req.user!.userId);
      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
