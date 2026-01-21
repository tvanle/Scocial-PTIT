import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { tokenService } from './token.service';
import { UserResponse, LoginResponse, RegisterResponse, RegisterInput } from '../types';
import { ERROR_MESSAGES } from '../constants';

const prisma = new PrismaClient();

class AuthService {
  // Transform user to safe response (no password)
  private toUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      bio: user.bio,
      studentId: user.studentId,
      faculty: user.faculty,
      className: user.className,
      phone: user.phone,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const { accessToken, refreshToken } = tokenService.generateTokens(user.id, user.email);

    return {
      user: this.toUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async register(data: RegisterInput): Promise<RegisterResponse> {
    // Check if email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, config.bcrypt.saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        studentId: data.studentId,
        faculty: data.faculty,
        className: data.className,
        phone: data.phone,
      },
    });

    const { accessToken, refreshToken } = tokenService.generateTokens(user.id, user.email);

    return {
      user: this.toUserResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = tokenService.verifyToken(token);
    return tokenService.generateTokens(decoded.userId, decoded.email);
  }

  async getCurrentUser(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        coverPhoto: true,
        bio: true,
        studentId: true,
        faculty: true,
        className: true,
        phone: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    return user as UserResponse;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // TODO: Generate reset token and send email
      // Implementation depends on email service
    }
  }
}

export const authService = new AuthService();
