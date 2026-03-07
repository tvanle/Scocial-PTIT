import React from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

interface ProfileSetupBioSectionProps {
  value: string;
  onChangeText: (text: string) => void;
  counterText: string;
}

const layout = DATING_LAYOUT.profileSetup;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupBioSection: React.FC<ProfileSetupBioSectionProps> = ({
  value,
  onChangeText,
  counterText,
}) => (
  <View style={[styles.section, { gap: layout.bio.sectionGap }]}>
    <View style={styles.bioLabelRow}>
      <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
        {DATING_STRINGS.profileSetup.bio}
      </Text>
      <Text
        style={[
          styles.bioCounter,
          { fontSize: layout.bio.counterFontSize, color: colors.bioCounter },
        ]}
      >
        {counterText}
      </Text>
    </View>
    <TextInput
      style={[
        styles.bioInput,
        {
          minHeight: layout.bio.minHeight,
          padding: layout.bio.padding,
          fontSize: layout.bio.inputFontSize,
          backgroundColor: colors.inputBg,
          borderRadius: layout.photos.slotBorderRadius,
        },
      ]}
      placeholder={DATING_STRINGS.profileSetup.bioPlaceholder}
      placeholderTextColor={colors.inputPlaceholder}
      value={value}
      onChangeText={onChangeText}
      multiline
      maxLength={layout.bio.maxLength}
    />
  </View>
);

const styles = StyleSheet.create({
  section: {},
  bioLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  bioCounter: {
    fontWeight: '500',
  },
  bioInput: {
    textAlignVertical: 'top',
    ...(Platform.OS === 'android' && { paddingTop: 12 }),
  },
});
