import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

const layout = DATING_LAYOUT.preferences.distance;
const colors = DATING_COLORS.preferences;

const DISTANCE_OPTIONS: (number | null)[] = [null, 10, 25, 50, 100, 200, 500];

interface PreferencesDistanceSectionProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export const PreferencesDistanceSection: React.FC<PreferencesDistanceSectionProps> = ({
  value,
  onChange,
}) => (
  <View
    style={[
      styles.card,
      {
        padding: layout.cardPadding,
        borderRadius: layout.cardBorderRadius,
        backgroundColor: colors.cardBg,
        borderColor: colors.cardBorder,
        marginBottom: layout.cardMarginBottom,
      },
    ]}
  >
    <Text style={[styles.title, { fontSize: layout.titleFontSize, color: colors.sectionTitle }]}>
      {DATING_STRINGS.preferences.distanceLabel}
    </Text>
    <Text
      style={[
        styles.hint,
        {
          fontSize: layout.hintFontSize,
          color: colors.sectionHint,
          marginTop: layout.hintMarginTop,
          lineHeight: layout.hintLineHeight,
        },
      ]}
    >
      {DATING_STRINGS.preferences.distanceHint}
    </Text>
    <View style={[styles.chipsRow, { gap: layout.chipGap, marginTop: layout.hintMarginTop + 8 }]}>
      {DISTANCE_OPTIONS.map((km) => {
        const isSelected = value === km;
        const label = km === null ? DATING_STRINGS.preferences.distanceUnlimited : DATING_STRINGS.preferences.distanceKm(km);
        return (
          <Pressable
            key={km ?? 'unlimited'}
            style={[
              styles.chip,
              {
                paddingHorizontal: layout.chipPaddingH,
                paddingVertical: layout.chipPaddingV,
                borderRadius: layout.chipBorderRadius,
                backgroundColor: isSelected ? DATING_COLORS.primary : colors.chipUnselectedBg,
                borderWidth: 1,
                borderColor: isSelected ? DATING_COLORS.primary : colors.chipUnselectedBorder,
              },
            ]}
            onPress={() => onChange(km)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={label}
          >
            <Text
              style={[
                styles.chipText,
                {
                  fontSize: layout.chipFontSize,
                  color: isSelected ? colors.buttonText : colors.chipUnselectedText,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
  },
  hint: {},
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {},
  chipText: {},
});
