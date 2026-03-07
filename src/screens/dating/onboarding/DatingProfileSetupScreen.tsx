import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating';
import { RootStackParamList } from '../../../types';
import { usePressScale, useFadeSlideIn } from '../hooks';
import datingService from '../../../services/dating/datingService';
import {
  OnboardingStepHeader,
  ProfileSetupPhotosSection,
  ProfileSetupBioSection,
  ProfileSetupInterestsSection,
  ProfileSetupBottomBar,
} from './components';
import type { PhotoSlot } from './components';

const PROFILE_SETUP_STAGGER = 60;
const PROFILE_SETUP_DURATION = 320;
const PROFILE_SETUP_TRANSLATE_Y = 10;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingProfileSetup'>;

const DatingProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState<PhotoSlot[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(DATING_STRINGS.profileSetup.defaults.defaultSelectedInterestIds),
  );
  const { animatedStyle: buttonAnimatedStyle, handlePressIn, handlePressOut } = usePressScale({
    scaleDown: 0.98,
  });

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

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const handleContinue = useCallback(async () => {
    if (!canContinue) return;

    setCreating(true);
    try {
      try {
        await datingService.createProfile({ bio });
      } catch (profileErr: any) {
        const msg = profileErr?.message || '';
        const isConflict = msg.includes('tồn tại') || msg.includes('exist');
        if (!isConflict) throw profileErr;
      }

      for (const photo of photos) {
        setUploadingSlot(photo.order);
        const url = await datingService.uploadMedia(photo.uri);
        await datingService.addPhoto({ url, order: photo.order });
      }
      setUploadingSlot(null);

      navigation.navigate('DatingPreferencesSetup');
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
  }, [canContinue, photos, bio, navigation]);

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
        </ScrollView>
      </SafeAreaView>

      <ProfileSetupBottomBar
        onContinue={handleContinue}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        animatedButtonStyle={buttonAnimatedStyle}
        loading={creating}
        disabled={!canContinue}
        hint={validationHint}
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
