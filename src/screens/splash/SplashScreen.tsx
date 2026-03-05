import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, FontWeight } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo fade in + scale up
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Content fade in
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Progress bar (can't use native driver for width)
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }),
      // Hold briefly
      Animated.delay(300),
      // Fade out
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, []);

  const barWidth = progressWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width * 0.4],
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeOut }]}>
      {/* Background glow */}
      <View style={styles.glowCircle} />

      {/* Logo */}
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleRow, { opacity: contentOpacity }]}>
        <Animated.Text style={styles.titleLight}>Social </Animated.Text>
        <Animated.Text style={styles.titleBold}>PTIT</Animated.Text>
      </Animated.View>

      {/* Divider + UNIVERSITY NETWORK */}
      <Animated.View style={[styles.dividerRow, { opacity: contentOpacity }]}>
        <View style={styles.dividerLine} />
        <Animated.Text style={styles.subtitle}>UNIVERSITY NETWORK</Animated.Text>
        <View style={styles.dividerLine} />
      </Animated.View>

      {/* CONNECTING... */}
      <Animated.Text style={[styles.connecting, { opacity: contentOpacity }]}>
        CONNECTING...
      </Animated.Text>

      {/* Progress bar */}
      <Animated.View style={[styles.progressTrack, { opacity: contentOpacity }]}>
        <Animated.View style={[styles.progressBar, { width: barWidth }]} />
      </Animated.View>

      {/* Footer */}
      <Animated.Text style={[styles.footer, { opacity: contentOpacity }]}>
        OFFICIAL UNIVERSITY APP
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  glowCircle: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(179, 38, 30, 0.04)',
    top: '28%',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  titleLight: {
    fontSize: 36,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  titleBold: {
    fontSize: 36,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  dividerLine: {
    width: 40,
    height: 1.5,
    backgroundColor: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: FontWeight.semiBold,
    color: Colors.primary,
    letterSpacing: 3,
  },
  connecting: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
    letterSpacing: 2,
    marginBottom: 10,
  },
  progressTrack: {
    width: width * 0.4,
    height: 3,
    backgroundColor: Colors.gray200,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 32,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  footer: {
    fontSize: 11,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
});

export default SplashScreen;
