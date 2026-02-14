import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').optional(),
  studentId: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  twoFactorCode: z.string().length(6, 'Mã 2FA phải có 6 chữ số').optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

// Email verification
export const verifyEmailSchema = z.object({
  code: z.string().length(6, 'Mã xác thực phải có 6 chữ số'),
});

export const resendVerificationSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

// Password reset
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  code: z.string().length(6, 'Mã xác thực phải có 6 chữ số'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  code: z.string().length(6, 'Mã xác thực phải có 6 chữ số'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

// 2FA
export const verify2FASchema = z.object({
  code: z.string().length(6, 'Mã 2FA phải có 6 chữ số'),
});

export const disable2FASchema = z.object({
  code: z.string().length(6, 'Mã 2FA phải có 6 chữ số'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyResetCodeInput = z.infer<typeof verifyResetCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type Verify2FAInput = z.infer<typeof verify2FASchema>;
export type Disable2FAInput = z.infer<typeof disable2FASchema>;
