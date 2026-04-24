import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDatingTheme } from '../../../../../contexts/DatingThemeContext';

export const PreferencesPrivacyNote: React.FC = () => {
  const { theme, isDark } = useDatingTheme();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bg.card, borderColor: isDark ? theme.brand.primaryMuted : 'rgba(255, 68, 88, 0.15)' }]}>
      <LinearGradient
        colors={isDark ? ['rgba(255, 68, 88, 0.15)', 'rgba(255, 68, 88, 0.05)'] : ['rgba(255, 68, 88, 0.08)', 'rgba(255, 68, 88, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <View style={[styles.iconWrap, { backgroundColor: theme.brand.primaryMuted }]}>
        <MaterialIcons name="verified-user" size={22} color={theme.brand.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: theme.text.primary }]}>Your privacy matters</Text>
        <Text style={[styles.text, { color: theme.text.secondary }]}>
          Your preferences are private and only used to find better matches. They're never shown on your profile.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    borderRadius: 16,
    borderWidth: 1.5,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  text: {
    fontSize: 13,
    lineHeight: 19,
  },
});
