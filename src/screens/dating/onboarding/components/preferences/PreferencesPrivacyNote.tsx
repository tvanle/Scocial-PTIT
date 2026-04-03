import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

const layout = DATING_LAYOUT.preferences.privacy;
const colors = DATING_COLORS.preferences;

export const PreferencesPrivacyNote: React.FC = () => (
  <View style={styles.wrapper}>
    <LinearGradient
      colors={['rgba(255, 68, 88, 0.08)', 'rgba(255, 68, 88, 0.03)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    />
    <View style={styles.iconWrap}>
      <MaterialIcons name="verified-user" size={22} color={BRAND.primary} />
    </View>
    <View style={styles.textWrap}>
      <Text style={styles.title}>Your privacy matters</Text>
      <Text style={styles.text}>
        Your preferences are private and only used to find better matches. They're never shown on your profile.
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 68, 88, 0.15)',
    backgroundColor: '#fff',
    marginBottom: 100,
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BRAND.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    color: '#666',
    lineHeight: 19,
  },
});
