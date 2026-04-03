/**
 * Dating Design System - Typography
 *
 * Hệ thống typography cho Dating module
 * Sử dụng SF Pro / Inter font family
 */

import { TextStyle, Platform } from 'react-native';

// ═══════════════════════════════════════════════════════════════
// FONT FAMILIES
// ═══════════════════════════════════════════════════════════════

export const FONT_FAMILY = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
} as const;

// ═══════════════════════════════════════════════════════════════
// FONT SIZES
// ═══════════════════════════════════════════════════════════════

export const FONT_SIZE = {
  // Display
  displayLarge: 34,
  displayMedium: 28,
  displaySmall: 24,

  // Headings
  h1: 24,
  h2: 20,
  h3: 17,

  // Body
  bodyLarge: 16,
  bodyMedium: 15,
  bodySmall: 14,

  // Labels & Captions
  label: 13,
  caption: 12,
  tiny: 10,
} as const;

// ═══════════════════════════════════════════════════════════════
// LINE HEIGHTS
// ═══════════════════════════════════════════════════════════════

export const LINE_HEIGHT = {
  tight: 1.2,    // Display text
  normal: 1.4,   // Headings
  relaxed: 1.5,  // Body text
  loose: 1.6,    // Long paragraphs
} as const;

// ═══════════════════════════════════════════════════════════════
// LETTER SPACING
// ═══════════════════════════════════════════════════════════════

export const LETTER_SPACING = {
  tighter: -0.5,
  tight: -0.3,
  normal: 0,
  wide: 0.1,
  wider: 0.2,
  widest: 0.3,
} as const;

// ═══════════════════════════════════════════════════════════════
// TEXT STYLES (ready-to-use)
// ═══════════════════════════════════════════════════════════════

export const TEXT_STYLES: Record<string, TextStyle> = {
  // Display - Hero text, match screens
  displayLarge: {
    fontSize: FONT_SIZE.displayLarge,
    fontWeight: '800',
    letterSpacing: LETTER_SPACING.tighter,
    lineHeight: FONT_SIZE.displayLarge * LINE_HEIGHT.tight,
  },

  displayMedium: {
    fontSize: FONT_SIZE.displayMedium,
    fontWeight: '700',
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: FONT_SIZE.displayMedium * LINE_HEIGHT.tight,
  },

  displaySmall: {
    fontSize: FONT_SIZE.displaySmall,
    fontWeight: '700',
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: FONT_SIZE.displaySmall * LINE_HEIGHT.tight,
  },

  // Headings
  h1: {
    fontSize: FONT_SIZE.h1,
    fontWeight: '700',
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: FONT_SIZE.h1 * LINE_HEIGHT.normal,
  },

  h2: {
    fontSize: FONT_SIZE.h2,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: FONT_SIZE.h2 * LINE_HEIGHT.normal,
  },

  h3: {
    fontSize: FONT_SIZE.h3,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: FONT_SIZE.h3 * LINE_HEIGHT.normal,
  },

  // Body text
  bodyLarge: {
    fontSize: FONT_SIZE.bodyLarge,
    fontWeight: '400',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: FONT_SIZE.bodyLarge * LINE_HEIGHT.relaxed,
  },

  bodyMedium: {
    fontSize: FONT_SIZE.bodyMedium,
    fontWeight: '400',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: FONT_SIZE.bodyMedium * LINE_HEIGHT.relaxed,
  },

  bodySmall: {
    fontSize: FONT_SIZE.bodySmall,
    fontWeight: '400',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: FONT_SIZE.bodySmall * LINE_HEIGHT.relaxed,
  },

  // Labels & UI text
  label: {
    fontSize: FONT_SIZE.label,
    fontWeight: '500',
    letterSpacing: LETTER_SPACING.wide,
    lineHeight: FONT_SIZE.label * LINE_HEIGHT.normal,
  },

  labelBold: {
    fontSize: FONT_SIZE.label,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.wide,
    lineHeight: FONT_SIZE.label * LINE_HEIGHT.normal,
  },

  // Captions
  caption: {
    fontSize: FONT_SIZE.caption,
    fontWeight: '500',
    letterSpacing: LETTER_SPACING.wider,
    lineHeight: FONT_SIZE.caption * LINE_HEIGHT.normal,
  },

  // Tiny text (badges, timestamps)
  tiny: {
    fontSize: FONT_SIZE.tiny,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.widest,
    lineHeight: FONT_SIZE.tiny * LINE_HEIGHT.normal,
    textTransform: 'uppercase',
  },

  // Card-specific
  cardName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: 26,
  },

  cardAge: {
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: 26,
  },

  cardInfo: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: 20,
  },

  cardBio: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: 20,
  },

  // Tag/Chip text
  tag: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: LETTER_SPACING.wide,
    lineHeight: 16,
  },

  // Button text
  buttonLarge: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.wide,
    lineHeight: 20,
  },

  buttonMedium: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.wide,
    lineHeight: 18,
  },

  buttonSmall: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: LETTER_SPACING.wider,
    lineHeight: 16,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

export const Typography = {
  fontFamily: FONT_FAMILY,
  fontSize: FONT_SIZE,
  lineHeight: LINE_HEIGHT,
  letterSpacing: LETTER_SPACING,
  styles: TEXT_STYLES,
};
