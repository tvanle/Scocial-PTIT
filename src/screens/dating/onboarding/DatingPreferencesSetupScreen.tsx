import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { RootStackParamList } from '../../../types';
import { useFadeSlideIn } from '../hooks';
import {
  PreferencesHeader,
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
const layoutAnim = DATING_LAYOUT.preferences.animation;
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

  const introStyle = useFadeSlideIn({
    delay: 0,
    initialTranslateY: layoutAnim.entranceTranslateY,
    duration: layoutAnim.entranceDuration,
  });
  const ageStyle = useFadeSlideIn({
    delay: layoutAnim.entranceStagger,
    initialTranslateY: layoutAnim.entranceTranslateY,
    duration: layoutAnim.entranceDuration,
  });
  const majorStyle = useFadeSlideIn({
    delay: layoutAnim.entranceStagger * 2,
    initialTranslateY: layoutAnim.entranceTranslateY,
    duration: layoutAnim.entranceDuration,
  });
  const sameYearStyle = useFadeSlideIn({
    delay: layoutAnim.entranceStagger * 3,
    initialTranslateY: layoutAnim.entranceTranslateY,
    duration: layoutAnim.entranceDuration,
  });
  const privacyStyle = useFadeSlideIn({
    delay: layoutAnim.entranceStagger * 4,
    initialTranslateY: layoutAnim.entranceTranslateY,
    duration: layoutAnim.entranceDuration,
  });

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
        <PreferencesHeader onBack={handleBack} />
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
          <Animated.View style={[styles.intro, { marginBottom: layoutContent.sectionMarginBottom }, introStyle]}>
            <Text style={[styles.introTitle, { color: colors.sectionTitle }]}>
              {DATING_STRINGS.preferencesFindMatch}
            </Text>
            <Text style={[styles.introHint, { color: colors.sectionHint }]}>
              {DATING_STRINGS.preferencesFindMatchHint}
            </Text>
          </Animated.View>

          <Animated.View style={ageStyle}>
            <PreferencesAgeRangeSection value={ageRange} onChange={setAgeRange} />
          </Animated.View>

          <Animated.View style={majorStyle}>
            <PreferencesMajorSection
              selectedMajors={selectedMajors}
              onAddMajor={handleAddMajor}
              onRemoveMajor={handleRemoveMajor}
              pickerValue={pickerValue}
              onPickerChange={setPickerValue}
            />
          </Animated.View>

          <Animated.View style={sameYearStyle}>
            <PreferencesSameYearSection value={sameYearOnly} onValueChange={setSameYearOnly} />
          </Animated.View>

          <Animated.View style={privacyStyle}>
            <PreferencesPrivacyNote />
          </Animated.View>
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
