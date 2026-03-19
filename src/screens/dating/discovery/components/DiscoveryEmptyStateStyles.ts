import { StyleSheet } from 'react-native';
import { DATING_COLORS } from '../../../../constants/dating/theme';
import { DATING_SPACING } from '../../../../constants/dating/tokens';

const colors = DATING_COLORS.discovery;

export const EMPTY_STATE_LAYOUT = {
  illustrationSize: 256,
  illustrationIconSize: 120,
  glowPadding: 32,
  illustrationMarginBottom: 40,
  textBlockMaxWidth: 320,
  textBlockGap: 16,
  titleFontSize: 24,
  titleLetterSpacing: -0.5,
  subtitleFontSize: 16,
  subtitleLineHeight: 24,
  actionsGap: 12,
  primaryBtnHeight: 56,
  primaryBtnPaddingH: 20,
  shadowOffsetY: 4,
  shadowOpacity: 0.2,
  shadowRadius: 12,
  elevation: 4,
  handleBarWidth: 128,
  handleBarHeight: 4,
  handleBarRadius: 2,
  handleBarMarginBottom: 8,
  glowOpacity: 0.06,
  iconCircleOpacityHex: '14',
} as const;

const L = EMPTY_STATE_LAYOUT;
const glowSize = L.illustrationSize + L.glowPadding;

export const discoveryEmptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DATING_SPACING.lg,
    justifyContent: 'space-between',
    paddingBottom: DATING_SPACING.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    marginBottom: L.illustrationMarginBottom,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: glowSize,
    height: glowSize,
    borderRadius: glowSize / 2,
    backgroundColor: DATING_COLORS.primary,
    opacity: L.glowOpacity,
  },
  iconCircle: {
    width: L.illustrationSize,
    height: L.illustrationSize,
    borderRadius: L.illustrationSize / 2,
    backgroundColor: `${DATING_COLORS.primary}${L.iconCircleOpacityHex}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    maxWidth: L.textBlockMaxWidth,
    gap: L.textBlockGap,
    alignItems: 'center',
  },
  title: {
    fontSize: L.titleFontSize,
    fontWeight: '800',
    letterSpacing: L.titleLetterSpacing,
    color: colors.emptyTitle,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: L.subtitleFontSize,
    fontWeight: '400',
    lineHeight: L.subtitleLineHeight,
    color: colors.emptySubtitle,
    textAlign: 'center',
  },
  actions: {
    gap: L.actionsGap,
    paddingBottom: DATING_SPACING.lg,
  },
  primaryBtn: {
    height: L.primaryBtnHeight,
    borderRadius: L.primaryBtnHeight / 2,
    backgroundColor: DATING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: L.primaryBtnPaddingH,
    shadowColor: DATING_COLORS.primary,
    shadowOffset: { width: 0, height: L.shadowOffsetY },
    shadowOpacity: L.shadowOpacity,
    shadowRadius: L.shadowRadius,
    elevation: L.elevation,
  },
  primaryBtnPressed: {
    opacity: 0.9,
  },
  primaryBtnText: {
    fontSize: L.subtitleFontSize,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: DATING_COLORS.onboarding.buttonText,
  },
  handleBar: {
    width: L.handleBarWidth,
    height: L.handleBarHeight,
    borderRadius: L.handleBarRadius,
    backgroundColor: colors.cardBorder,
    alignSelf: 'center',
    marginBottom: L.handleBarMarginBottom,
  },
});
