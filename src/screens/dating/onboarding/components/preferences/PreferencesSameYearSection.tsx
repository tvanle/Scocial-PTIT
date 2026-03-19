import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

const layout = DATING_LAYOUT.preferences.sameYear;
const colors = DATING_COLORS.preferences;

interface PreferencesSameYearSectionProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const PreferencesSameYearSection: React.FC<PreferencesSameYearSectionProps> = ({
  value,
  onValueChange,
}) => (
  <View
    style={[
      styles.card,
      {
        padding: layout.cardPadding,
        borderRadius: layout.cardBorderRadius,
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
      },
    ]}
  >
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { fontSize: layout.titleFontSize, color: colors.sectionTitle }]}>
          {DATING_STRINGS.preferences.sameYearOnly}
        </Text>
        <Text style={[styles.hint, { fontSize: layout.hintFontSize, color: colors.sectionHint }]}>
          {DATING_STRINGS.preferences.sameYearHint}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.toggleTrack, true: DATING_COLORS.primary }}
        thumbColor={colors.toggleThumb}
        accessibilityLabel={DATING_STRINGS.preferences.sameYearOnly}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    marginBottom: layout.cardMarginBottom,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textWrap: {
    flex: 1,
    paddingRight: layout.textWrapPaddingRight,
  },
  title: {
    fontWeight: '700',
  },
  hint: {
    marginTop: layout.hintMarginTop,
    lineHeight: layout.hintLineHeight,
  },
});
