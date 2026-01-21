import { Request, Response } from 'express';
import { authService } from '../services';
import { AuthenticatedRequest } from '../types';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../constants';

class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.INVALID_CREDENTIALS) {
        res.status(401).json({ error: error.message });
        return;
      }
      console.error('Login error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.LOGIN_FAILED });
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.EMAIL_EXISTS) {
        res.status(409).json({ error: error.message });
        return;
      }
      console.error('Register error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.REGISTER_FAILED });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(401).json({ error: ERROR_MESSAGES.REFRESH_TOKEN_REQUIRED });
        return;
      }

      const tokens = await authService.refreshToken(refreshToken);
      res.json(tokens);
    } catch (error) {
      res.status(401).json({ error: ERROR_MESSAGES.INVALID_REFRESH_TOKEN });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    // In a real app, you might want to blacklist the token
    res.json({ message: SUCCESS_MESSAGES.LOGOUT_SUCCESS });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      await authService.forgotPassword(email);
      res.json({ message: SUCCESS_MESSAGES.PASSWORD_RESET_SENT });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.FORGOT_PASSWORD_FAILED });
    }
  }

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const user = await authService.getCurrentUser(userId);
      res.json(user);
    } catch (error: any) {
      if (error.message === ERROR_MESSAGES.USER_NOT_FOUND) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error('Get user error:', error);
      res.status(500).json({ error: ERROR_MESSAGES.GET_USER_FAILED });
    }
  }
}

export const authController = new AuthController();
