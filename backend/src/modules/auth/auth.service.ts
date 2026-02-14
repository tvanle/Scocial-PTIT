import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../../config/database';
import { config } from '../../config';
import { AppError } from '../../middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../shared/constants';
import { JwtPayload } from '../../shared/types';
import { RegisterInput, LoginInput } from './auth.validator';
import { emailService } from '../../services/email.service';
import { VerificationCodeType } from '@prisma/client';

// OTP config
const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;

export class AuthService {
  // ==================== HELPERS ====================

  private generateTokens(userId: string, email: string) {
    const payload: JwtPayload = { userId, email };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as string,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }

  private generateOTP(): string {
    // Generate a secure 6-digit numeric OTP
    return crypto.randomInt(100000, 999999).toString();
  }

  private async createVerificationCode(userId: string, type: VerificationCodeType): Promise<string> {
    // Invalidate any existing unused codes of this type
    await prisma.verificationCode.updateMany({
      where: {
        userId,
        type,
        isUsed: false,
      },
      data: { isUsed: true },
    });

    const code = this.generateOTP();

    await prisma.verificationCode.create({
      data: {
        code,
        type,
        userId,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    return code;
  }

  private async verifyCode(code: string, type: VerificationCodeType, userId?: string) {
    const where: any = {
      code,
      type,
      isUsed: false,
      expiresAt: { gt: new Date() },
    };

    if (userId) {
      where.userId = userId;
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!verificationCode) {
      throw new AppError(ERROR_MESSAGES.INVALID_VERIFICATION_CODE, HTTP_STATUS.BAD_REQUEST);
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });

    return verificationCode;
  }

  // ==================== REGISTER ====================

  async register(data: RegisterInput) {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError(ERROR_MESSAGES.EMAIL_EXISTS, HTTP_STATUS.CONFLICT);
    }

    // Check if studentId exists (if provided)
    if (data.studentId) {
      const existingStudent = await prisma.user.findUnique({
        where: { studentId: data.studentId },
      });

      if (existingStudent) {
        throw new AppError(ERROR_MESSAGES.STUDENT_ID_EXISTS, HTTP_STATUS.CONFLICT);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        studentId: data.studentId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Send verification email
    const verificationCode = await this.createVerificationCode(user.id, 'EMAIL_VERIFY');
    await emailService.sendVerificationEmail(user.email, user.fullName, verificationCode);

    return { user, ...tokens };
  }

  // ==================== LOGIN ====================

  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Check 2FA if enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!data.twoFactorCode) {
        // Return a special response to tell client 2FA is required
        return {
          requiresTwoFactor: true,
          message: ERROR_MESSAGES.TWO_FACTOR_REQUIRED,
        };
      }

      // Verify 2FA code
      const result = verifySync({ token: data.twoFactorCode, secret: user.twoFactorSecret });
      const isValid = result.valid;

      if (!isValid) {
        throw new AppError(ERROR_MESSAGES.TWO_FACTOR_INVALID, HTTP_STATUS.UNAUTHORIZED);
      }
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Save refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Return user without sensitive fields
    const { password: _, twoFactorSecret: __, ...userWithoutSensitive } = user;

    return { user: userWithoutSensitive, ...tokens };
  }

  // ==================== TOKEN MANAGEMENT ====================

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as JwtPayload;

      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
      }

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId, decoded.email);

      // Save new refresh token
      await prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: decoded.userId,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      return tokens;
    } catch (error) {
      throw new AppError(ERROR_MESSAGES.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // ==================== PASSWORD MANAGEMENT ====================

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await this.logoutAll(userId);
  }

  // ==================== EMAIL VERIFICATION ====================

  async sendVerificationEmail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED, HTTP_STATUS.BAD_REQUEST);
    }

    const code = await this.createVerificationCode(userId, 'EMAIL_VERIFY');
    await emailService.sendVerificationEmail(user.email, user.fullName, code);
  }

  async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return;
    }

    if (user.isEmailVerified) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED, HTTP_STATUS.BAD_REQUEST);
    }

    const code = await this.createVerificationCode(user.id, 'EMAIL_VERIFY');
    await emailService.sendVerificationEmail(user.email, user.fullName, code);
  }

  async verifyEmail(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new AppError(ERROR_MESSAGES.EMAIL_ALREADY_VERIFIED, HTTP_STATUS.BAD_REQUEST);
    }

    // Verify the code
    await this.verifyCode(code, 'EMAIL_VERIFY', userId);

    // Mark email as verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        isVerified: true,
      },
    });
  }

  // ==================== FORGOT PASSWORD / RESET ====================

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success (don't reveal if email exists)
    if (!user) {
      return;
    }

    const code = await this.createVerificationCode(user.id, 'PASSWORD_RESET');
    await emailService.sendPasswordResetEmail(user.email, user.fullName, code);
  }

  async verifyResetCode(email: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.RESET_CODE_INVALID, HTTP_STATUS.BAD_REQUEST);
    }

    // Check code is valid without marking as used
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        code,
        type: 'PASSWORD_RESET',
        userId: user.id,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verificationCode) {
      throw new AppError(ERROR_MESSAGES.RESET_CODE_INVALID, HTTP_STATUS.BAD_REQUEST);
    }

    return { valid: true };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.RESET_CODE_INVALID, HTTP_STATUS.BAD_REQUEST);
    }

    // Verify and consume the code
    await this.verifyCode(code, 'PASSWORD_RESET', user.id);

    // Check new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError(ERROR_MESSAGES.PASSWORD_SAME_AS_OLD, HTTP_STATUS.BAD_REQUEST);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens (force re-login)
    await this.logoutAll(user.id);
  }

  // ==================== TWO-FACTOR AUTH (2FA) ====================

  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (user.twoFactorEnabled) {
      throw new AppError(ERROR_MESSAGES.TWO_FACTOR_ALREADY_ENABLED, HTTP_STATUS.BAD_REQUEST);
    }

    // Generate secret
    const secret = generateSecret();

    // Save secret (not yet enabled)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    // Generate QR code URL
    const otpauthUrl = generateURI({
      label: user.email,
      issuer: config.app.name,
      secret,
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      secret,
      qrCode: qrCodeDataUrl,
      otpauthUrl,
    };
  }

  async enable2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (user.twoFactorEnabled) {
      throw new AppError(ERROR_MESSAGES.TWO_FACTOR_ALREADY_ENABLED, HTTP_STATUS.BAD_REQUEST);
    }

    if (!user.twoFactorSecret) {
      throw new AppError('Vui lòng thiết lập 2FA trước', HTTP_STATUS.BAD_REQUEST);
    }

    // Verify TOTP code
    const result = verifySync({ token: code, secret: user.twoFactorSecret });
    const isValid = result.valid;

    if (!isValid) {
      throw new AppError(ERROR_MESSAGES.TWO_FACTOR_INVALID, HTTP_STATUS.BAD_REQUEST);
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    // Send confirmation email
    await emailService.send2FAEnabledEmail(user.email, user.fullName);

    // Generate backup codes (simple random codes)
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex')
    );

    return { backupCodes };
  }

  async disable2FA(userId: string, code: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    if (!user.twoFactorEnabled) {
      throw new AppError(ERROR_MESSAGES.TWO_FACTOR_NOT_ENABLED, HTTP_STATUS.BAD_REQUEST);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
    }

    // Verify 2FA code
    if (user.twoFactorSecret) {
      const result = verifySync({ token: code, secret: user.twoFactorSecret });
      const isValid = result.valid;

      if (!isValid) {
        throw new AppError(ERROR_MESSAGES.TWO_FACTOR_INVALID, HTTP_STATUS.BAD_REQUEST);
      }
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  // ==================== GET CURRENT USER ====================

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        avatar: true,
        coverImage: true,
        bio: true,
        dateOfBirth: true,
        gender: true,
        phone: true,
        isVerified: true,
        isEmailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }
}

export const authService = new AuthService();
