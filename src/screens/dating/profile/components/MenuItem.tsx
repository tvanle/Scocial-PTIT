import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_RADIUS,
  DATING_FONT_SIZE,
} from '../../../../constants/dating';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress }) => {
  const handlePress = useCallback(onPress, [onPress]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon as any}
          size={24}
          color={DATING_COLORS.primary}
        />
      </View>

      <Text style={styles.label}>{label}</Text>

      <Ionicons
        name="chevron-forward"
        size={20}
        color={DATING_COLORS.light.textSecondary}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.lg,
    backgroundColor: DATING_COLORS.light.background,
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
  },
  pressed: {
    backgroundColor: DATING_COLORS.light.background,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE6E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DATING_SPACING.lg,
  },
  label: {
    flex: 1,
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '500',
    color: DATING_COLORS.light.textPrimary,
  },
});
