import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating';
import { RootStackParamList } from '../../../types';
import { usePressScale, useFadeSlideIn } from '../hooks';
import {
  OnboardingStepHeader,
  ProfileSetupPhotosSection,
  ProfileSetupBioSection,
  ProfileSetupInterestsSection,
  ProfileSetupBottomBar,
} from './components';

const PROFILE_SETUP_STAGGER = 60;
const PROFILE_SETUP_DURATION = 320;
const PROFILE_SETUP_TRANSLATE_Y = 10;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingProfileSetup'>;

const DatingProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [bio, setBio] = useState('');
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

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleContinue = useCallback(() => {
    navigation.navigate('DatingPreferencesSetup');
  }, [navigation]);

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
            <ProfileSetupPhotosSection />
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
