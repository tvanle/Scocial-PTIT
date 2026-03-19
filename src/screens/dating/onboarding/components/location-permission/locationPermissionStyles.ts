import { StyleSheet } from 'react-native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { LOCATION_PERMISSION_LAYOUT as LAYOUT } from './constants';

const colors = DATING_COLORS.onboarding;
const prefs = DATING_COLORS.preferences;
const { illustration, typography, nextButton } = DATING_LAYOUT;
const spacing = DATING_LAYOUT.spacing;

export const locationPermissionStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: LAYOUT.header.paddingVertical,
    paddingBottom: LAYOUT.header.paddingBottom,
  },
  backBtn: {
    width: LAYOUT.header.backButtonSize,
    height: LAYOUT.header.backButtonSize,
    borderRadius: LAYOUT.header.backButtonSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: prefs.headerTitle,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  headerPlaceholder: {
    width: LAYOUT.header.backButtonSize,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  illustrationCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: illustration.borderRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircleOuter: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.decorCirclePrimary,
    borderRadius: 9999,
    transform: [{ scale: LAYOUT.illustration.decorCircleScaleOuter }],
  },
  decorCircleInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.decorCircleSecondary,
    borderRadius: 9999,
    transform: [{ scale: LAYOUT.illustration.decorCircleScaleInner }],
    opacity: LAYOUT.illustration.decorCircleInnerOpacity,
  },
  illustrationCenter: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIconCircle: {
    width: LAYOUT.illustration.mainCircleSize,
    height: LAYOUT.illustration.mainCircleSize,
    borderRadius: LAYOUT.illustration.mainCircleSize / 2,
    backgroundColor: colors.illustrationOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIcon: {
    position: 'absolute',
    backgroundColor: prefs.background,
    padding: LAYOUT.illustration.floatingIconPadding,
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: LAYOUT.illustration.floatingIconShadowOffsetY },
    shadowOpacity: LAYOUT.illustration.floatingIconShadowOpacity,
    shadowRadius: LAYOUT.illustration.floatingIconShadowRadius,
    elevation: LAYOUT.illustration.floatingIconElevation,
  },
  floatingTopRight: {
    top: '10%',
    right: '10%',
  },
  floatingBottomLeft: {
    bottom: '15%',
    left: '8%',
  },
  contentBlock: {
    paddingHorizontal: LAYOUT.content.contentPaddingHorizontal,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.title,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: LAYOUT.content.titleMarginBottom,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.description,
    textAlign: 'center',
    lineHeight: typography.descriptionLineHeight,
    paddingHorizontal: LAYOUT.content.contentPaddingHorizontal,
  },
  actions: {
    paddingBottom: LAYOUT.actions.paddingBottom,
    gap: LAYOUT.actions.gap,
    maxWidth: LAYOUT.actions.maxWidth,
    alignSelf: 'center',
    width: '100%',
  },
  primaryButton: {
    height: nextButton.height,
    borderRadius: nextButton.borderRadius,
    backgroundColor: DATING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nextButton.paddingHorizontal,
    shadowColor: DATING_COLORS.primary,
    shadowOffset: { width: 0, height: nextButton.shadowOffsetY },
    shadowOpacity: nextButton.shadowOpacity,
    shadowRadius: nextButton.shadowRadius,
    elevation: nextButton.elevation,
  },
  primaryButtonText: {
    fontSize: typography.buttonFontSize,
    fontWeight: '700',
    letterSpacing: typography.buttonLetterSpacing,
    color: colors.buttonText,
  },
  secondaryButton: {
    height: nextButton.height,
    borderRadius: nextButton.borderRadius,
    backgroundColor: prefs.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.buttonFontSize,
    fontWeight: '700',
    color: prefs.sectionHint,
  },
});
