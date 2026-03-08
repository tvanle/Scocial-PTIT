import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../types';
import { useAuthStore } from '../../../store/slices/authSlice';
import { ProfileHeader } from './components/ProfileHeader';
import { ProfileInfo } from './components/ProfileInfo';
import { MenuItem } from './components/MenuItem';
import { DATING_COLORS, DATING_SPACING } from '../../../constants/dating';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DatingProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();

  // Extract age from user (you might need to adjust based on your User model)
  const userAge = user?.birthday ? new Date().getFullYear() - parseInt(user.birthday.split('-')[0]) : 0;
  const userName = user?.fullName || 'Người dùng';

  const handleDatingProfile = useCallback(() => {
    navigation.navigate('DatingEditProfile');
  }, [navigation]);

  const handleDatingPreferences = useCallback(() => {
    navigation.navigate('DatingCriteria');
  }, [navigation]);

  const handleSettings = useCallback(() => {
    // Navigate to settings screen
    console.log('Navigate to settings');
  }, []);

  const menuItems = useMemo(
    () => [
      {
        id: 'profile',
        icon: 'heart',
        label: 'Hồ sơ hẹn hò',
        onPress: handleDatingProfile,
      },
      {
        id: 'preferences',
        icon: 'filter',
        label: 'Tiêu chí hẹn hò',
        onPress: handleDatingPreferences,
      },
      {
        id: 'settings',
        icon: 'settings',
        label: 'Cài đặt',
        onPress: handleSettings,
      },
    ],
    [handleDatingProfile, handleDatingPreferences, handleSettings]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ProfileHeader />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ProfileInfo 
          name={userName} 
          age={userAge} 
          avatar={user?.avatar}
        />

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <MenuItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DATING_COLORS.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: DATING_SPACING.xxxl,
  },
  menuContainer: {
    marginTop: DATING_SPACING.lg,
    backgroundColor: DATING_COLORS.light.background,
    overflow: 'hidden',
  },
});
