// PTIT Social Theme - Threads-inspired Design
// Minimalist black & white, modern typography

export const Colors = {
  // Primary - Black (Threads style)
  primary: '#000000',
  primaryDark: '#000000',
  primaryLight: '#262626',
  primarySoft: '#F5F5F5',

  // Accent - Black (Threads style)
  accent: '#000000',
  accentLight: '#F5F5F5',

  // Core Colors
  white: '#FFFFFF',
  black: '#000000',

  // Grayscale
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EFEFEF',
  gray300: '#DBDBDB',
  gray400: '#A8A8A8',
  gray500: '#737373',
  gray600: '#545454',
  gray700: '#363636',
  gray800: '#262626',
  gray900: '#171717',

  // Background
  background: '#FFFFFF',
  backgroundSecondary: '#FAFAFA',
  backgroundTertiary: '#F5F5F5',
  backgroundDark: '#000000',

  // Text
  textPrimary: '#000000',
  textSecondary: '#737373',
  textTertiary: '#A8A8A8',
  textLight: '#FFFFFF',
  textLink: '#000000',

  // Borders
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  borderDark: '#C7C7C7',

  // Status
  success: '#00BA7C',
  error: '#FF3040',
  warning: '#FFD400',
  info: '#1D9BF0',

  // Interactions (Threads style)
  like: '#FF3040',
  repost: '#00BA7C',
  comment: '#000000',
  share: '#000000',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.05)',

  // Verified badge (blue check like Threads)
  verified: '#0095F6',

  // Online status
  online: '#00BA7C',
  offline: '#A8A8A8',

  // Legacy compatibility
  cardBackground: '#FFFFFF',
  inputBackground: '#FAFAFA',
  secondary: '#737373',
  gradientStart: '#000000',
  gradientMiddle: '#262626',
  gradientEnd: '#404040',
  errorLight: '#FFEBE9',

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
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const Layout = {
  screenPadding: Spacing.lg,
  inputHeight: 44,
  buttonHeight: 44,
  buttonHeightSmall: 34,
  headerHeight: 44,
  tabBarHeight: 49,
  avatarSize: {
    xs: 24,
    sm: 32,
    md: 36,
    lg: 44,
    xl: 56,
    xxl: 77,
    profile: 86,
  },
  buttonHeightLarge: 50,
  iconSize: {
    sm: 20,
    md: 24,
    lg: 26,
  },
  threadLineWidth: 2,
};

// Threads-style typography
export const Typography = {
  // Headlines
  h1: {
    fontSize: FontSize.huge,
    fontWeight: FontWeight.bold,
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
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  // Body
  body: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.regular,
    lineHeight: 20,
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
    letterSpacing: 0,
  },
  // Username (Threads style - bold)
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
    height: 0.5,
    backgroundColor: Colors.border,
  },
  // Thread connection line
  threadLine: {
    width: Layout.threadLineWidth,
    backgroundColor: Colors.gray300,
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
