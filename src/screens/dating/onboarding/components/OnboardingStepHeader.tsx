import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';

const layout = DATING_LAYOUT.onboardingStepHeader;
const colors = DATING_COLORS.preferences;

export interface OnboardingStepHeaderProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  /** Step 1 dùng title lớn (intro), step 2/3 dùng title nhỏ hơn */
  titleSize?: 'large' | 'normal';
  /** Ẩn text "Bước X/Y" và thanh progress khi dùng lại header ngoài flow onboarding */
  hideProgress?: boolean;
  /** Nút action nhỏ ở góc phải (ví dụ: Xem trước) */
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
          <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
            <MaterialIcons
              name="arrow-back-ios"
              size={layout.backIconSize}
              color={colors.headerTitle}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.center}>
          {!hideProgress && (
            <Text
              style={[
                styles.stepLabel,
                {
                  fontSize: layout.stepLabelFontSize,
                  letterSpacing: layout.stepLabelLetterSpacing,
                  color: colors.stepLabel,
                },
              ]}
            >
              {stepLabel}
            </Text>
          )}
          {title ? (
            <Text
              style={[
                styles.title,
                { fontSize: titleFontSize, color: colors.headerTitle, marginTop: layout.titleMarginTop },
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
          >
            <Text style={styles.rightActionText}>{rightActionLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      {!hideProgress && (
        <View
          style={[
            styles.progressTrack,
            {
              height: layout.progressBarHeight,
              borderRadius: layout.progressBarBorderRadius,
              backgroundColor: colors.trackBg,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                height: layout.progressBarHeight,
                borderRadius: layout.progressBarBorderRadius,
                width: `${progressPercent}%`,
                backgroundColor: DATING_COLORS.primary,
              },
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: layout.paddingHorizontal,
    paddingTop: layout.paddingTop,
    paddingBottom: layout.paddingBottom,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: layout.rowMarginBottom,
  },
  backBtn: {
    padding: layout.backBtnPadding,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: layout.centerPaddingHorizontal,
  },
  placeholder: {
    width: layout.placeholderWidth,
  },
  rightActionBtn: {
    paddingHorizontal: layout.backBtnPadding,
    paddingVertical: layout.backBtnPadding / 2,
  },
  rightActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: DATING_COLORS.primary,
  },
  stepLabel: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '800',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {},
});
