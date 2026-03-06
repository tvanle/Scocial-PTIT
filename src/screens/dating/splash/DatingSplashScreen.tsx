import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { AnimatedLogo } from './components/AnimatedLogo';
import { AnimatedHeader } from './components/AnimatedHeader';
import { AnimatedFooter } from './components/AnimatedFooter';

export const DatingSplashScreen: React.FC = () => {
  const theme = DATING_COLORS.light;

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(50);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoTranslateY.value = withSpring(0, { damping: 12, stiffness: 90 });

    textOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    textTranslateY.value = withDelay(300, withSpring(0, { damping: 12, stiffness: 90 }));

    buttonOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    buttonTranslateY.value = withDelay(600, withSpring(0, { damping: 12, stiffness: 90 }));
  }, [buttonOpacity, buttonTranslateY, logoOpacity, logoTranslateY, textOpacity, textTranslateY]);

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
    // TODO: Navigate into dating flow when implemented
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <AnimatedLogo
            animatedStyle={animatedLogoStyle}
            surfaceColor={theme.surface}
            glowColor="rgba(250, 78, 87, 0.08)"
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 80,
  },
});

