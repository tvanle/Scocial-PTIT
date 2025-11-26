// PTIT Theme Colors - Official Red Theme
export const Colors = {
  // Primary Colors - PTIT Red
  primary: '#C41E3A',
  primaryDark: '#9B1B30',
  primaryLight: '#E63950',
  primarySoft: '#FFE5E9',

  // Secondary Colors
  secondary: '#2C3E50',
  secondaryDark: '#1A252F',
  secondaryLight: '#34495E',

  // Accent Colors
  accent: '#E74C3C',
  accentDark: '#C0392B',
  accentLight: '#FF6B6B',

  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#F8F9FA',
  backgroundTertiary: '#E9ECEF',
  backgroundDark: '#1A1A2E',

  // Text Colors
  textPrimary: '#212529',
  textSecondary: '#6C757D',
  textTertiary: '#ADB5BD',
  textLight: '#FFFFFF',
  textDark: '#000000',

  // Status Colors
  success: '#28A745',
  successLight: '#D4EDDA',
  warning: '#FFC107',
  warningLight: '#FFF3CD',
  error: '#DC3545',
  errorLight: '#F8D7DA',
  info: '#17A2B8',
  infoLight: '#D1ECF1',

  // Border Colors
  border: '#DEE2E6',
  borderLight: '#E9ECEF',
  borderDark: '#CED4DA',

  // Social Colors
  like: '#E74C3C',
  love: '#E91E63',
  comment: '#3498DB',
  share: '#27AE60',

  // Gradient
  gradientStart: '#C41E3A',
  gradientEnd: '#E63950',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Card
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',

  // Online Status
  online: '#28A745',
  offline: '#6C757D',
  away: '#FFC107',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 9999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  header: 32,
};

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const Shadow = {
  small: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const Layout = {
  screenPadding: Spacing.lg,
  cardPadding: Spacing.lg,
  inputHeight: 48,
  buttonHeight: 48,
  iconSize: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
  },
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
    xxl: 80,
    profile: 120,
  },
};

export default {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  Layout,
};
