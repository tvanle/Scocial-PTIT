import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { DATING_STRINGS, SPRING_BUTTON, PRESS_SCALE_DOWN } from '../../../../../constants/dating';
import { BRAND } from '../../../../../constants/dating/design-system/colors';
import { useDatingTheme } from '../../../../../contexts/DatingThemeContext';

interface PreferencesBottomBarProps {
  onFinish: () => void;
  loading?: boolean;
  buttonLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PreferencesBottomBar: React.FC<PreferencesBottomBarProps> = ({
  onFinish,
  loading = false,
  buttonLabel = DATING_STRINGS.preferences.finish,
}) => {
  const { theme, isDark } = useDatingTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(PRESS_SCALE_DOWN, SPRING_BUTTON);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_BUTTON);
  };

  const bgColor = theme.bg.card;
  const gradientColors: [string, string, string] = isDark
    ? ['rgba(30,30,30,0)', 'rgba(30,30,30,0.95)', bgColor]
    : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', bgColor];

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradientBg}
      />
      <View style={[styles.content, { backgroundColor: theme.bg.card }]}>
        <AnimatedPressable
          style={[animatedStyle, loading && { opacity: 0.7 }]}
          onPress={onFinish}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
        >
          <LinearGradient
            colors={[theme.brand.primary, BRAND.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>{buttonLabel}</Text>
                <View style={styles.iconWrap}>
                  <MaterialIcons name="check" size={18} color={theme.brand.primary} />
                </View>
              </>
            )}
          </LinearGradient>
        </AnimatedPressable>
        <Text style={[styles.footerText, { color: theme.text.tertiary }]}>You can change these anytime in settings</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradientBg: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 14,
  },
});
