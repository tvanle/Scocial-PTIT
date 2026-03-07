import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_LAYOUT_TOKENS as L,
} from '../../../../constants/dating';

export const ProfileHeader: React.FC = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <Pressable onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={L.backIconSize} color={DATING_COLORS.light.textPrimary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.md,
    backgroundColor: DATING_COLORS.light.background,
  },
});
