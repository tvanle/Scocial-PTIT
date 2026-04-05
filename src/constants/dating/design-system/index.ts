/**
 * Dating Design System - Main Export
 *
 * Single entry point cho toàn bộ Design System
 */

// Colors
export {
  BRAND,
  SEMANTIC,
  LIGHT,
  DARK,
  SHADOWS,
  GLOWS,
  Colors,
  getThemeColors,
  type ThemeMode,
} from './colors';

// Typography
export {
  FONT_FAMILY,
  FONT_SIZE,
  LINE_HEIGHT,
  LETTER_SPACING,
  TEXT_STYLES,
  Typography,
} from './typography';

// Spacing & Layout
export {
  SPACING,
  RADIUS,
  SCREEN,
  CARD,
  BUTTON,
  HEADER,
  TAB_BAR,
  ACTION_BAR,
  STACK,
  SWIPE,
  PAGINATION,
  BADGE,
  AVATAR,
  Layout,
} from './spacing';

// Animations
export {
  DURATION,
  EASING,
  SPRING,
  CARD_STACK,
  BUTTON_ANIM,
  MICRO,
  MATCH_CELEBRATION,
  HAPTIC,
  TRANSITIONS,
  Animations,
} from './animations';

// ═══════════════════════════════════════════════════════════════
// UNIFIED DESIGN SYSTEM OBJECT
// ═══════════════════════════════════════════════════════════════

import { Colors } from './colors';
import { Typography } from './typography';
import { Layout } from './spacing';
import { Animations } from './animations';

export const DatingDS = {
  colors: Colors,
  typography: Typography,
  layout: Layout,
  animations: Animations,
} as const;

export default DatingDS;
