/**
 * Dating Preferences Setup Screen
 *
 * Step 3 of onboarding - setup dating preferences
 */

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES } from '../../../constants/dating/design-system';
import { DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating';
import { RootStackParamList } from '../../../types';
import datingService from '../../../services/dating/datingService';
import { BRAND } from '../../../constants/dating/design-system/colors';
import {
  OnboardingStepHeader,
  PreferencesAgeRangeSection,
  PreferencesGenderSection,
  PreferencesDistanceSection,
  PreferencesMajorSection,
  PreferencesSameYearSection,
  PreferencesPrivacyNote,
  PreferencesBottomBar,
  type AgeRangeValue,
} from './components';
import type { DatingGenderPreference } from '../../../types/dating';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingPreferencesSetup'>;
type Route = RouteProp<RootStackParamList, 'DatingPreferencesSetup'>;

const layoutContent = DATING_LAYOUT.preferences.content;
const layoutAge = DATING_LAYOUT.preferences.ageRange;

const PreferencesInner: React.FC = () => {
  const { theme } = useDatingTheme();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Route>();
  const [preferredGender, setPreferredGender] = useState<DatingGenderPreference | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRangeValue>({
    min: layoutAge.ageMinDefault,
    max: layoutAge.ageMaxDefault,
  });
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [pickerValue, setPickerValue] = useState('');
  const [sameYearOnly, setSameYearOnly] = useState(true);
  const [loading, setLoading] = useState(false);

  const from = route.params?.from ?? 'onboarding';
  const isEditing = from === 'settings';

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleAddMajor = useCallback((major: string) => {
    if (!major) return;
    setSelectedMajors((prev) => (prev.includes(major) ? prev : [...prev, major]));
    setPickerValue('');
  }, []);
  const handleRemoveMajor = useCallback((major: string) => {
    setSelectedMajors((prev) => prev.filter((m) => m !== major));
  }, []);
  const handleFinish = useCallback(async () => {
    setLoading(true);
    try {
      await datingService.updatePreferences({
        ageMin: ageRange.min,
        ageMax: ageRange.max,
        gender: preferredGender ?? undefined,
        maxDistance: maxDistanceKm,
        preferredMajors: selectedMajors,
        sameYearOnly,
      });
      navigation.navigate('DatingLocationPermission');
    } catch (err: any) {
      const msg = err?.message || DATING_STRINGS.preferences.saveFailed;
      Alert.alert('Loi', msg);
    } finally {
      setLoading(false);
    }
  }, [ageRange, preferredGender, maxDistanceKm, selectedMajors, sameYearOnly, navigation]);

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <OnboardingStepHeader
          stepIndex={3}
          totalSteps={3}
          title={DATING_STRINGS.preferences.title}
          showBackButton
          onBack={handleBack}
          hideProgress={isEditing}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.intro}>
            <View style={[styles.introIconWrap, { backgroundColor: theme.brand.primaryMuted }]}>
              <MaterialIcons name="tune" size={28} color={theme.brand.primary} />
            </View>
            <Text style={[styles.introTitle, { color: theme.text.primary }]}>Find Your Perfect Match</Text>
            <Text style={[styles.introHint, { color: theme.text.secondary }]}>
              Set your preferences to help us find the best matches for you
            </Text>
          </View>

          <PreferencesGenderSection value={preferredGender} onChange={setPreferredGender} />
          <PreferencesDistanceSection value={maxDistanceKm} onChange={setMaxDistanceKm} />
          <PreferencesAgeRangeSection value={ageRange} onChange={setAgeRange} />
          <PreferencesMajorSection
            selectedMajors={selectedMajors}
            onAddMajor={handleAddMajor}
            onRemoveMajor={handleRemoveMajor}
            pickerValue={pickerValue}
            onPickerChange={setPickerValue}
          />
          <PreferencesSameYearSection value={sameYearOnly} onValueChange={setSameYearOnly} />
          <PreferencesPrivacyNote />
        </ScrollView>
      </SafeAreaView>
      <PreferencesBottomBar onFinish={handleFinish} loading={loading} />
    </View>
  );
};

const DatingPreferencesSetupScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <PreferencesInner />
    </DatingThemeProvider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  intro: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
  },
  introIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  introHint: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export default DatingPreferencesSetupScreen;
