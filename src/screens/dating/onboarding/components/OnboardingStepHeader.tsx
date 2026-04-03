import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';
import { BRAND } from '../../../../constants/dating/design-system/colors';

const layout = DATING_LAYOUT.onboardingStepHeader;
const colors = DATING_COLORS.preferences;

export interface OnboardingStepHeaderProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  titleSize?: 'large' | 'normal';
  hideProgress?: boolean;
  rightActionLabel?: string;
  onRightAction?: () => void;
}

export const OnboardingStepHeader: React.FC<OnboardingStepHeaderProps> = ({
  stepIndex,
  totalSteps,
  title,
  showBackButton = false,
  onBack,
  titleSize = 'normal',
  hideProgress = false,
  rightActionLabel,
  onRightAction,
}) => {
  const progressPercent = totalSteps > 0 ? (stepIndex / totalSteps) * 100 : 0;
  const stepLabel = DATING_STRINGS.onboarding.stepLabel(stepIndex, totalSteps);
  const titleFontSize = titleSize === 'large' ? layout.titleFontSizeLarge : layout.titleFontSize;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {showBackButton && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backBtn}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <View style={styles.backBtnInner}>
              <MaterialIcons
                name="arrow-back-ios"
                size={layout.backIconSize}
                color={BRAND.primary}
              />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.center}>
          {!hideProgress && (
            <View style={styles.stepBadge}>
              <Text style={styles.stepLabel}>
                {stepLabel}
              </Text>
            </View>
          )}
          {title ? (
            <Text
              style={[
                styles.title,
                { fontSize: titleFontSize, color: colors.headerTitle, marginTop: hideProgress ? 0 : 12 },
              ]}
              numberOfLines={2}
            >
              {title}
            </Text>
          ) : null}
        </View>
        {rightActionLabel && onRightAction ? (
          <TouchableOpacity
            onPress={onRightAction}
            style={styles.rightActionBtn}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={styles.rightActionText}>{rightActionLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      {!hideProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[BRAND.primary, BRAND.primaryLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <View style={styles.progressDots}>
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressDot,
                  step <= stepIndex && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: layout.paddingHorizontal,
    paddingTop: 16,
    paddingBottom: layout.paddingBottom,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
  },
  backBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 88, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  placeholder: {
    width: 48,
  },
  rightActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 68, 88, 0.08)',
    borderRadius: 20,
  },
  rightActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND.primary,
  },
  stepBadge: {
    backgroundColor: BRAND.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: BRAND.primary,
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  progressContainer: {
    gap: 12,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 68, 88, 0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 68, 88, 0.15)',
  },
  progressDotActive: {
    backgroundColor: BRAND.primary,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
