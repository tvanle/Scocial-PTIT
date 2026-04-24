import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDatingTheme } from '../../../../../contexts/DatingThemeContext';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

const DISTANCE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Anywhere' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
];

interface PreferencesDistanceSectionProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export const PreferencesDistanceSection: React.FC<PreferencesDistanceSectionProps> = ({
  value,
  onChange,
}) => {
  const { theme } = useDatingTheme();
  const selectedLabel = DISTANCE_OPTIONS.find(opt => opt.value === value)?.label ?? 'Anywhere';

  return (
    <View style={[styles.card, { backgroundColor: theme.bg.card }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.brand.primaryMuted }]}>
          <MaterialIcons name="place" size={20} color={theme.brand.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Distance</Text>
          <Text style={[styles.hint, { color: theme.text.secondary }]}>How far are you willing to travel?</Text>
        </View>
        <View style={[styles.currentValue, { backgroundColor: theme.brand.primaryMuted }]}>
          <Text style={[styles.currentValueText, { color: theme.brand.primary }]}>{selectedLabel}</Text>
        </View>
      </View>
      <View style={styles.chipsRow}>
        {DISTANCE_OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <Pressable
              key={opt.value ?? 'unlimited'}
              style={[
                styles.chip,
                { backgroundColor: theme.bg.elevated, borderColor: theme.border.light },
                isSelected && [styles.chipSelected, { backgroundColor: theme.brand.primary, borderColor: theme.brand.primary }]
              ]}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={opt.label}
            >
              {opt.value === null && (
                <MaterialIcons
                  name="public"
                  size={14}
                  color={isSelected ? '#fff' : theme.text.secondary}
                />
              )}
              <Text style={[styles.chipText, { color: theme.text.secondary }, isSelected && styles.chipTextSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  currentValue: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  currentValueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipSelected: {
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
  },
  chipTextSelected: {
    color: '#fff',
  },
});
