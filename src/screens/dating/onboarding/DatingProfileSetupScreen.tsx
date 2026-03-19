import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating';
import { RootStackParamList, DiscoveryCard } from '../../../types';
import { usePressScale, useFadeSlideIn } from '../hooks';
import datingService from '../../../services/dating/datingService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { DatingProfile } from '../../../types/dating';
import {
  OnboardingStepHeader,
  ProfileSetupPhotosSection,
  ProfileSetupBioSection,
  ProfileSetupInterestsSection,
  ProfileSetupPromptsSection,
  ProfileSetupBottomBar,
} from './components';
import type { PhotoSlot, PromptValue } from './components';

const PROFILE_SETUP_STAGGER = 60;
const PROFILE_SETUP_DURATION = 320;
const PROFILE_SETUP_TRANSLATE_Y = 10;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingProfileSetup'>;
type Route = RouteProp<RootStackParamList, 'DatingProfileSetup'>;

const DatingProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Route>();
  const queryClient = useQueryClient();
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(DATING_STRINGS.profileSetup.defaults.defaultSelectedInterestIds),
  );
  const [prompts, setPrompts] = useState<PromptValue[]>([]);
  const { animatedStyle: buttonAnimatedStyle, handlePressIn, handlePressOut } = usePressScale({
    scaleDown: 0.98,
  });

  const from = route.params?.from ?? 'onboarding';
  const isEditing = from === 'settings';

  const { data: existingProfile } = useQuery<DatingProfile | undefined>({
    queryKey: ['dating', 'me'],
    queryFn: async () => {
      try {
        return await datingService.getMyProfile();
      } catch {
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (!existingProfile) return;

    setBio((prev) => (prev ? prev : existingProfile.bio ?? ''));

    setPhotos((prev) => {
      if (prev.length) return prev;
      if (!existingProfile.photos?.length) return prev;
      return existingProfile.photos.map((p, index) => ({
        uri: p.url,
        order: p.order ?? index,
        isExisting: true,
        id: p.id,
      }));
    });

    setPrompts((prev) => {
      if (prev.length) return prev;
      if (!existingProfile.prompts?.length) return prev;
      return existingProfile.prompts.map((p) => ({
        question: p.question,
        answer: p.answer,
      }));
    });
  }, [existingProfile]);

  const toggleInterest = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const counterText = useMemo(
    () =>
      DATING_STRINGS.profileSetup.bioCounter(
        bio.length,
        DATING_LAYOUT.profileSetup.bio.maxLength,
      ),
    [bio.length],
  );

  const canContinue = photos.length >= 2 && bio.trim().length >= 10;

  const validationHint = useMemo(() => {
    if (photos.length < 2) return DATING_STRINGS.profileSetup.photoRequired;
    if (bio.trim().length < 10) return DATING_STRINGS.profileSetup.bioRequired;
    return null;
  }, [photos.length, bio]);

  const handlePickPhoto = useCallback(async (slotIndex: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Thông báo', DATING_STRINGS.profileSetup.permissionRequired);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.order !== slotIndex);
      return [...filtered, { uri: result.assets[0].uri, order: slotIndex }];
    });
  }, []);

  const handleRemovePhoto = useCallback((slotIndex: number) => {
    setPhotos((prev) => prev.filter((p) => p.order !== slotIndex));
  }, []);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;

    setCreating(true);
    try {
      if (existingProfile) {
        await datingService.updateProfile({ bio });
      } else {
        try {
          await datingService.createProfile({ bio });
        } catch (profileErr: any) {
          const msg = profileErr?.message || '';
          const isConflict = msg.includes('tồn tại') || msg.includes('exist');
          if (!isConflict) throw profileErr;
        }
      }

      if (existingProfile) {
        const removed = existingProfile.photos.filter(
          (p) => !photos.some((slot) => slot.id === p.id),
        );
        for (const photo of removed) {
          try {
            await datingService.deletePhoto(photo.id);
          } catch {
            // ignore delete errors here, will surface if add fails
          }
        }
      }

      for (const photo of photos) {
        if (photo.isExisting) continue;
        setUploadingSlot(photo.order);
        const url = await datingService.uploadMedia(photo.uri);
        await datingService.addPhoto({ url, order: photo.order });
      }
      setUploadingSlot(null);

      const validPrompts = prompts.filter((p) => p.question && p.answer.trim());
      if (validPrompts.length > 0) {
        await datingService.updatePrompts({ prompts: validPrompts });
      }

      navigation.navigate('DatingPreferencesSetup', { from: 'onboarding' });
    } catch (err: any) {
      setUploadingSlot(null);
      console.error('[ProfileSetup] Error:', JSON.stringify({
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      }));
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        DATING_STRINGS.profileSetup.createFailed;
      Alert.alert('Lỗi', msg);
    } finally {
      setCreating(false);
    }
  }, [canContinue, photos, bio, navigation, existingProfile]);

  const handleSave = useCallback(async () => {
    if (!canContinue) {
      if (validationHint) {
        Alert.alert('Thông báo', validationHint);
      }
      return;
    }

    setCreating(true);
    try {
      if (existingProfile) {
        await datingService.updateProfile({ bio });
      } else {
        try {
          await datingService.createProfile({ bio });
        } catch (profileErr: any) {
          const msg = profileErr?.message || '';
          const isConflict = msg.includes('tồn tại') || msg.includes('exist');
          if (!isConflict) throw profileErr;
        }
      }

      if (existingProfile) {
        const removed = existingProfile.photos.filter(
          (p) => !photos.some((slot) => slot.id === p.id),
        );
        for (const photo of removed) {
          try {
            await datingService.deletePhoto(photo.id);
          } catch {
            // ignore delete errors here
          }
        }
      }

      for (const photo of photos) {
        if (photo.isExisting) continue;
        setUploadingSlot(photo.order);
        const url = await datingService.uploadMedia(photo.uri);
        await datingService.addPhoto({ url, order: photo.order });
      }
      setUploadingSlot(null);

      const validPrompts = prompts.filter((p) => p.question && p.answer.trim());
      await datingService.updatePrompts({ prompts: validPrompts });

      queryClient.invalidateQueries({ queryKey: ['dating', 'me'] });
      Alert.alert('Thành công', 'Đã lưu hồ sơ hẹn hò của bạn.');
      navigation.goBack();
    } catch (err: any) {
      setUploadingSlot(null);
      console.error('[ProfileSetupSave] Error:', JSON.stringify({
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      }));
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        DATING_STRINGS.profileSetup.createFailed;
      Alert.alert('Lỗi', msg);
    } finally {
      setCreating(false);
    }
  }, [canContinue, validationHint, existingProfile, bio, photos, navigation, queryClient]);

  const handlePreview = useCallback(async () => {
    if (!canContinue) {
      if (validationHint) {
        Alert.alert('Thông báo', validationHint);
      }
      return;
    }

    setCreating(true);
    try {
      if (existingProfile) {
        await datingService.updateProfile({ bio });
      } else {
        try {
          await datingService.createProfile({ bio });
        } catch (profileErr: any) {
          const msg = profileErr?.message || '';
          const isConflict = msg.includes('tồn tại') || msg.includes('exist');
          if (!isConflict) throw profileErr;
        }
      }

      if (existingProfile) {
        const removed = existingProfile.photos.filter(
          (p) => !photos.some((slot) => slot.id === p.id),
        );
        for (const photo of removed) {
          try {
            await datingService.deletePhoto(photo.id);
          } catch {
            // ignore delete errors here
          }
        }
      }

      for (const photo of photos) {
        if (photo.isExisting) continue;
        setUploadingSlot(photo.order);
        const url = await datingService.uploadMedia(photo.uri);
        await datingService.addPhoto({ url, order: photo.order });
      }
      setUploadingSlot(null);

      const latest = await datingService.getMyProfile();
      const card: DiscoveryCard = {
        userId: latest.userId,
        bio: latest.bio,
        photos: latest.photos.map((p) => ({ url: p.url, order: p.order })),
        user: {
          id: latest.user?.id ?? latest.userId,
          fullName: latest.user?.fullName ?? 'Bạn',
          avatar: latest.user?.avatar ?? null,
          dateOfBirth: latest.user?.dateOfBirth ?? new Date().toISOString(),
          gender: latest.user?.gender ?? null,
          studentId: undefined,
          lastActiveAt: undefined,
        },
        lifestyle: latest.lifestyle ? { education: latest.lifestyle.education } : null,
        distanceKm: null,
      };

      navigation.navigate('DatingProfileDetail', { profile: card });
    } catch (err: any) {
      setUploadingSlot(null);
      console.error('[ProfileSetupPreview] Error:', JSON.stringify({
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
      }));
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        DATING_STRINGS.profileSetup.createFailed;
      Alert.alert('Lỗi', msg);
    } finally {
      setCreating(false);
    }
  }, [canContinue, validationHint, existingProfile, bio, photos, navigation]);

  const layout = DATING_LAYOUT.profileSetup;

  const photosStyle = useFadeSlideIn({
    delay: 0,
    duration: PROFILE_SETUP_DURATION,
    initialTranslateY: PROFILE_SETUP_TRANSLATE_Y,
  });
  const bioStyle = useFadeSlideIn({
    delay: PROFILE_SETUP_STAGGER,
    duration: PROFILE_SETUP_DURATION,
    initialTranslateY: PROFILE_SETUP_TRANSLATE_Y,
  });
  const interestsStyle = useFadeSlideIn({
    delay: PROFILE_SETUP_STAGGER * 2,
    duration: PROFILE_SETUP_DURATION,
    initialTranslateY: PROFILE_SETUP_TRANSLATE_Y,
  });

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <OnboardingStepHeader
          stepIndex={2}
          totalSteps={3}
          title={DATING_STRINGS.profileSetup.title}
          showBackButton
          onBack={handleBack}
          hideProgress={isEditing || !!existingProfile}
          rightActionLabel={isEditing ? 'Xem trước' : undefined}
          onRightAction={isEditing ? handlePreview : undefined}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: layout.content.paddingHorizontal,
              paddingBottom: layout.content.paddingBottom,
              gap: layout.content.gap,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={photosStyle}>
            <ProfileSetupPhotosSection
              photos={photos}
              onPickPhoto={handlePickPhoto}
              uploadingSlot={uploadingSlot}
              onRemovePhoto={handleRemovePhoto}
            />
          </Animated.View>
          <Animated.View style={bioStyle}>
            <ProfileSetupBioSection
              value={bio}
              onChangeText={setBio}
              counterText={counterText}
            />
          </Animated.View>
          <Animated.View style={interestsStyle}>
            <ProfileSetupInterestsSection
              options={DATING_STRINGS.profileSetup.interestOptions}
              selectedIds={selectedIds}
              onToggle={toggleInterest}
            />
          </Animated.View>
          <Animated.View style={interestsStyle}>
            <ProfileSetupPromptsSection
              prompts={prompts}
              onChange={setPrompts}
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <ProfileSetupBottomBar
        onContinue={isEditing ? handleSave : handleContinue}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        animatedButtonStyle={buttonAnimatedStyle}
        loading={creating}
        disabled={!canContinue}
        hint={validationHint}
        label={isEditing ? 'Lưu' : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: DATING_COLORS.profileSetup.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default DatingProfileSetupScreen;
