import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_FONT_SIZE,
} from '../../../../constants/dating';

interface EditProfileTabsProps {
  activeTab: 'edit' | 'preview';
  onTabChange: (tab: 'edit' | 'preview') => void;
}

export const EditProfileTabs: React.FC<EditProfileTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.tab, activeTab === 'edit' && styles.activeTab]}
        onPress={() => onTabChange('edit')}
      >
        <Text style={[styles.label, activeTab === 'edit' && styles.activeLabel]}>
          Chỉnh sửa
        </Text>
      </Pressable>

      <Pressable
        style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
        onPress={() => onTabChange('preview')}
      >
        <Text style={[styles.label, activeTab === 'preview' && styles.activeLabel]}>
          Xem trước
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
    backgroundColor: DATING_COLORS.light.background,
  },
  tab: {
    flex: 1,
    paddingVertical: DATING_SPACING.md,
    paddingHorizontal: DATING_SPACING.lg,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: DATING_COLORS.primary,
  },
  label: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textSecondary,
    fontWeight: '500',
  },
  activeLabel: {
    color: DATING_COLORS.primary,
    fontWeight: '600',
  },
});
