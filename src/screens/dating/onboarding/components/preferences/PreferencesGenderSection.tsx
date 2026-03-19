import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import type { DatingGenderPreference } from '../../../../../types/dating';

const layout = DATING_LAYOUT.preferences.gender;
const colors = DATING_COLORS.preferences;

const GENDER_LABELS: Record<DatingGenderPreference | 'all', string> = {
  all: DATING_STRINGS.preferences.genderAll,
  MALE: DATING_STRINGS.preferences.genderMale,
  FEMALE: DATING_STRINGS.preferences.genderFemale,
  OTHER: DATING_STRINGS.preferences.genderOther,
};

const OPTIONS: { value: DatingGenderPreference | null }[] = [
  { value: null },
  { value: 'MALE' },
  { value: 'FEMALE' },
  { value: 'OTHER' },
];

interface PreferencesGenderSectionProps {
  value: DatingGenderPreference | null;
  onChange: (value: DatingGenderPreference | null) => void;
}

export const PreferencesGenderSection: React.FC<PreferencesGenderSectionProps> = ({
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
      {DATING_STRINGS.preferences.genderLabel}
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
      {DATING_STRINGS.preferences.genderHint}
    </Text>
    <View style={[styles.chipsRow, { gap: layout.chipGap, marginTop: layout.hintMarginTop + 8 }]}>
      {OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        const label = opt.value === null ? GENDER_LABELS.all : GENDER_LABELS[opt.value];
        return (
          <Pressable
            key={opt.value ?? 'all'}
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
            onPress={() => onChange(opt.value)}
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
