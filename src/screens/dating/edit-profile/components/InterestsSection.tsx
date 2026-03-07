import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_RADIUS,
  DATING_FONT_SIZE,
} from '../../../../constants/dating';

interface InterestsSectionProps {
  interests: string[];
  onUpdate: (interests: string[]) => void;
}

const AVAILABLE_INTERESTS = [
  'Bóng đá',
  'Nghề mĩ',
  'Du lịch',
  'Lập trình',
  'Chụp ảnh',
  'Nấu ăn',
  'Âm nhạc',
  'Đọc sách',
];

export const InterestsSection: React.FC<InterestsSectionProps> = React.memo(
  ({ interests, onUpdate }) => {
    const handleToggleInterest = useCallback(
      (interest: string) => {
        if (interests.includes(interest)) {
          onUpdate(interests.filter((i) => i !== interest));
        } else {
          onUpdate([...interests, interest]);
        }
      },
      [interests, onUpdate]
    );

    const renderChip = ({ item }: { item: string }) => {
      const isSelected = interests.includes(item);

      return (
        <Pressable
          style={[
            styles.chip,
            isSelected && styles.chipSelected,
          ]}
          onPress={() => handleToggleInterest(item)}
        >
          <Text style={[styles.chipText, isSelected && styles.chipSelectedText]}>
            {item}
          </Text>
          {isSelected && (
            <Ionicons
              name="close"
              size={14}
              color="#FFFFFF"
              style={{ marginLeft: DATING_SPACING.xs }}
            />
          )}
        </Pressable>
      );
    };

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Số thích</Text>

        <FlatList
          data={AVAILABLE_INTERESTS}
          renderItem={renderChip}
          keyExtractor={(item) => item}
          scrollEnabled={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.contentContainer}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: DATING_SPACING.xl,
  },
  title: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.md,
  },
  contentContainer: {
    paddingHorizontal: 0,
  },
  columnWrapper: {
    gap: DATING_SPACING.md,
    marginBottom: DATING_SPACING.md,
  },
  chip: {
    flex: 1,
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.sm,
    borderRadius: DATING_RADIUS.full,
    borderWidth: 1,
    borderColor: DATING_COLORS.light.border,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  chipSelected: {
    backgroundColor: DATING_COLORS.primary,
    borderColor: DATING_COLORS.primary,
  },
  chipText: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    fontWeight: '500',
  },
  chipSelectedText: {
    color: '#FFFFFF',
  },
});
