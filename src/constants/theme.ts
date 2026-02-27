// PTIT Social Theme - PTIT Red Brand Design
// Modern, clean UI with PTIT Red accent color

export const Colors = {
  // Primary - PTIT Red
  primary: '#B3261E',
  primaryDark: '#8C1D18',
  primaryLight: 'rgba(179, 38, 30, 0.08)',
  primarySoft: 'rgba(179, 38, 30, 0.05)',

  // Accent
  accent: '#B3261E',
  accentLight: 'rgba(179, 38, 30, 0.08)',

  // Core Colors
  white: '#FFFFFF',
  black: '#000000',

  // Grayscale
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  backgroundTertiary: '#F3F4F6',
  backgroundDark: '#111827',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textLight: '#FFFFFF',
  textLink: '#B3261E',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Interactions
  like: '#B3261E',
  repost: '#10B981',
  comment: '#111827',
  share: '#111827',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.04)',

  // Verified badge
  verified: '#3B82F6',

  // Online status
  online: '#10B981',
  offline: '#9CA3AF',

  // Legacy compatibility
  cardBackground: '#FFFFFF',
  inputBackground: '#F3F4F6',
  secondary: '#6B7280',
  gradientStart: '#B3261E',
  gradientMiddle: '#D32F2F',
  gradientEnd: '#E53935',
  errorLight: '#FEE2E2',

  // Text aliases
  text: '#111827',
  gray: '#6B7280',
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
  round: 9999,
};

export const FontSize = {
  xxs: 10,
  xs: 12,
  sm: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  header: 24,
  huge: 34,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
};

export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  red: {
    shadowColor: '#B3261E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const Layout = {
  screenPadding: Spacing.lg,
  inputHeight: 52,
  buttonHeight: 52,
  buttonHeightSmall: 36,
  headerHeight: 56,
  tabBarHeight: 60,
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
    xxl: 80,
    profile: 86,
  },
  buttonHeightLarge: 56,
  iconSize: {
    sm: 20,
    md: 24,
    lg: 28,
  },
  threadLineWidth: 2,
};

// Typography
export const Typography = {
  h1: {
    fontSize: FontSize.huge,
    fontWeight: FontWeight.extraBold,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    color: Colors.textTertiary,
  },
  button: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    letterSpacing: 0,
  },
  username: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  handle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    color: Colors.textSecondary,
  },
};

// Common style patterns
export const CommonStyles = {
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  screenDark: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  rowBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  threadLine: {
    width: Layout.threadLineWidth,
    backgroundColor: Colors.gray200,
  },
};

// Lowercase aliases for compatibility
export const colors = {
  ...Colors,
  text: {
    primary: Colors.textPrimary,
    secondary: Colors.textSecondary,
    tertiary: Colors.textTertiary,
    light: Colors.textLight,
    link: Colors.textLink,
    placeholder: Colors.gray400,
  },
  gray: {
    50: Colors.gray50,
    100: Colors.gray100,
    200: Colors.gray200,
    300: Colors.gray300,
    400: Colors.gray400,
    500: Colors.gray500,
    600: Colors.gray600,
    700: Colors.gray700,
    800: Colors.gray800,
    900: Colors.gray900,
  },
};
export const spacing = Spacing;
export const borderRadius = BorderRadius;
export const typography = Typography;

export default {
  Colors,
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadow,
  Layout,
  Typography,
  CommonStyles,
};
