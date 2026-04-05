/**
 * Dating Paused Screen
 *
 * Screen shown when user has paused their dating profile
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, RADIUS, TEXT_STYLES, DURATION } from '../../../constants/dating/design-system';
import datingService from '../../../services/dating/datingService';
import type { RootStackParamList } from '../../../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PausedInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { theme } = useDatingTheme();
  const [isResuming, setIsResuming] = useState(false);

  const handleResume = useCallback(async () => {
    setIsResuming(true);
    try {
      await datingService.updateProfile({ isActive: true });
      queryClient.invalidateQueries({ queryKey: ['dating'] });
      navigation.replace('DatingTabs');
    } catch {
      Alert.alert('Loi', 'Khong the kich hoat lai ho so. Vui long thu lai.');
    } finally {
      setIsResuming(false);
    }
  }, [navigation, queryClient]);

  const handleBackToSocial = useCallback(() => {
    navigation.navigate('Main');
  }, [navigation]);

  const handleDeleteProfile = useCallback(() => {
    Alert.alert(
      'Xoa ho so hen ho',
      'Ho so hen ho cua ban se bi xoa vinh vien. Ban co chac khong?',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Xoa',
          style: 'destructive',
          onPress: async () => {
            try {
              await datingService.deleteProfile();
              queryClient.invalidateQueries({ queryKey: ['dating'] });
              navigation.replace('DatingSplash');
            } catch {
              Alert.alert('Loi', 'Khong the xoa ho so. Vui long thu lai.');
            }
          },
        },
      ],
    );
  }, [navigation, queryClient]);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.bg.elevated }]}
            onPress={handleBackToSocial}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Animated.View
            entering={FadeIn.duration(DURATION.slow)}
            style={[styles.iconContainer, { backgroundColor: theme.semantic.like.light }]}
          >
            <Ionicons name="pause-circle" size={80} color={theme.brand.primary} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).duration(DURATION.normal)}>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              Ho so dang tam dung
            </Text>
            <Text style={[styles.subtitle, { color: theme.text.muted }]}>
              Ho so hen ho cua ban hien khong hien thi voi nguoi khac. Kich hoat lai de tiep tuc kham pha.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(400).duration(DURATION.normal)}
            style={styles.actions}
          >
            <TouchableOpacity
              style={[styles.resumeBtn, { backgroundColor: theme.brand.primary }]}
              onPress={handleResume}
              disabled={isResuming}
              activeOpacity={0.8}
            >
              {isResuming ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="heart" size={20} color="#fff" />
                  <Text style={styles.resumeBtnText}>Kich hoat lai</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteProfile}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={theme.semantic.nope.main} />
              <Text style={[styles.deleteBtnText, { color: theme.semantic.nope.main }]}>
                Xoa ho so hen ho
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export const DatingPausedScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <PausedInner />
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
  header: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    ...TEXT_STYLES.headingLarge,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xxl,
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 52,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  resumeBtnText: {
    ...TEXT_STYLES.labelLarge,
    color: '#fff',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.sm,
  },
  deleteBtnText: {
    ...TEXT_STYLES.labelMedium,
  },
});

export default DatingPausedScreen;
