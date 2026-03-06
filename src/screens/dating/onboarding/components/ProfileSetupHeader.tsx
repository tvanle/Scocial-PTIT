import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';

interface ProfileSetupHeaderProps {
  onBack: () => void;
}

const layout = DATING_LAYOUT.profileSetup.header;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupHeader: React.FC<ProfileSetupHeaderProps> = ({ onBack }) => (
  <View style={[styles.header, { paddingHorizontal: layout.paddingHorizontal }]}>
    <TouchableOpacity
      onPress={onBack}
      style={styles.backButton}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <MaterialIcons name="arrow-back-ios" size={20} color={colors.headerTitle} />
    </TouchableOpacity>
    <Text style={[styles.headerTitle, { fontSize: layout.titleFontSize }]}>
      {DATING_STRINGS.profileSetupTitle}
    </Text>
    <View style={styles.headerRight} />
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontWeight: '700',
    color: colors.headerTitle,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
});
