import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_RADIUS,
  DATING_FONT_SIZE,
  DATING_LAYOUT_TOKENS as L,
} from '../../../../constants/dating';

interface BioSectionProps {
  bio: string;
  onBioUpdate: (bio: string) => void;
}

const MAX_BIO_LENGTH = 500;

export const BioSection: React.FC<BioSectionProps> = React.memo(({ bio, onBioUpdate }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Giới thiệu bản thân</Text>
        <Text style={styles.counter}>
          {bio.length} / {MAX_BIO_LENGTH}
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Bạn hãy mô tả bản thân, sở thích hoặc những gì bạn đang tìm kiếm..."
        placeholderTextColor="#CCCCCC"
        value={bio}
        onChangeText={onBioUpdate}
        maxLength={MAX_BIO_LENGTH}
        multiline
        numberOfLines={5}
      />

      <Text style={styles.hint}>
        * Luôn không được sử dụng để liên hệ hoặc email của bạn hiển thị ra công khai
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: DATING_SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DATING_SPACING.md,
  },
  title: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
  },
  counter: {
    fontSize: DATING_FONT_SIZE.small,
    color: DATING_COLORS.light.textMuted,
  },
  input: {
    borderRadius: DATING_RADIUS.md,
    borderWidth: 1,
    borderColor: DATING_COLORS.light.border,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.md,
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    minHeight: L.bioMinHeight,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: DATING_FONT_SIZE.small,
    color: DATING_COLORS.light.textMuted,
    marginTop: DATING_SPACING.xs,
    lineHeight: 18,
  },
});
