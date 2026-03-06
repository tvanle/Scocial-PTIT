import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

const layout = DATING_LAYOUT.preferences.privacy;
const colors = DATING_COLORS.preferences;

export const PreferencesPrivacyNote: React.FC = () => (
  <View
    style={[
      styles.wrapper,
      {
        padding: layout.padding,
        borderRadius: layout.borderRadius,
        backgroundColor: colors.privacyBg,
        borderColor: colors.privacyBorder,
      },
    ]}
  >
    <MaterialIcons name="shield" size={layout.iconSize} color={colors.privacyIcon} style={styles.icon} />
    <Text style={[styles.text, { fontSize: layout.textFontSize, color: colors.privacyText }]}>
      <Text style={styles.bold}>{DATING_STRINGS.preferencesPrivacyTitle}</Text>{' '}
      {DATING_STRINGS.preferencesPrivacyBody}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: layout.contentGap,
    borderWidth: 1,
  },
  icon: {
    marginTop: layout.iconMarginTop,
  },
  text: {
    flex: 1,
    lineHeight: layout.textLineHeight,
  },
  bold: {
    fontWeight: '700',
  },
});
