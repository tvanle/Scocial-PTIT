import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import type { DatingInterestOption } from '../../../../../constants/dating';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

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
}) => {
  const selectedCount = selectedIds.size;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialIcons name="interests" size={20} color={BRAND.primary} />
          <Text style={styles.sectionTitle}>Interests</Text>
        </View>
        <View style={[styles.countBadge, selectedCount > 0 && styles.countBadgeActive]}>
          <Text style={[styles.countText, selectedCount > 0 && styles.countTextActive]}>
            {selectedCount} selected
          </Text>
        </View>
      </View>
      <Text style={styles.sectionHint}>
        Select your interests to find people with similar hobbies
      </Text>
      <View style={styles.chipRow}>
        {options.map((item) => {
          const selected = selectedIds.has(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onToggle(item.id)}
              activeOpacity={0.7}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <View style={[styles.chipIconWrap, selected && styles.chipIconWrapSelected]}>
                <MaterialIcons
                  name={item.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                  size={16}
                  color={selected ? '#fff' : BRAND.primary}
                />
              </View>
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {item.label}
              </Text>
              {selected && (
                <MaterialIcons name="check-circle" size={16} color={BRAND.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeActive: {
    backgroundColor: BRAND.primaryMuted,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  countTextActive: {
    color: BRAND.primary,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  chipSelected: {
    backgroundColor: BRAND.primaryMuted,
    borderColor: BRAND.primary,
  },
  chipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 68, 88, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconWrapSelected: {
    backgroundColor: BRAND.primary,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  chipLabelSelected: {
    color: BRAND.primary,
    fontWeight: '600',
  },
});
