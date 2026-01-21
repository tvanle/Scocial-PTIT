import { Router } from 'express';
import { authController } from '../controllers';
import { authMiddleware, validate } from '../middleware';
import { loginSchema, registerSchema, forgotPasswordSchema } from '../validators';

const router = Router();

// Public routes
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));
router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res));
router.post('/refresh', (req, res) => authController.refresh(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));
router.post('/forgot-password', validate(forgotPasswordSchema), (req, res) => authController.forgotPassword(req, res));

// Protected routes
router.get('/me', authMiddleware, (req, res) => authController.me(req, res));

export default router;
