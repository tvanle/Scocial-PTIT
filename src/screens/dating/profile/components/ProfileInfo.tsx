import React, { useCallback } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_RADIUS,
  DATING_FONT_SIZE,
  DATING_LAYOUT_TOKENS as L,
} from '../../../../constants/dating';
import { RootStackParamList } from '../../../../types';

type ProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingProfile'>;

interface ProfileInfoProps {
  name: string;
  age: number;
  avatar?: string;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ name, age, avatar }) => {
  const navigation = useNavigation<ProfileNavigationProp>();

  const handleEditProfile = useCallback(() => {
    navigation.navigate('DatingEditProfile');
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]} />
        )}
      </View>

      {/* Name & Age */}
      <Text style={styles.nameAge}>
        {name}, {age}
      </Text>

      {/* Edit Button */}
      <Pressable
        style={styles.editButton}
        onPress={handleEditProfile}
      >
        <Text style={styles.editButtonText}>Chỉnh sửa hồ sơ</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: DATING_SPACING.xl,
    backgroundColor: DATING_COLORS.light.background,
  },
  avatarContainer: {
    marginBottom: DATING_SPACING.xl,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DATING_COLORS.light.border,
  },
  placeholderAvatar: {
    backgroundColor: DATING_COLORS.light.border,
  },
  nameAge: {
    fontSize: DATING_FONT_SIZE.display,
    fontWeight: '700',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.sm,
  },
  editButton: {
    marginTop: DATING_SPACING.md,
  },
  editButtonText: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.primary,
    fontWeight: '600',
  },
});
