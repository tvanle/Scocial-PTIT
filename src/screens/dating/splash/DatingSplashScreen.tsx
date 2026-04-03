/**
 * Dating Splash Screen
 *
 * Entry point to dating module with animated intro
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, DURATION, SPRING } from '../../../constants/dating/design-system';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { AnimatedHeader } from '../components/AnimatedHeader';
import { AnimatedFooter } from '../components/AnimatedFooter';
import { RootStackParamList } from '../../../types';

type DatingSplashNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingSplash'>;

const SplashInner: React.FC = () => {
  const { theme } = useDatingTheme();
  const navigation = useNavigation<DatingSplashNavigationProp>();

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(50);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);

  useEffect(() => {
    const springConfig = SPRING.gentle;

    logoOpacity.value = withTiming(1, { duration: DURATION.normal });
    logoTranslateY.value = withSpring(0, springConfig);

    textOpacity.value = withDelay(200, withTiming(1, { duration: DURATION.normal }));
    textTranslateY.value = withDelay(200, withSpring(0, springConfig));

    buttonOpacity.value = withDelay(400, withTiming(1, { duration: DURATION.normal }));
    buttonTranslateY.value = withDelay(400, withSpring(0, springConfig));
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
    width: '100%',
  }));

  const handleStartPress = () => {
    navigation.navigate('DatingOnboardingIntro');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.centerContent}>
            <AnimatedLogo
              animatedStyle={animatedLogoStyle}
              surfaceColor={theme.bg.surface}
              glowColor={theme.brand.primary}
            />

            <AnimatedHeader
              animatedStyle={animatedTextStyle}
              textColor={theme.text.primary}
            />
          </View>

          <AnimatedFooter
            animatedStyle={animatedButtonStyle}
            mutedTextColor={theme.text.muted}
            onStartPress={handleStartPress}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

export const DatingSplashScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <SplashInner />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: SPACING.xl,
  },
});

export default DatingSplashScreen;
