import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { FontSize, Spacing } from '../../constants/theme';

interface VoiceMessageProps {
  uri: string;
  duration?: number;
  isOwn: boolean;
  colors: any;
}

const BAR_COUNT = 28;

const VoiceMessage: React.FC<VoiceMessageProps> = ({ uri, duration, isOwn, colors }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(duration || 0);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Fixed waveform pattern (seeded by uri for consistency)
  const waveformHeights = useMemo(() => {
    const seed = uri.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return Array.from({ length: BAR_COUNT }).map((_, i) => {
      const pseudo = Math.sin(seed + i * 0.5) * 0.5 + 0.5;
      return 6 + pseudo * 18;
    });
  }, [uri]);

  // Animated values for each bar
  const barAnimations = useRef(
    Array.from({ length: BAR_COUNT }).map(() => new Animated.Value(0))
  ).current;

  // Progress animation
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Animate bars when playing
  useEffect(() => {
    if (isPlaying) {
      const animations = barAnimations.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 300 + (index % 5) * 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 300 + (index % 5) * 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        );
      });

      const staggered = Animated.stagger(30, animations);
      staggered.start();

      return () => {
        staggered.stop();
        barAnimations.forEach(anim => anim.setValue(0));
      };
    } else {
      barAnimations.forEach(anim => anim.setValue(0));
    }
  }, [isPlaying, barAnimations]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadAndPlaySound = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing sound:', err);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis / 1000);
      if (status.durationMillis) {
        setPlaybackDuration(status.durationMillis / 1000);
      }

      const progress = status.durationMillis
        ? status.positionMillis / status.durationMillis
        : 0;

      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 100,
        useNativeDriver: false,
        easing: Easing.linear,
      }).start();

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
        progressAnim.setValue(0);
      }
    }
  };

  const progress = playbackDuration > 0 ? playbackPosition / playbackDuration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.playButton,
          { backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : colors.primary },
        ]}
        onPress={loadAndPlaySound}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color={colors.white}
          style={isPlaying ? undefined : { marginLeft: 2 }}
        />
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {waveformHeights.map((height, i) => {
            const isActive = i / BAR_COUNT <= progress;

            const animatedScale = barAnimations[i].interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1.4],
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height,
                    backgroundColor: isOwn
                      ? isActive ? colors.white : 'rgba(255,255,255,0.35)'
                      : isActive ? colors.primary : colors.gray300,
                    transform: isPlaying ? [{ scaleY: animatedScale }] : [],
                  },
                ]}
              />
            );
          })}
        </View>

        <Text style={[styles.duration, { color: isOwn ? 'rgba(255,255,255,0.85)' : colors.textTertiary }]}>
          {formatTime(isPlaying ? playbackPosition : playbackDuration)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    minWidth: 200,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
  },
  duration: {
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});

export default VoiceMessage;
