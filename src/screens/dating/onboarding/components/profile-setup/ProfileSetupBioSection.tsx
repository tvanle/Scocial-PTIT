import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

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
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value.length;
  const maxLength = 200;
  const isNearLimit = charCount >= maxLength * 0.8;
  const isEmpty = charCount === 0;
  const isValid = charCount >= 10;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <MaterialIcons name="edit" size={20} color={BRAND.primary} />
          <Text style={styles.sectionTitle}>About You</Text>
        </View>
        <View style={[styles.counterBadge, isNearLimit && styles.counterBadgeWarning]}>
          <Text style={[styles.counterText, isNearLimit && styles.counterTextWarning]}>
            {charCount}/{maxLength}
          </Text>
        </View>
      </View>
      <Text style={styles.sectionHint}>
        Write something interesting about yourself
      </Text>
      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
        <TextInput
          style={styles.bioInput}
          placeholder="I'm passionate about..."
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={maxLength}
          textAlignVertical="top"
        />
        {isEmpty && (
          <View style={styles.emptyHints}>
            <Text style={styles.emptyHintTitle}>Tips for a great bio:</Text>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={14} color={BRAND.primary} />
              <Text style={styles.tipText}>Share your hobbies & interests</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={14} color={BRAND.primary} />
              <Text style={styles.tipText}>Mention what makes you unique</Text>
            </View>
            <View style={styles.tipItem}>
              <MaterialIcons name="check-circle" size={14} color={BRAND.primary} />
              <Text style={styles.tipText}>Be genuine and authentic</Text>
            </View>
          </View>
        )}
      </View>
      {!isValid && charCount > 0 && (
        <View style={styles.validationHint}>
          <MaterialIcons name="info-outline" size={14} color="#FF9500" />
          <Text style={styles.validationText}>At least 10 characters required</Text>
        </View>
      )}
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
  counterBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterBadgeWarning: {
    backgroundColor: '#FFF3E0',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  counterTextWarning: {
    color: '#FF9500',
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 14,
  },
  inputWrapper: {
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: BRAND.primary,
    backgroundColor: '#fff',
  },
  bioInput: {
    minHeight: 120,
    padding: 16,
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
    ...(Platform.OS === 'android' && { paddingTop: 16 }),
  },
  emptyHints: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  emptyHintTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
  },
  validationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  validationText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '500',
  },
});
