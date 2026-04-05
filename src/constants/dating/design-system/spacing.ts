/**
 * Dating Design System - Spacing & Layout
 *
 * Hệ thống spacing và layout cho Dating module
 * Base unit: 8px
 */

import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// SPACING SCALE (8px base)
// ═══════════════════════════════════════════════════════════════

export const SPACING = {
  xxs: 4,    // Micro gaps
  xs: 8,     // Icon padding, tight gaps
  sm: 12,    // Tag padding, small gaps
  md: 16,    // Card padding, standard gaps
  lg: 24,    // Section gaps
  xl: 32,    // Screen padding
  xxl: 48,   // Major sections
  xxxl: 64,  // Hero spacing
} as const;

// ═══════════════════════════════════════════════════════════════
// RADIUS SCALE
// ═══════════════════════════════════════════════════════════════

export const RADIUS = {
  xs: 4,     // Small buttons, inputs
  sm: 8,     // Tags, chips
  md: 12,    // Input fields, small cards
  lg: 16,    // Cards, modals
  xl: 24,    // Bottom sheets
  xxl: 32,   // Large rounded elements
  full: 9999, // Circular (buttons, avatars)
} as const;

// ═══════════════════════════════════════════════════════════════
// SCREEN DIMENSIONS
// ═══════════════════════════════════════════════════════════════

export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,

  // Safe area estimates (will be overridden by SafeAreaView)
  statusBarHeight: Platform.select({
    ios: 44,
    android: StatusBar.currentHeight ?? 24,
    default: 0,
  }),

  bottomInset: Platform.select({
    ios: 34,
    android: 0,
    default: 0,
  }),
} as const;

// ═══════════════════════════════════════════════════════════════
// CARD DIMENSIONS
// ═══════════════════════════════════════════════════════════════

export const CARD = {
  // Discovery card (main swipe card)
  discovery: {
    marginHorizontal: SPACING.md,
    get width() {
      return SCREEN_WIDTH - (this.marginHorizontal * 2);
    },
    borderRadius: RADIUS.lg,
    aspectRatio: 0.75, // 3:4 portrait
  },

  // Grid card (likes screen)
  grid: {
    columns: 2,
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    get width() {
      return (SCREEN_WIDTH - (this.marginHorizontal * 2) - this.gap) / this.columns;
    },
    borderRadius: RADIUS.md,
    aspectRatio: 0.75, // 3:4 portrait
  },

  // Match card (horizontal carousel)
  match: {
    width: 100,
    height: 140,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },

  // Info card (profile sections)
  info: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// BUTTON SIZES
// ═══════════════════════════════════════════════════════════════

export const BUTTON = {
  // Action buttons (circular)
  action: {
    small: {
      size: 44,
      iconSize: 18,
    },
    medium: {
      size: 52,
      iconSize: 22,
    },
    large: {
      size: 64,
      iconSize: 28,
    },
  },

  // Standard buttons
  standard: {
    small: {
      height: 36,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.sm,
    },
    medium: {
      height: 44,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.md,
    },
    large: {
      height: 52,
      paddingHorizontal: SPACING.xl,
      borderRadius: 26, // pill shape
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// HEADER & NAVIGATION
// ═══════════════════════════════════════════════════════════════

export const HEADER = {
  height: 56,
  paddingHorizontal: SPACING.md,
  iconSize: 24,
  iconButtonSize: 40,
} as const;

export const TAB_BAR = {
  height: 80,
  paddingBottom: SPACING.xs,
  iconSize: 24,
} as const;

// ═══════════════════════════════════════════════════════════════
// ACTION BAR (swipe buttons)
// ═══════════════════════════════════════════════════════════════

export const ACTION_BAR = {
  height: 100,
  paddingHorizontal: SPACING.xl,
  paddingTop: SPACING.md,
  paddingBottom: SPACING.lg,

  // Button spacing
  gap: {
    small: SPACING.md,   // Between small and large buttons
    large: SPACING.lg,   // Between large buttons
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// CARD STACK
// ═══════════════════════════════════════════════════════════════

export const STACK = {
  visibleCards: 3,
  scaleDecrement: 0.06,  // Each card behind is 6% smaller
  yOffset: 8,            // Each card behind moves up 8px
  opacityDecrement: 0.25, // Each card behind is 25% more transparent
} as const;

// ═══════════════════════════════════════════════════════════════
// SWIPE THRESHOLDS
// ═══════════════════════════════════════════════════════════════

export const SWIPE = {
  threshold: 100,         // Minimum distance to trigger swipe
  velocityThreshold: 800, // Or minimum velocity
  maxRotation: 12,        // Maximum rotation in degrees

  // Tap zones (percentage of card width)
  tapZone: {
    left: 0.3,   // Left 30% for previous photo
    right: 0.3,  // Right 30% for next photo
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// IMAGE PAGINATION DOTS
// ═══════════════════════════════════════════════════════════════

export const PAGINATION = {
  dotSize: 6,
  dotSizeActive: 8,
  dotGap: 6,
  containerHeight: 24,
  containerPadding: SPACING.md,
} as const;

// ═══════════════════════════════════════════════════════════════
// BADGES & TAGS
// ═══════════════════════════════════════════════════════════════

export const BADGE = {
  // Online indicator
  online: {
    size: 10,
    borderWidth: 2,
  },

  // Tag chips
  tag: {
    height: 28,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },

  // Count badge
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: RADIUS.full,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// AVATAR SIZES
// ═══════════════════════════════════════════════════════════════

export const AVATAR = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  xxl: 120,
} as const;

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const Layout = {
  spacing: SPACING,
  radius: RADIUS,
  screen: SCREEN,
  card: CARD,
  button: BUTTON,
  header: HEADER,
  tabBar: TAB_BAR,
  actionBar: ACTION_BAR,
  stack: STACK,
  swipe: SWIPE,
  pagination: PAGINATION,
  badge: BADGE,
  avatar: AVATAR,
};
