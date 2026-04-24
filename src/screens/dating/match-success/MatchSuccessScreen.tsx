/**
 * Match Success Screen
 *
 * Celebration screen khi match thành công
 * Với confetti, animations, và haptic feedback
 * Redesigned with new design system
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  BUTTON,
  SPRING,
  DURATION,
  MATCH_CELEBRATION,
  SEMANTIC,
  BRAND,
} from '../../../constants/dating/design-system';
import { useAuthStore } from '../../../store/slices/authSlice';
import datingChatService from '../../../services/dating/datingChatService';
import type { RootStackParamList } from '../../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'DatingMatchSuccess'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PHOTO_SIZE = 140;
const HEART_SIZE = 72;

// Confetti colors from design system
const CONFETTI_COLORS = MATCH_CELEBRATION.confetti.colors;

// ═══════════════════════════════════════════════════════════════
// CONFETTI PARTICLE
// ═══════════════════════════════════════════════════════════════

interface ConfettiParticleProps {
  index: number;
  color: string;
}

const ConfettiParticle: React.FC<ConfettiParticleProps> = ({ index, color }) => {
  const translateY = useSharedValue(-100);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const startX = Math.random() * SCREEN_WIDTH;
  const endX = startX + (Math.random() - 0.5) * 300;
  const duration = 2500 + Math.random() * 1500;
  const delay = MATCH_CELEBRATION.timeline.confettiStart + Math.random() * 400;
  const size = 10 + Math.random() * 10;
  const isCircle = Math.random() > 0.5;

  useEffect(() => {
    // Fade in + scale up
    opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    scale.value = withDelay(delay, withSpring(1, SPRING.bouncy));

    // Fall down with drift
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 200, {
        duration,
        easing: Easing.out(Easing.quad),
      }),
    );

    // Horizontal drift
    translateX.value = withDelay(
      delay,
      withTiming(endX - startX, {
        duration,
        easing: Easing.inOut(Easing.sin),
      }),
    );

    // Spin
    rotate.value = withDelay(
      delay,
      withRepeat(
        withTiming(360 * (Math.random() > 0.5 ? 1 : -1), {
          duration: 1000 + Math.random() * 1000,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );

    // Fade out near end
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          left: startX,
          width: size,
          height: isCircle ? size : size * 0.5,
          backgroundColor: color,
          borderRadius: isCircle ? size / 2 : size * 0.1,
        },
        animatedStyle,
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFILE PHOTO WITH GLOW
// ═══════════════════════════════════════════════════════════════

interface ProfilePhotoProps {
  uri?: string;
  side: 'left' | 'right';
  delay: number;
}

const ProfilePhoto: React.FC<ProfilePhotoProps> = ({ uri, side, delay }) => {
  const { theme } = useDatingTheme();

  const scale = useSharedValue(0);
  const rotate = useSharedValue(side === 'left' ? -30 : 30);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(side === 'left' ? -150 : 150);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);

  useEffect(() => {
    // Enter from sides
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateX.value = withDelay(
      delay,
      withSpring(side === 'left' ? -15 : 15, SPRING.bouncy),
    );
    scale.value = withDelay(delay, withSpring(1, SPRING.bouncy));

    // Rotate to slight tilt
    rotate.value = withDelay(
      delay + 200,
      withSpring(side === 'left' ? -8 : 8, SPRING.smooth),
    );

    // Glow pulse after collision
    const glowDelay = MATCH_CELEBRATION.timeline.photosCollide;
    glowOpacity.value = withDelay(
      glowDelay,
      withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0.4, { duration: 300 }),
      ),
    );
    glowScale.value = withDelay(
      glowDelay,
      withSequence(
        withSpring(1.3, SPRING.bouncy),
        withSpring(1.1, SPRING.smooth),
      ),
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Animated.View style={[styles.photoWrapper, containerStyle]}>
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.photoGlow,
          {
            backgroundColor: BRAND.primary,
            shadowColor: BRAND.primary,
          },
          glowStyle,
        ]}
      />

      {/* Photo container */}
      <View
        style={[
          styles.photoContainer,
          {
            borderColor: theme.bg.base,
            backgroundColor: theme.bg.surface,
          },
        ]}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.photo} />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: theme.bg.surface }]}>
            <Ionicons name="person" size={50} color={theme.text.muted} />
          </View>
        )}
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// ANIMATED HEART
// ═══════════════════════════════════════════════════════════════

