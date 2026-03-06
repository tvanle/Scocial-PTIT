import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

interface PreferencesHeaderProps {
  onBack: () => void;
}

const layout = DATING_LAYOUT.preferences.header;
const colors = DATING_COLORS.preferences;

export const PreferencesHeader: React.FC<PreferencesHeaderProps> = ({ onBack }) => (
  <View style={[styles.wrapper, { paddingHorizontal: layout.paddingHorizontal }]}>
    <View style={styles.row}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} accessibilityRole="button">
        <MaterialIcons
          name="arrow-back-ios"
          size={layout.backIconSize}
          color={colors.headerTitle}
        />
      </TouchableOpacity>
      <View style={styles.center}>
        <Text style={[styles.stepLabel, { fontSize: layout.stepLabelFontSize, color: colors.stepLabel }]}>
          {DATING_STRINGS.preferencesStep3Of3}
        </Text>
        <Text style={[styles.title, { fontSize: layout.titleFontSize, color: colors.headerTitle }]}>
          {DATING_STRINGS.preferencesTitle}
        </Text>
      </View>
      <View style={styles.placeholder} />
    </View>
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
            backgroundColor: DATING_COLORS.primary,
          },
        ]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
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
    alignItems: 'center',
  },
  stepLabel: {
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontWeight: '800',
    marginTop: layout.titleMarginTop,
  },
  placeholder: {
    width: layout.placeholderWidth,
  },
  progressTrack: {
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
  },
});
