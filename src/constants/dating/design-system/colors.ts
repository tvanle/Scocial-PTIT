/**
 * Dating Design System - Colors
 *
 * Hệ thống màu sắc cho Dating module
 * Hỗ trợ cả Light và Dark theme
 */

// ═══════════════════════════════════════════════════════════════
// BRAND COLORS (fixed across themes)
// ═══════════════════════════════════════════════════════════════

export const BRAND = {
  primary: '#FF4458',      // Dating Coral - main accent
  primaryLight: '#FF6B7A', // Lighter variant
  primaryDark: '#E63946',  // Darker variant
  primaryMuted: 'rgba(255, 68, 88, 0.12)', // Background tint
} as const;

// ═══════════════════════════════════════════════════════════════
// SEMANTIC COLORS (action-based)
// ═══════════════════════════════════════════════════════════════

export const SEMANTIC = {
  // Like action (uses brand red)
  like: {
    main: '#FF4458',
    light: '#FFE4E7',
    glow: 'rgba(255, 68, 88, 0.35)',
  },

  // Nope action (grey/muted)
  nope: {
    main: '#8E8E93',
    light: '#F2F2F7',
    glow: 'rgba(142, 142, 147, 0.35)',
  },

  // Super Like action
  superLike: {
    main: '#FFB800',
    light: '#FFF8E6',
    glow: 'rgba(255, 184, 0, 0.4)',
  },

  // Boost action
  boost: {
    main: '#8B5CF6',
    light: '#EDE9FE',
    glow: 'rgba(139, 92, 246, 0.4)',
  },

  // Status indicators
  online: '#22C55E',
  verified: '#3B82F6',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

// ═══════════════════════════════════════════════════════════════
// LIGHT THEME
// ═══════════════════════════════════════════════════════════════

export const LIGHT = {
  // Backgrounds (layered depth)
  bg: {
    base: '#FFFFFF',       // Screen background
    elevated: '#FFFFFF',   // Cards, modals
    surface: '#F7F7F7',    // Secondary surfaces
    subtle: '#F0F0F0',     // Tertiary, dividers
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlay
  },

  // Text hierarchy
  text: {
    primary: '#1A1A1A',    // Headlines, important
    secondary: '#666666',  // Body text
    muted: '#999999',      // Captions, hints
    disabled: '#CCCCCC',   // Disabled state
    inverse: '#FFFFFF',    // On dark backgrounds
  },

  // Borders
  border: {
    subtle: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.1)',
    strong: 'rgba(0, 0, 0, 0.15)',
  },

  // Card specific
  card: {
    gradient: ['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)'],
    shadow: 'rgba(0, 0, 0, 0.08)',
  },

  // Button backgrounds
  button: {
    primary: BRAND.primary,
    secondary: '#F7F7F7',
    ghost: 'transparent',
  },

  // Navigation
  nav: {
    active: BRAND.primary,
    inactive: '#999999',
    background: 'rgba(255, 255, 255, 0.95)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// DARK THEME
// ═══════════════════════════════════════════════════════════════

export const DARK = {
  // Backgrounds (layered depth)
  bg: {
    base: '#0D0D0D',       // Screen background
    elevated: '#1A1A1A',   // Cards, modals
    surface: '#262626',    // Secondary surfaces
    subtle: '#333333',     // Tertiary, dividers
    overlay: 'rgba(0, 0, 0, 0.7)', // Modal overlay
  },

  // Text hierarchy
  text: {
    primary: '#FFFFFF',    // Headlines, important
    secondary: '#A3A3A3',  // Body text
    muted: '#737373',      // Captions, hints
    disabled: '#525252',   // Disabled state
    inverse: '#0D0D0D',    // On light backgrounds
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    medium: 'rgba(255, 255, 255, 0.1)',
    strong: 'rgba(255, 255, 255, 0.15)',
  },

  // Card specific
  card: {
    gradient: ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)'],
    shadow: 'rgba(0, 0, 0, 0.4)',
  },

  // Button backgrounds
  button: {
    primary: BRAND.primary,
    secondary: '#262626',
    ghost: 'transparent',
  },

  // Navigation
  nav: {
    active: BRAND.primary,
    inactive: '#737373',
    background: 'rgba(13, 13, 13, 0.95)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// SHADOWS (theme-aware)
// ═══════════════════════════════════════════════════════════════

export const SHADOWS = {
  light: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.16,
      shadowRadius: 48,
      elevation: 16,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.6,
      shadowRadius: 48,
      elevation: 16,
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTON GLOWS
// ═══════════════════════════════════════════════════════════════

export const GLOWS = {
  like: {
    shadowColor: '#FF4458',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  nope: {
    shadowColor: '#8E8E93',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  superLike: {
    shadowColor: SEMANTIC.superLike.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  boost: {
    shadowColor: SEMANTIC.boost.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// THEME HELPER
// ═══════════════════════════════════════════════════════════════

export type ThemeMode = 'light' | 'dark';

export const getThemeColors = (mode: ThemeMode) => ({
  brand: BRAND,
  semantic: SEMANTIC,
  ...(mode === 'light' ? LIGHT : DARK),
  shadows: mode === 'light' ? SHADOWS.light : SHADOWS.dark,
  glows: GLOWS,
});

// Default export for convenience (light theme)
export const Colors = {
  brand: BRAND,
  semantic: SEMANTIC,
  ...LIGHT,
  shadows: SHADOWS.light,
  glows: GLOWS,
};
