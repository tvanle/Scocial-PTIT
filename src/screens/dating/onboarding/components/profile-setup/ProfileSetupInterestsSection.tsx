import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import type { DatingInterestOption } from '../../../../../constants/dating/interests';

interface ProfileSetupInterestsSectionProps {
  options: DatingInterestOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

const layout = DATING_LAYOUT.profileSetup.interests;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupInterestsSection: React.FC<ProfileSetupInterestsSectionProps> = ({
  options,
  selectedIds,
  onToggle,
}) => (
  <View style={[styles.section, { gap: layout.sectionGap }]}>
    <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
      {DATING_STRINGS.profileSetupInterests}
    </Text>
    <View style={[styles.chipRow, { gap: layout.chipGap }]}>
      {options.map((item) => {
        const selected = selectedIds.has(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              {
                paddingVertical: layout.chipPaddingVertical,
                paddingHorizontal: layout.chipPaddingHorizontal,
                borderRadius: layout.chipBorderRadius,
                backgroundColor: selected ? colors.chipSelectedBg : colors.chipUnselectedBg,
                borderWidth: selected ? 0 : 1,
                borderColor: colors.chipUnselectedBorder,
              },
            ]}
          >
            <MaterialIcons
              name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']}
              size={layout.chipIconSize}
              color={selected ? colors.chipSelectedText : colors.chipUnselectedText}
              style={styles.chipIcon}
            />
            <Text
              style={[
                styles.chipLabel,
                { fontSize: layout.chipFontSize },
                {
                  color: selected ? colors.chipSelectedText : colors.chipUnselectedText,
                },
                selected ? styles.chipLabelSelected : undefined,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {},
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontWeight: '500',
  },
  chipLabelSelected: {
    fontWeight: '600',
  },
});
