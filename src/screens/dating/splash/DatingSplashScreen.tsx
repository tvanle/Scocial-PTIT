import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { AnimatedLogo } from '../components/AnimatedLogo';
import { AnimatedHeader } from '../components/AnimatedHeader';
import { AnimatedFooter } from '../components/AnimatedFooter';
import { RootStackParamList } from '../../../types';

type DatingSplashNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingSplash'>;

const { animation } = DATING_LAYOUT.splash;

export const DatingSplashScreen: React.FC = () => {
  const theme = DATING_COLORS.light;
  const navigation = useNavigation<DatingSplashNavigationProp>();

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(50);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);

  useEffect(() => {
    const springConfig = { damping: animation.springDamping, stiffness: animation.springStiffness };

    logoOpacity.value = withTiming(1, { duration: animation.duration });
    logoTranslateY.value = withSpring(0, springConfig);

    textOpacity.value = withDelay(animation.delayText, withTiming(1, { duration: animation.duration }));
    textTranslateY.value = withDelay(animation.delayText, withSpring(0, springConfig));

    buttonOpacity.value = withDelay(animation.delayButton, withTiming(1, { duration: animation.duration }));
    buttonTranslateY.value = withDelay(animation.delayButton, withSpring(0, springConfig));
  }, [
    animation.delayButton,
    animation.delayText,
    animation.duration,
    animation.springDamping,
    animation.springStiffness,
    buttonOpacity,
    buttonTranslateY,
    logoOpacity,
    logoTranslateY,
    textOpacity,
    textTranslateY,
  ]);

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <AnimatedLogo
            animatedStyle={animatedLogoStyle}
            surfaceColor={theme.surface}
            glowColor={DATING_COLORS.splash.glowColor}
          />

          <AnimatedHeader animatedStyle={animatedTextStyle} textColor={theme.textPrimary} />
        </View>

        <AnimatedFooter
          animatedStyle={animatedButtonStyle}
          mutedTextColor={theme.textMuted}
          onStartPress={handleStartPress}
        />
      </View>
    </SafeAreaView>
  );
};

const { container, centerContent } = DATING_LAYOUT.splash;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: container.paddingVertical,
    paddingHorizontal: container.paddingHorizontal,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: centerContent.marginBottom,
  },
});

