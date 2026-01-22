// PTIT Social Theme - Threads-inspired Minimal Design
// Ultra minimalist, black & white, strong typography

export const Colors = {
  // Primary - PTIT Red (used sparingly as accent)
  primary: '#C41E3A',
  primaryDark: '#A01830',
  primaryLight: '#E8334D',

  // Core Colors - Threads Style (Black & White dominant)
  black: '#000000',
  white: '#FFFFFF',

  // Grayscale
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',

  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#FAFAFA',
  backgroundDark: '#000000',

  // Text
  textPrimary: '#000000',
  textSecondary: '#737373',
  textTertiary: '#A3A3A3',
  textLight: '#FFFFFF',
  textLink: '#000000',

  // Borders - Very subtle
  border: '#E5E5E5',
  borderLight: '#F5F5F5',
  borderDark: '#D4D4D4',

  // Status
  success: '#00BA7C',
  error: '#F4212E',
  warning: '#FFD400',
  info: '#1D9BF0',

  // Interactions
  like: '#F4212E',
  repost: '#00BA7C',
  comment: '#1D9BF0',
  share: '#00BA7C',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',

  // Verified badge
  verified: '#0095F6',

  // Online status
  online: '#00BA7C',
  offline: '#A3A3A3',

  // Legacy compatibility
  cardBackground: '#FFFFFF',
  inputBackground: '#F5F5F5',
  primarySoft: '#FEE2E2',
  secondary: '#000000',
  gradientStart: '#C41E3A',
  gradientMiddle: '#E8334D',
  gradientEnd: '#FF6B6B',
  errorLight: '#FEE2E2',
  backgroundTertiary: '#F5F5F5',

  // Text aliases
  text: '#000000',
  gray: '#737373',
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
  xl: 24,
  full: 9999,
  round: 9999,
};

export const FontSize = {
  xxs: 10,
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  header: 28,
  huge: 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
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
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
};

export const Layout = {
  screenPadding: Spacing.lg,
  inputHeight: 48,
  buttonHeight: 48,
  buttonHeightSmall: 36,
  headerHeight: 52,
  tabBarHeight: 50,
  avatarSize: {
    xs: 20,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
    xxl: 80,
    profile: 100,
  },
  buttonHeightLarge: 56,
  iconSize: {
    sm: 20,
    md: 24,
    lg: 28,
  },
  // Thread line
  threadLineWidth: 2,
};

// Threads-style typography
export const Typography = {
  // Headlines
  h1: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
    color: Colors.textPrimary,
  },
  h2: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.3,
    color: Colors.textPrimary,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  // Body
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: 22,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: 18,
    color: Colors.textPrimary,
  },
  // UI
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
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    letterSpacing: 0.2,
  },
  // Username
  username: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
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
  // Thread connection line (like Threads app)
  threadLine: {
    width: Layout.threadLineWidth,
    backgroundColor: Colors.gray200,
  },
};

// Lowercase aliases for compatibility (nested structure for legacy code)
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
