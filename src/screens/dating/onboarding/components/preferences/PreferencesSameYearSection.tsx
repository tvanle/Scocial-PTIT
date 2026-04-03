import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

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
  <View style={styles.card}>
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <MaterialIcons name="school" size={20} color={BRAND.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>Same year students</Text>
        <Text style={styles.hint}>Only show people from your enrollment year</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: BRAND.primary }}
        thumbColor="#fff"
        ios_backgroundColor="#E0E0E0"
        accessibilityLabel="Same year only"
      />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
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
});
