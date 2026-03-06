import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import {
  DATING_INTEREST_OPTIONS,
  DATING_PROFILE_SETUP_DEFAULTS,
} from '../../../constants/dating/interests';
import { RootStackParamList } from '../../../types';
import { usePressScale } from '../hooks';
import {
  ProfileSetupHeader,
  ProfileSetupProgress,
  ProfileSetupPhotosSection,
  ProfileSetupBioSection,
  ProfileSetupInterestsSection,
  ProfileSetupBottomBar,
} from './components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingProfileSetup'>;

const DatingProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [bio, setBio] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(DATING_PROFILE_SETUP_DEFAULTS.defaultSelectedInterestIds),
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
      DATING_STRINGS.profileSetupBioCounter(
        bio.length,
        DATING_LAYOUT.profileSetup.bio.maxLength,
      ),
    [bio.length],
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleContinue = useCallback(() => {
    // TODO: Validate and navigate to step 3
  }, []);

  const layout = DATING_LAYOUT.profileSetup;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ProfileSetupHeader onBack={handleBack} />
        <ProfileSetupProgress progressPercent={DATING_PROFILE_SETUP_DEFAULTS.progressPercentStep2} />

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
          <ProfileSetupPhotosSection />
          <ProfileSetupBioSection
            value={bio}
            onChangeText={setBio}
            counterText={counterText}
          />
          <ProfileSetupInterestsSection
            options={DATING_INTEREST_OPTIONS}
            selectedIds={selectedIds}
            onToggle={toggleInterest}
          />
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
