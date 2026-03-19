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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { DATING_SPACING } from '../../../constants/dating/tokens';
import { calculateAge } from '../../../utils/dating';
import { DiscoveryBottomNav } from '../discovery/components';
import datingService from '../../../services/dating/datingService';
import type { RootStackParamList } from '../../../types';
import type { DatingPhoto, DatingProfile } from '../../../types/dating';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DatingMyProfile'>;

const colors = DATING_COLORS.discovery;
const AVATAR_SIZE = 120;

export const DatingMyProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
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
      const maxOrder =
        current?.photos?.reduce<number>((max, p) => (p.order > max ? p.order : max), -1) ?? -1;
      const nextOrder = maxOrder + 1;
      return datingService.addPhoto({ url, order: nextOrder < 0 ? 0 : nextOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'me'] });
    },
  });

  const photos: DatingPhoto[] = useMemo(
    () =>
      (profile?.photos ?? []).slice().sort((a, b) => {
        return a.order - b.order;
      }),
    [profile?.photos],
  );

  const primaryPhotoUrl = photos[0]?.url ?? null;

  const nameLabel = profile?.user?.fullName ?? 'Bạn';
  const ageLabel = useMemo(() => {
    if (!profile?.user?.dateOfBirth) return null;
    return calculateAge(profile.user.dateOfBirth);
  }, [profile?.user?.dateOfBirth]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handlePickPhoto = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thông báo', 'Vui lòng cho phép quyền truy cập thư viện ảnh để tiếp tục.');
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
      await addPhotoMutation.mutateAsync(result.assets[0].uri);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải ảnh lên. Vui lòng thử lại.';
      Alert.alert('Lỗi', message);
    }
  }, [addPhotoMutation]);

  const handleMenuPress = useCallback(
    (key: 'profile' | 'criteria') => {
      if (key === 'profile') {
        navigation.navigate('DatingProfileSetup', { from: 'settings' });
        return;
      }
      if (key === 'criteria') {
        navigation.navigate('DatingPreferencesSetup', { from: 'settings' });
      }
    },
    [navigation],
  );

  const handleBackToSocial = useCallback(() => {
    navigation.navigate('Main' as any);
  }, [navigation]);

  const handlePauseProfile = useCallback(() => {
    Alert.alert(
      'Tạm dừng hẹn hò',
      'Hồ sơ của bạn sẽ bị ẩn khỏi khám phá. Bạn có thể bật lại bất cứ lúc nào.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Tạm dừng',
          onPress: async () => {
            try {
              await datingService.updateProfile({ isActive: false });
              queryClient.invalidateQueries({ queryKey: ['dating'] });
              navigation.navigate('DatingPaused');
            } catch {
              Alert.alert('Lỗi', 'Không thể tạm dừng hồ sơ. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  }, [navigation, queryClient]);

  const handleDeleteProfile = useCallback(() => {
    Alert.alert(
      'Xoá hồ sơ hẹn hò',
      'Hồ sơ, ảnh, câu hỏi và tất cả dữ liệu hẹn hò sẽ bị xoá vĩnh viễn. Bạn chắc chắn?',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await datingService.deleteProfile();
              queryClient.removeQueries({ queryKey: ['dating'] });
              navigation.navigate('DatingSplash');
            } catch {
              Alert.alert('Lỗi', 'Không thể xoá hồ sơ. Vui lòng thử lại.');
            }
          },
        },
      ],
    );
  }, [navigation, queryClient]);

  const handleBottomTabPress = useCallback(
    (key: string) => {
      if (key === 'discover') {
        navigation.navigate('DatingDiscovery');
        return;
      }
      if (key === 'likes') {
        navigation.navigate('DatingLikes');
        return;
      }
      if (key === 'chats') {
        navigation.navigate('DatingChatList');
        return;
      }
    },
    [navigation],
  );

  const isBusy = isLoading || isRefetching;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerLeftGroup}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={handleBackToSocial}
              accessibilityRole="button"
              accessibilityLabel="Quay về mạng xã hội"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.title} />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Hồ sơ</Text>
          <View style={styles.headerIconPlaceholder} />
        </View>

        {isBusy ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.title} />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileSection}>
              <TouchableOpacity
                style={styles.avatarOuter}
                activeOpacity={0.8}
                onPress={handlePickPhoto}
              >
                {primaryPhotoUrl ? (
                  <Image source={{ uri: primaryPhotoUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons name="photo-camera" size={32} color={colors.navInactive} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>
                  {nameLabel}
                  {ageLabel ? `, ${ageLabel}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.menuSection}>
              <MenuItem
                icon="favorite"
                label="Hồ sơ Hẹn hò"
                onPress={() => handleMenuPress('profile')}
              />
              <MenuItem
                icon="tune"
                label="Tiêu chí hẹn hò"
                onPress={() => handleMenuPress('criteria')}
              />
              <MenuItem
                icon="pause-circle-outline"
                label="Tạm dừng hẹn hò"
                onPress={handlePauseProfile}
              />
              <MenuItem
                icon="delete-outline"
                label="Xoá hồ sơ hẹn hò"
                onPress={handleDeleteProfile}
              />
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
      <DiscoveryBottomNav activeTab="profile" onTabPress={handleBottomTabPress} />
    </View>
  );
};

interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.menuItemIconWrap}>
        <MaterialIcons name={icon} size={22} color={DATING_COLORS.primary} />
      </View>
      <Text style={styles.menuItemLabel}>{label}</Text>
      <MaterialIcons name="chevron-right" size={22} color={colors.navInactive} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.lg,
    paddingTop: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.sm,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: DATING_COLORS.profileDetail.name,
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
    paddingHorizontal: DATING_SPACING.lg,
    paddingBottom: DATING_SPACING.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: DATING_SPACING.lg,
    marginBottom: DATING_SPACING.lg,
  },
  avatarOuter: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 4,
    borderColor: 'rgba(232,48,48,0.15)',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginBottom: DATING_SPACING.md,
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
    color: DATING_COLORS.profileDetail.name,
  },
  photosGrid: {},
  menuSection: {
    marginTop: DATING_SPACING.md,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.md,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  menuItemIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(232,48,48,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DATING_SPACING.md,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: DATING_COLORS.profileDetail.name,
  },
});

export default DatingMyProfileScreen;

