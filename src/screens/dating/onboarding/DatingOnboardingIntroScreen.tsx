/**
 * Dating Onboarding Intro Screen
 *
 * First step of dating onboarding flow
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES, RADIUS, DURATION } from '../../../constants/dating/design-system';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { DATING_ASSETS } from '../../../constants/dating/assets';
import { RootStackParamList } from '../../../types';
import { useFadeSlideIn, usePressScale } from '../hooks';
import { OnboardingStepHeader } from './components';

type Nav = NativeStackNavigationProp<RootStackParamList, 'DatingOnboardingIntro'>;

const OnboardingIntroInner: React.FC = () => {
  const { theme } = useDatingTheme();
  const navigation = useNavigation<Nav>();

  const animatedIllustrationStyle = useFadeSlideIn({ delay: 150, initialTranslateY: 40 });
  const animatedTextStyle = useFadeSlideIn({ delay: 350, initialTranslateY: 30 });
  const animatedFooterStyle = useFadeSlideIn({ delay: 500, initialTranslateY: 40 });
  const { animatedStyle: animatedButtonStyle, handlePressIn, handlePressOut } = usePressScale();

  const handleNextPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('DatingProfileSetup', { from: 'onboarding' });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingStepHeader
          stepIndex={1}
          totalSteps={3}
          title=""
          showBackButton={false}
        />

        <View style={styles.content}>
          <View style={styles.contentContainer}>
            <Animated.View style={[styles.illustrationCard, animatedIllustrationStyle]}>
              <View style={[styles.illustrationBackground, { backgroundColor: theme.brand.primaryMuted }]}>
                <ImageBackground
                  source={{ uri: DATING_ASSETS.onboardingStep1Illustration }}
                  style={styles.illustrationImage}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.decorCircleBottomRight, { backgroundColor: theme.brand.primary }]} />
              <View style={[styles.decorCircleTopLeft, { backgroundColor: theme.semantic.superLike.main }]} />
            </Animated.View>

            <Animated.View style={[styles.textBlock, animatedTextStyle]}>
              <Text style={[styles.title, { color: theme.text.primary }]}>
                {DATING_STRINGS.onboarding.step1Title}
              </Text>
              <Text style={[styles.description, { color: theme.text.secondary }]}>
                {DATING_STRINGS.onboarding.step1Description}
              </Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.footer, animatedFooterStyle]}>
            <Pressable
              onPress={handleNextPress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Animated.View style={[
                styles.nextButton,
                { backgroundColor: theme.brand.primary },
                animatedButtonStyle,
              ]}>
                <Text style={styles.nextButtonText}>{DATING_STRINGS.onboarding.next}</Text>
                <Ionicons name="arrow-forward" size={22} color="#FFFFFF" style={styles.nextIcon} />
              </Animated.View>
            </Pressable>

            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: theme.border.medium }]} />
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export const DatingOnboardingIntroScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <OnboardingIntroInner />
    </DatingThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    minHeight: 0,
  },
  illustrationCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  illustrationBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  decorCircleBottomRight: {
    position: 'absolute',
    right: -30,
    bottom: -SPACING.md,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.3,
  },
  decorCircleTopLeft: {
    position: 'absolute',
    left: -30,
    top: -SPACING.md,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.5,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    flexShrink: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: SPACING.sm,
  },
  description: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  nextButton: {
    height: 56,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  nextButtonText: {
    ...TEXT_STYLES.labelLarge,
    color: '#FFFFFF',
  },
  nextIcon: {
    marginLeft: SPACING.xs,
    marginTop: 2,
  },
  handleContainer: {
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
});

export default DatingOnboardingIntroScreen;
