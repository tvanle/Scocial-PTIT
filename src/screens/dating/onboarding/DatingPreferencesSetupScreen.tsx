import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating';
import { RootStackParamList } from '../../../types';
import datingService from '../../../services/dating/datingService';
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

const layoutContent = DATING_LAYOUT.preferences.content;
const layoutAge = DATING_LAYOUT.preferences.ageRange;
const colors = DATING_COLORS.preferences;

const DatingPreferencesSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
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
      const msg =
        err?.message || DATING_STRINGS.preferences.saveFailed;
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  }, [ageRange, preferredGender, maxDistanceKm, selectedMajors, sameYearOnly, navigation]);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <OnboardingStepHeader
          stepIndex={3}
          totalSteps={3}
          title={DATING_STRINGS.preferences.title}
          showBackButton
          onBack={handleBack}
        />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: layoutContent.paddingHorizontal,
              paddingTop: layoutContent.paddingTop,
              paddingBottom: layoutContent.paddingBottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.intro, { marginBottom: layoutContent.sectionMarginBottom }]}>
            <Text style={[styles.introTitle, { color: colors.sectionTitle }]}>
              {DATING_STRINGS.preferences.findMatch}
            </Text>
            <Text style={[styles.introHint, { color: colors.sectionHint }]}>
              {DATING_STRINGS.preferences.findMatchHint}
            </Text>
          </View>

          <View>
            <PreferencesGenderSection value={preferredGender} onChange={setPreferredGender} />
          </View>

          <View>
            <PreferencesDistanceSection value={maxDistanceKm} onChange={setMaxDistanceKm} />
          </View>

          <View>
            <PreferencesAgeRangeSection value={ageRange} onChange={setAgeRange} />
          </View>

          <View>
            <PreferencesMajorSection
              selectedMajors={selectedMajors}
              onAddMajor={handleAddMajor}
              onRemoveMajor={handleRemoveMajor}
              pickerValue={pickerValue}
              onPickerChange={setPickerValue}
            />
          </View>

          <View>
            <PreferencesSameYearSection value={sameYearOnly} onValueChange={setSameYearOnly} />
          </View>

          <View>
            <PreferencesPrivacyNote />
          </View>
        </ScrollView>
      </SafeAreaView>
      <PreferencesBottomBar onFinish={handleFinish} loading={loading} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: DATING_COLORS.preferences.background,
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
  intro: {},
  introTitle: {
    fontSize: layoutContent.introTitleFontSize,
    fontWeight: '700',
    marginBottom: layoutContent.introTitleMarginBottom,
  },
  introHint: {
    fontSize: layoutContent.introHintFontSize,
  },
});

export default DatingPreferencesSetupScreen;
