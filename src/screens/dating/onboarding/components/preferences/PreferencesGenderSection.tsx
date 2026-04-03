import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { BRAND } from '../../../../../constants/dating/design-system/colors';
import type { DatingGenderPreference } from '../../../../../types/dating';

const layout = DATING_LAYOUT.preferences.gender;
const colors = DATING_COLORS.preferences;

const GENDER_OPTIONS: { value: DatingGenderPreference | null; label: string; icon: string }[] = [
  { value: null, label: 'Everyone', icon: 'people' },
  { value: 'MALE', label: 'Men', icon: 'male' },
  { value: 'FEMALE', label: 'Women', icon: 'female' },
  { value: 'OTHER', label: 'Other', icon: 'transgender' },
];

interface PreferencesGenderSectionProps {
  value: DatingGenderPreference | null;
  onChange: (value: DatingGenderPreference | null) => void;
}

export const PreferencesGenderSection: React.FC<PreferencesGenderSectionProps> = ({
  value,
  onChange,
}) => (
  <View style={styles.card}>
    <View style={styles.headerRow}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="wc" size={20} color={BRAND.primary} />
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title}>I'm interested in</Text>
        <Text style={styles.hint}>Who would you like to meet?</Text>
      </View>
    </View>
    <View style={styles.chipsRow}>
      {GENDER_OPTIONS.map((opt) => {
        const isSelected = value === opt.value;
        return (
          <Pressable
            key={opt.value ?? 'all'}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={opt.label}
          >
            <MaterialIcons
              name={opt.icon as any}
              size={18}
              color={isSelected ? '#fff' : '#666'}
            />
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
            {isSelected && (
              <View style={styles.checkWrap}>
                <MaterialIcons name="check" size={12} color={BRAND.primary} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
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
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: '#F7F7F7',
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  chipSelected: {
    backgroundColor: BRAND.primary,
    borderColor: BRAND.primary,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextSelected: {
    color: '#fff',
  },
  checkWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
