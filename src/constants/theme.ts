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

// Lowercase aliases for compatibility
export const colors = {
  primary: Colors.primary,
  primaryDark: Colors.primaryDark,
  primaryLight: Colors.primaryLight,
  white: '#FFFFFF',
  black: '#000000',
  text: {
    primary: Colors.textPrimary,
    secondary: Colors.textSecondary,
    tertiary: Colors.textTertiary,
    placeholder: Colors.textTertiary,
  },
  border: Colors.border,
  background: Colors.background,
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  success: Colors.success,
  warning: Colors.warning,
  error: Colors.error,
  info: Colors.info,
};

export const spacing = {
  xs: Spacing.xs,
  sm: Spacing.sm,
  md: Spacing.md,
  lg: Spacing.lg,
  xl: Spacing.xl,
  xxl: Spacing.xxl,
};

export const borderRadius = {
  xs: BorderRadius.xs,
  sm: BorderRadius.sm,
  md: BorderRadius.md,
  lg: BorderRadius.lg,
  xl: BorderRadius.xl,
  full: BorderRadius.round,
};

export const typography = {
  h1: {
    fontSize: FontSize.header,
    fontWeight: FontWeight.bold,
  },
  h2: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.bold,
  },
  h3: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.semiBold,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
  },
  bodyLarge: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.regular,
  },
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
  },
  small: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
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
  // Lowercase exports
  colors,
  spacing,
  borderRadius,
  typography,
};
