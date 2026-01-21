import { Request } from 'express';

// User response (safe - no password)
export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  studentId?: string | null;
  faculty?: string | null;
  className?: string | null;
  phone?: string | null;
  isVerified: boolean;
  createdAt?: Date;
}

// Auth tokens
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Login response
export interface LoginResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

// Register response
export interface RegisterResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

// JWT payload
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extended request with user info
export interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Register input
export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  studentId?: string;
  faculty?: string;
  className?: string;
  phone?: string;
}

// Login input
export interface LoginInput {
  email: string;
  password: string;
}