const AnimatedHeart: React.FC = () => {
  const scale = useSharedValue(0);
  const rotate = useSharedValue(0);
  const innerScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.5);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    const heartDelay = MATCH_CELEBRATION.timeline.heartExplosion;

    // Main heart pop in
    scale.value = withDelay(
      heartDelay,
      withSequence(
        withSpring(1.5, { damping: 8, stiffness: 300 }),
        withSpring(1, SPRING.bouncy),
      ),
    );

    // Wiggle
    rotate.value = withDelay(
      heartDelay + 100,
      withSequence(
        withTiming(-15, { duration: 80 }),
        withTiming(15, { duration: 80 }),
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(0, { duration: 80 }),
      ),
    );

    // Inner heart beat
    innerScale.value = withDelay(
      heartDelay + 300,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        3,
        true,
      ),
    );

    // Glow
    glowOpacity.value = withDelay(
      heartDelay,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.5, { duration: 500 }),
      ),
    );

    // Expanding ring
    ringScale.value = withDelay(heartDelay, withTiming(2.5, { duration: 600 }));
    ringOpacity.value = withDelay(
      heartDelay,
      withSequence(
        withTiming(0.6, { duration: 100 }),
        withTiming(0, { duration: 500 }),
      ),
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Animated.View style={[styles.heartContainer, containerStyle]}>
      {/* Expanding ring */}
      <Animated.View
        style={[
          styles.heartRing,
          { borderColor: BRAND.primary },
          ringStyle,
        ]}
      />

      {/* Glow */}
      <Animated.View
        style={[
          styles.heartGlow,
          { backgroundColor: BRAND.primaryMuted },
          glowStyle,
        ]}
      />

      {/* Heart background */}
      <LinearGradient
        colors={[BRAND.primary, BRAND.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heartBg}
      >
        <Animated.View style={innerStyle}>
          <MaterialCommunityIcons name="heart" size={36} color="#FFFFFF" />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// SPARKLE PARTICLES
// ═══════════════════════════════════════════════════════════════

const Sparkles: React.FC = () => {
  const sparkles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const distance = 80 + Math.random() * 40;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: MATCH_CELEBRATION.timeline.heartExplosion + i * 30,
      size: 4 + Math.random() * 4,
    };
  });

  return (
    <>
      {sparkles.map((s, i) => (
        <SparkleParticle key={i} {...s} />
      ))}
    </>
  );
};

interface SparkleProps {
  x: number;
  y: number;
  delay: number;
  size: number;
}

const SparkleParticle: React.FC<SparkleProps> = ({ x, y, delay, size }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withTiming(x, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(y, { duration: 400 }));
    scale.value = withDelay(
      delay,
      withSequence(
        withSpring(1, { damping: 5, stiffness: 400 }),
        withDelay(200, withTiming(0, { duration: 300 })),
      ),
    );
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(300, withTiming(0, { duration: 200 })),
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sparkle,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    />
  );
};

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

const MatchSuccessInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { theme, isDark } = useDatingTheme();
  const currentUser = useAuthStore((s) => s.user);

  const { profile, isSuperLike } = route.params as any;
  const matchedUser = profile?.user;

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.6);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(60);
  const buttonsOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'success' | 'heavy' = 'success') => {
    if (type === 'heavy') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  useEffect(() => {
    const { timeline } = MATCH_CELEBRATION;

    // Background overlay
    overlayOpacity.value = withTiming(1, { duration: 300 });

    // First haptic
    setTimeout(() => triggerHaptic('heavy'), timeline.hapticFirst);

    // Second haptic on collision
    setTimeout(() => triggerHaptic('success'), timeline.hapticSecond);

    // Title animation
    titleOpacity.value = withDelay(
      timeline.textReveal,
      withTiming(1, { duration: 300 }),
    );
    titleScale.value = withDelay(
      timeline.textReveal,
      withSpring(1, SPRING.bouncy),
    );
    titleTranslateY.value = withDelay(
      timeline.textReveal,
      withSpring(0, SPRING.smooth),
    );

    // Subtitle
    subtitleOpacity.value = withDelay(
      timeline.textReveal + 150,
      withTiming(1, { duration: 300 }),
    );

    // Buttons
    buttonsOpacity.value = withDelay(
      timeline.buttonsEnter,
      withTiming(1, { duration: 300 }),
    );
    buttonsTranslateY.value = withDelay(
      timeline.buttonsEnter,
      withSpring(0, SPRING.smooth),
    );
  }, []);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [
      { scale: titleScale.value },
      { translateY: titleTranslateY.value },
    ],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  // Handlers
  const handleSendMessage = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const conv = await datingChatService.getOrCreateConversation(matchedUser?.id);
      navigation.replace('DatingChatRoom', {
        conversationId: conv.id,
        otherUser: {
          id: matchedUser?.id,
          fullName: matchedUser?.fullName,
          avatar: matchedUser?.avatar,
        },
      });
    } catch {
      navigation.replace('DatingTabs', { screen: 'DatingChatsTab' });
    }
  }, [navigation, matchedUser]);

  const handleKeepSwiping = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      {/* Animated gradient background */}
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
        <LinearGradient
          colors={[
            isDark ? 'rgba(255, 68, 88, 0.15)' : 'rgba(255, 68, 88, 0.08)',
            theme.bg.base,
            theme.bg.base,
          ]}
          style={StyleSheet.absoluteFill}
          locations={[0, 0.5, 1]}
        />
      </Animated.View>

      {/* Confetti */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {Array.from({ length: MATCH_CELEBRATION.confetti.count }).map((_, i) => (
          <ConfettiParticle
            key={i}
            index={i}
            color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          />
        ))}
      </View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Photos Section */}
        <View style={styles.photosSection}>
          <ProfilePhoto
            uri={currentUser?.avatar}
            side="left"
            delay={MATCH_CELEBRATION.timeline.photosEnter}
          />

          <View style={styles.heartWrapper}>
            <Sparkles />
            <AnimatedHeart />
          </View>

          <ProfilePhoto
            uri={matchedUser?.avatar || profile?.photos?.[0]?.url}
            side="right"
            delay={MATCH_CELEBRATION.timeline.photosEnter + 100}
          />
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          {isSuperLike && (
            <Animated.View style={[styles.superLikeBadge, titleStyle]}>
              <MaterialCommunityIcons name="star" size={24} color="#FFD700" />
              <Text style={styles.superLikeText}>Super Like</Text>
            </Animated.View>
          )}
          <Animated.Text
            style={[
              styles.title,
              { color: BRAND.primary },
              titleStyle,
            ]}
          >
            It's a Match!
          </Animated.Text>
          <Animated.Text
            style={[
              styles.subtitle,
              { color: theme.text.secondary },
              subtitleStyle,
            ]}
          >
            Ban va {matchedUser?.fullName || 'nguoi ay'} da thich nhau
          </Animated.Text>
        </View>

        {/* Buttons Section */}
        <Animated.View style={[styles.buttonsSection, buttonsStyle]}>
          <TouchableOpacity
            style={[styles.primaryButton]}
            onPress={handleSendMessage}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[BRAND.primary, BRAND.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <MaterialCommunityIcons name="message-text" size={22} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Gui tin nhan</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: theme.bg.surface },
            ]}
            onPress={handleKeepSwiping}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.text.primary }]}>
              Tiep tuc kham pha
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const MatchSuccessScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <MatchSuccessInner />
    </DatingThemeProvider>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },

  // Confetti
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    top: -100,
  },

  // Photos
  photosSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  photoWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoGlow: {
    position: 'absolute',
    width: PHOTO_SIZE + 20,
    height: PHOTO_SIZE + 20,
    borderRadius: (PHOTO_SIZE + 20) / 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 10,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    borderWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Heart
  heartWrapper: {
    width: HEART_SIZE + 40,
    height: HEART_SIZE + 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -25,
    zIndex: 10,
  },
  heartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartRing: {
    position: 'absolute',
    width: HEART_SIZE,
    height: HEART_SIZE,
    borderRadius: HEART_SIZE / 2,
    borderWidth: 3,
  },
  heartGlow: {
    position: 'absolute',
    width: HEART_SIZE + 30,
    height: HEART_SIZE + 30,
    borderRadius: (HEART_SIZE + 30) / 2,
  },
  heartBg: {
    width: HEART_SIZE,
    height: HEART_SIZE,
    borderRadius: HEART_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },

  // Sparkles
  sparkle: {
    position: 'absolute',
    backgroundColor: BRAND.primary,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },

  // Text
  textSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  superLikeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  superLikeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFD700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT_STYLES.bodyLarge,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Buttons
  buttonsSection: {
    width: '100%',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  primaryButton: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  primaryButtonText: {
    ...TEXT_STYLES.buttonLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: RADIUS.full,
  },
  secondaryButtonText: {
    ...TEXT_STYLES.buttonLarge,
    fontWeight: '600',
  },
});

export default MatchSuccessScreen;
