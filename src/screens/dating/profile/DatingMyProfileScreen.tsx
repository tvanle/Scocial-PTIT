/**
 * Dating My Profile Screen
 *
 * User's dating profile with photo grid and settings
 * Using new dating design system
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  DURATION,
  SPRING,
  AVATAR,
} from '../../../constants/dating/design-system';
import { calculateAge } from '../../../utils/dating';
import datingService from '../../../services/dating/datingService';
import type { RootStackParamList } from '../../../types';
import type { DatingPhoto, DatingProfile } from '../../../types/dating';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ═══════════════════════════════════════════════════════════════
// MENU ITEM
// ═══════════════════════════════════════════════════════════════

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  index: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, danger, index }) => {
  const { theme } = useDatingTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, SPRING.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.snappy);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconColor = danger ? theme.semantic.error : theme.brand.primary;
  const bgColor = danger ? 'rgba(239, 68, 68, 0.08)' : theme.brand.primaryMuted;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(DURATION.normal)}
      style={animatedStyle}
    >
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: theme.bg.surface }]}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <View style={[styles.menuIconWrap, { backgroundColor: bgColor }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={iconColor} />
        </View>
        <Text style={[styles.menuLabel, { color: danger ? theme.semantic.error : theme.text.primary }]}>
          {label}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.text.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT ITEM
// ═══════════════════════════════════════════════════════════════

interface StatItemProps {
  icon: string;
  value: string | number;
  label: string;
  index: number;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, index }) => {
  const { theme } = useDatingTheme();

  return (
    <Animated.View
      entering={FadeIn.delay(index * 100).duration(DURATION.normal)}
      style={[styles.statItem, { backgroundColor: theme.bg.surface }]}
    >
      <MaterialCommunityIcons name={icon as any} size={20} color={theme.brand.primary} />
      <Text style={[styles.statValue, { color: theme.text.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.text.muted }]}>{label}</Text>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

const MyProfileInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useDatingTheme();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ['dating', 'me'],
    queryFn: () => datingService.getMyProfile(),
  });

  const addPhotoMutation = useMutation({
    mutationFn: async (uri: string) => {
      const url = await datingService.uploadMedia(uri);
      const current = queryClient.getQueryData<DatingProfile | undefined>(['dating', 'me']);
      const maxOrder = current?.photos?.reduce<number>((max, p) => (p.order > max ? p.order : max), -1) ?? -1;
      return datingService.addPhoto({ url, order: maxOrder + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'me'] });
    },
  });

  const photos: DatingPhoto[] = useMemo(
    () => (profile?.photos ?? []).slice().sort((a, b) => a.order - b.order),
    [profile?.photos],
  );

  const primaryPhotoUrl = photos[0]?.url ?? null;
  const nameLabel = profile?.user?.fullName ?? 'Ban';
  const ageLabel = useMemo(() => {
    if (!profile?.user?.dateOfBirth) return null;
    return calculateAge(profile.user.dateOfBirth);
  }, [profile?.user?.dateOfBirth]);

  const handlePickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thong bao', 'Vui long cho phep quyen truy cap thu vien anh de tiep tuc.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addPhotoMutation.mutateAsync(result.assets[0].uri);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Khong the tai anh len. Vui long thu lai.';
      Alert.alert('Loi', message);
    }
  }, [addPhotoMutation]);

  const handleMenuPress = useCallback(
    (key: 'profile' | 'criteria' | 'pause' | 'delete') => {
      if (key === 'profile') {
        navigation.navigate('DatingProfileSetup', { from: 'settings' });
      } else if (key === 'criteria') {
        navigation.navigate('DatingPreferencesSetup', { from: 'settings' });
      } else if (key === 'pause') {
        Alert.alert(
          'Tam dung hen ho',
          'Ho so cua ban se bi an khoi kham pha. Ban co the bat lai bat cu luc nao.',
          [
            { text: 'Huy', style: 'cancel' },
            {
              text: 'Tam dung',
              onPress: async () => {
                try {
                  await datingService.updateProfile({ isActive: false });
                  queryClient.invalidateQueries({ queryKey: ['dating'] });
                  navigation.navigate('DatingPaused');
                } catch {
                  Alert.alert('Loi', 'Khong the tam dung ho so. Vui long thu lai.');
                }
              },
            },
          ],
        );
      } else if (key === 'delete') {
        Alert.alert(
          'Xoa ho so hen ho',
          'Ho so, anh, cau hoi va tat ca du lieu hen ho se bi xoa vinh vien. Ban chac chan?',
          [
            { text: 'Huy', style: 'cancel' },
            {
              text: 'Xoa',
              style: 'destructive',
              onPress: async () => {
                try {
                  await datingService.deleteProfile();
                  queryClient.removeQueries({ queryKey: ['dating'] });
                  navigation.navigate('DatingSplash');
                } catch {
                  Alert.alert('Loi', 'Khong the xoa ho so. Vui long thu lai.');
                }
              },
            },
          ],
        );
      }
    },
    [navigation, queryClient],
  );

  const handleBackPress = useCallback(() => {
    navigation.navigate('Main' as any);
  }, [navigation]);

  const isBusy = isLoading || isRefetching;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="account-heart" size={18} color={theme.brand.primary} />
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Ho so</Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('DatingSettings')}>
            <Ionicons name="settings-outline" size={22} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        {isBusy ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Section */}
            <Animated.View entering={FadeIn.duration(DURATION.normal)} style={styles.profileSection}>
              <TouchableOpacity
                style={[styles.avatarOuter, { borderColor: theme.brand.primaryMuted }]}
                activeOpacity={0.8}
                onPress={handlePickPhoto}
              >
                {primaryPhotoUrl ? (
                  <Image source={{ uri: primaryPhotoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg.surface }]}>
                    <MaterialCommunityIcons name="camera-plus" size={32} color={theme.text.muted} />
                  </View>
                )}
                <View style={[styles.editBadge, { backgroundColor: theme.brand.primary }]}>
                  <MaterialCommunityIcons name="pencil" size={14} color="#FFFFFF" />
                </View>
              </TouchableOpacity>

              <Text style={[styles.nameText, { color: theme.text.primary }]}>
                {nameLabel}
                {ageLabel ? `, ${ageLabel}` : ''}
              </Text>

              {profile?.bio && (
                <Text style={[styles.bioText, { color: theme.text.secondary }]} numberOfLines={2}>
                  {profile.bio}
                </Text>
              )}
            </Animated.View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatItem icon="heart" value={photos.length} label="Anh" index={0} />
              <StatItem icon="fire" value={profile?.prompts?.length ?? 0} label="Cau hoi" index={1} />
              <StatItem icon="check-circle" value={profile?.isActive ? 'On' : 'Off'} label="Trang thai" index={2} />
            </View>

            {/* Menu Section */}
            <View style={styles.menuSection}>
              <MenuItem icon="heart-outline" label="Ho so Hen ho" onPress={() => handleMenuPress('profile')} index={0} />
              <MenuItem icon="tune-variant" label="Tieu chi hen ho" onPress={() => handleMenuPress('criteria')} index={1} />
              <MenuItem icon="pause-circle-outline" label="Tam dung hen ho" onPress={() => handleMenuPress('pause')} index={2} />
              <MenuItem icon="delete-outline" label="Xoa ho so hen ho" onPress={() => handleMenuPress('delete')} danger index={3} />
            </View>

            {/* Photo Grid Preview */}
            {photos.length > 1 && (
              <View style={styles.photoSection}>
                <Text style={[styles.sectionTitle, { color: theme.text.primary }]}>Anh cua ban</Text>
                <View style={styles.photoGrid}>
                  {photos.slice(0, 6).map((photo, i) => (
                    <Animated.View
                      key={photo.id}
                      entering={FadeIn.delay(i * 50).duration(DURATION.fast)}
                      style={[styles.photoThumb, { backgroundColor: theme.bg.surface }]}
                    >
                      <Image source={{ uri: photo.url }} style={styles.photoThumbImage} />
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DatingMyProfileScreen: React.FC = () => {
  return <MyProfileInner />;
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TEXT_STYLES.headingMedium,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 120,
  },

  // Profile Section
  profileSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameText: {
    ...TEXT_STYLES.displaySmall,
    marginBottom: SPACING.xs,
  },
  bioText: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xxs,
  },
  statValue: {
    ...TEXT_STYLES.headingSmall,
  },
  statLabel: {
    ...TEXT_STYLES.tiny,
  },

  // Menu
  menuSection: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  menuIconWrap: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    ...TEXT_STYLES.labelLarge,
  },

  // Photo Grid
  photoSection: {
    marginTop: SPACING.md,
  },
  sectionTitle: {
    ...TEXT_STYLES.labelLarge,
    marginBottom: SPACING.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  photoThumb: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  photoThumbImage: {
    width: '100%',
    height: '100%',
  },
});

export default DatingMyProfileScreen;
