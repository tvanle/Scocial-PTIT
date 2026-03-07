import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating';
import { RootStackParamList } from '../../../types';
import {
  OnboardingStepHeader,
  PreferencesAgeRangeSection,
  PreferencesMajorSection,
  PreferencesSameYearSection,
  PreferencesPrivacyNote,
  PreferencesBottomBar,
  type AgeRangeValue,
} from './components';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingPreferencesSetup'>;

const layoutContent = DATING_LAYOUT.preferences.content;
const layoutAge = DATING_LAYOUT.preferences.ageRange;
const colors = DATING_COLORS.preferences;

const DatingPreferencesSetupScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [ageRange, setAgeRange] = useState<AgeRangeValue>({
    min: layoutAge.ageMinDefault,
    max: layoutAge.ageMaxDefault,
  });
  const [selectedMajors, setSelectedMajors] = useState<string[]>([]);
  const [pickerValue, setPickerValue] = useState('');
  const [sameYearOnly, setSameYearOnly] = useState(true);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleAddMajor = useCallback((major: string) => {
    if (!major) return;
    setSelectedMajors((prev) => (prev.includes(major) ? prev : [...prev, major]));
    setPickerValue('');
  }, []);
  const handleRemoveMajor = useCallback((major: string) => {
    setSelectedMajors((prev) => prev.filter((m) => m !== major));
  }, []);
  const handleFinish = useCallback(() => {
    // TODO: Call API updatePreferences(ageMin, ageMax, ...) then navigate to Main or Dating home
    navigation.getParent()?.navigate('Main');
  }, [navigation]);

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
      <PreferencesBottomBar onFinish={handleFinish} />
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
