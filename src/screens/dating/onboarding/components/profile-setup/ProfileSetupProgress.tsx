import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

interface ProfileSetupProgressProps {
  progressPercent: number;
}

const layout = DATING_LAYOUT.profileSetup.progress;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupProgress: React.FC<ProfileSetupProgressProps> = ({ progressPercent }) => (
  <View
    style={[
      styles.progressSection,
      {
        paddingHorizontal: layout.paddingHorizontal,
        paddingTop: layout.paddingTop,
        paddingBottom: layout.paddingBottom,
      },
    ]}
  >
    <View style={styles.progressRow}>
      <Text style={[styles.progressStepTitle, { fontSize: layout.stepTitleFontSize }]}>
        {DATING_STRINGS.profileSetupAboutYou}
      </Text>
      <Text
        style={[
          styles.progressStepLabel,
          { fontSize: layout.stepLabelFontSize, color: colors.stepLabel },
        ]}
      >
        {DATING_STRINGS.profileSetupStep2Of3}
      </Text>
    </View>
    <View
      style={[
        styles.progressBarTrack,
        {
          height: layout.barHeight,
          borderRadius: layout.barBorderRadius,
          backgroundColor: colors.photoSlotBg,
        },
      ]}
    >
      <View
        style={[
          styles.progressBarFill,
          {
            height: layout.barHeight,
            borderRadius: layout.barBorderRadius,
            width: `${progressPercent}%`,
            backgroundColor: DATING_COLORS.primary,
          },
        ]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  progressSection: {},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  progressStepTitle: {
    fontWeight: '700',
    color: colors.headerTitle,
  },
  progressStepLabel: {
    fontWeight: '500',
  },
  progressBarTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {},
});
