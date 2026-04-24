import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDatingTheme } from '../../../../../contexts/DatingThemeContext';

interface PreferencesSameYearSectionProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export const PreferencesSameYearSection: React.FC<PreferencesSameYearSectionProps> = ({
  value,
  onValueChange,
}) => {
  const { theme } = useDatingTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.bg.card }]}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: theme.brand.primaryMuted }]}>
          <MaterialIcons name="school" size={20} color={theme.brand.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Same year students</Text>
          <Text style={[styles.hint, { color: theme.text.secondary }]}>Only show people from your enrollment year</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.border.light, true: theme.brand.primary }}
          thumbColor="#fff"
          ios_backgroundColor={theme.border.light}
          accessibilityLabel="Same year only"
        />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
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
});
