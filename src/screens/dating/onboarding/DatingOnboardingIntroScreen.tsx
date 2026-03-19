import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { DATING_ASSETS } from '../../../constants/dating/assets';
import { RootStackParamList } from '../../../types';
import { useFadeSlideIn, usePressScale } from '../hooks';
import { OnboardingStepHeader } from './components';

const DatingOnboardingIntroScreen: React.FC = () => {
  const animatedIllustrationStyle = useFadeSlideIn({ delay: 150, initialTranslateY: 40 });
  const animatedTextStyle = useFadeSlideIn({ delay: 350, initialTranslateY: 30 });
  const animatedFooterStyle = useFadeSlideIn({ delay: 500, initialTranslateY: 40 });
  const { animatedStyle: animatedButtonStyle, handlePressIn, handlePressOut } = usePressScale();

  const navigation = useNavigation<
    NativeStackNavigationProp<RootStackParamList, 'DatingOnboardingIntro'>
  >();
  const handleNextPress = useCallback(() => {
    navigation.navigate('DatingProfileSetup', { from: 'onboarding' });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <OnboardingStepHeader
        stepIndex={1}
        totalSteps={3}
        title=""
        showBackButton={false}
      />
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Animated.View style={[styles.illustrationCard, animatedIllustrationStyle]}>
            <View style={styles.illustrationBackground}>
              <ImageBackground
                source={{ uri: DATING_ASSETS.onboardingStep1Illustration }}
                style={styles.illustrationImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.decorCircleBottomRight} />
            <View style={styles.decorCircleTopLeft} />
          </Animated.View>

          <Animated.View style={[styles.textBlock, animatedTextStyle]}>
            <Text style={styles.title}>{DATING_STRINGS.onboarding.step1Title}</Text>
            <Text style={styles.description}>{DATING_STRINGS.onboarding.step1Description}</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, animatedFooterStyle]}>
          <Pressable
            onPress={handleNextPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View style={[styles.nextButton, animatedButtonStyle]}>
              <Text style={styles.nextButtonText}>{DATING_STRINGS.onboarding.next}</Text>
              <MaterialIcons
                name="arrow-forward"
                size={22}
                color={DATING_COLORS.onboarding.buttonText}
                style={styles.nextIcon}
              />
            </Animated.View>
          </Pressable>

          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const { spacing, illustration, handle, nextButton, typography } = DATING_LAYOUT;
const colors = DATING_COLORS.onboarding;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    minHeight: 0,
  },
  illustrationCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: illustration.borderRadius,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  illustrationBackground: {
    flex: 1,
    backgroundColor: colors.illustrationOverlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  decorCircleBottomRight: {
    position: 'absolute',
    right: -illustration.decorCircleOffset,
    bottom: -spacing.md,
    width: illustration.decorCircleBottomSize,
    height: illustration.decorCircleBottomSize,
    borderRadius: illustration.decorCircleBottomSize / 2,
    backgroundColor: colors.decorCirclePrimary,
  },
  decorCircleTopLeft: {
    position: 'absolute',
    left: -illustration.decorCircleOffset,
    top: -spacing.md,
    width: illustration.decorCircleTopSize,
    height: illustration.decorCircleTopSize,
    borderRadius: illustration.decorCircleTopSize / 2,
    backgroundColor: colors.decorCircleSecondary,
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    flexShrink: 0,
  },
  title: {
    fontSize: typography.titleFontSize,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: typography.titleLetterSpacing,
    color: colors.title,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.descriptionFontSize,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: typography.descriptionLineHeight,
    color: colors.description,
  },
  footer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  nextButton: {
    height: nextButton.height,
    borderRadius: nextButton.borderRadius,
    backgroundColor: DATING_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nextButton.paddingHorizontal,
    shadowColor: DATING_COLORS.primary,
    shadowOffset: { width: 0, height: nextButton.shadowOffsetY },
    shadowOpacity: nextButton.shadowOpacity,
    shadowRadius: nextButton.shadowRadius,
    elevation: nextButton.elevation,
  },
  nextButtonText: {
    color: colors.buttonText,
    fontSize: typography.buttonFontSize,
    fontWeight: '700',
    letterSpacing: typography.buttonLetterSpacing,
  },
  nextIcon: {
    marginLeft: nextButton.iconMarginLeft,
    marginTop: nextButton.iconMarginTop,
  },
  handleContainer: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  handle: {
    width: handle.width,
    height: handle.height,
    borderRadius: handle.borderRadius,
    backgroundColor: colors.handle,
  },
});

export default DatingOnboardingIntroScreen;

