/**
 * Dating Discovery Screen
 *
 * Redesigned với card stack, gestures, và action buttons
 */

import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import {
  CardStack,
  CardStackRef,
  ActionButtonsBar,
  ProfileData,
  SwipeDirection,
} from '../components';
import { DatingFilterForm } from '../components/DatingFilterForm';
import { DiscoveryHeader } from './components/DiscoveryHeader';
import { DiscoveryEmptyState } from './components/DiscoveryEmptyState';
import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  SPACING,
  ACTION_BAR,
  TAB_BAR,
  RADIUS,
} from '../../../constants/dating/design-system';
import { useDiscoveryFeed } from '../discovery/hooks/useDiscoveryFeed';
import { calculateAge } from '../../../utils/dating';
import datingService from '../../../services/dating/datingService';
import type { RootStackParamList, DiscoveryCard } from '../../../types';
import type { DatingFilterValues } from '../../../types/dating';
import { useDatingDistance } from '../../../hooks/useDatingDistance';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ═══════════════════════════════════════════════════════════════
// TRANSFORM DATA
// ═══════════════════════════════════════════════════════════════

const transformToProfileData = (card: DiscoveryCard): ProfileData => ({
  userId: card.userId,
  name: card.user.fullName ?? 'Unknown',
  age: calculateAge(card.user.dateOfBirth),
  images: card.photos.map((p) => p.url),
  isVerified: true, // TODO: Add verification status
  distance: card.distanceKm,
  education: card.lifestyle?.education ?? undefined,
  bio: card.bio ?? undefined,
  tags: [], // TODO: Map interests to tags
});

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT (uses theme)
// ═══════════════════════════════════════════════════════════════

const DiscoveryScreenInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useDatingTheme();
  const queryClient = useQueryClient();
  const cardStackRef = useRef<CardStackRef>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<Partial<DatingFilterValues> | null>(null);

  // Location/Distance hook
  const { requestAndUpdate: updateLocation, hasPermission } = useDatingDistance();

  // Use existing hook
  const {
    currentCard,
    isLoading,
    isEmpty,
    isProfileMissing,
    swipe,
    isSwiping,
    isMatched,
    matchedCard,
    consumeMatch,
    refresh,
  } = useDiscoveryFeed();

  // Refresh on focus and update location
  useFocusEffect(
    useCallback(() => {
      refresh();

      // Update location if permission granted
      if (hasPermission) {
        updateLocation();
      }
    }, [refresh, hasPermission, updateLocation]),
  );

  // Handle match
  React.useEffect(() => {
    if (!isMatched || !matchedCard) return;

    const profile = matchedCard;
    consumeMatch();

    // Haptic for match
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    navigation.navigate('DatingMatchSuccess', {
      profile,
      matchedUserId: profile.userId,
    } as any);
  }, [isMatched, matchedCard, navigation, consumeMatch]);

  // Transform cards for stack
  const profiles = useMemo<ProfileData[]>(() => {
    if (!currentCard) return [];

    // Get current and next few cards
    // For now, just use current card
    // TODO: Prefetch multiple cards
    return [transformToProfileData(currentCard)];
  }, [currentCard]);

  // Handle swipe
  const handleSwipe = useCallback(
    async (profile: ProfileData, direction: SwipeDirection) => {
      try {
        if (direction === 'left') {
          await swipe({ targetUserId: profile.userId, action: 'UNLIKE' });
        } else if (direction === 'right') {
          await swipe({ targetUserId: profile.userId, action: 'LIKE' });
        }
      } catch {
        // Silently ignore swipe errors
      }
    },
    [swipe],
  );

  // Handle swipe up (view profile)
  const handleSwipeUp = useCallback(
    (profile: ProfileData) => {
      if (!currentCard) return;
      navigation.navigate('DatingProfileDetail', { profile: currentCard });
    },
    [currentCard, navigation],
  );

  // Handle card tap (view profile)
  const handleCardPress = useCallback(
    (profile: ProfileData) => {
      if (!currentCard) return;
      navigation.navigate('DatingProfileDetail', { profile: currentCard });
    },
    [currentCard, navigation],
  );

  // Action button handlers
  const handleNope = useCallback(() => {
    cardStackRef.current?.swipeLeft();
  }, []);

  const handleLike = useCallback(() => {
    cardStackRef.current?.swipeRight();
  }, []);

  const handleSuperLike = useCallback(async () => {
    if (!currentCard) return;

    // Haptic for super like
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // TODO: Implement super like API
      await swipe({ targetUserId: currentCard.userId, action: 'LIKE' });
    } catch {
      // Silently ignore errors
    }
  }, [currentCard, swipe]);

  // Navigation handlers
  const handleBackToSocial = useCallback(() => {
    navigation.navigate('Main' as any);
  }, [navigation]);

  const handleFilterPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterVisible(true);
  }, []);

  const handleFilterClose = useCallback(() => {
    setFilterVisible(false);
  }, []);

  const handleFilterApply = useCallback(async (values: DatingFilterValues) => {
    setFilterLoading(true);
    try {
      // Update preferences in backend
      await datingService.updatePreferences({
        ageMin: values.ageMin,
        ageMax: values.ageMax,
        gender: values.preferredGender ?? undefined,
        maxDistance: values.maxDistanceKm,
        preferredMajors: values.preferredMajor ? [values.preferredMajor] : [],
        sameYearOnly: values.sameYearOnly,
      });

      // Save current filter state
      setCurrentFilter(values);

      // Invalidate feed to refresh with new filters
      queryClient.invalidateQueries({ queryKey: ['dating', 'feed'] });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFilterVisible(false);

      // Refresh feed
      refresh();
    } catch (error) {
      console.error('Failed to apply filter:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setFilterLoading(false);
    }
  }, [queryClient, refresh]);

  const handleNotificationsPress = useCallback(() => {
    navigation.navigate('DatingNotifications');
  }, [navigation]);

  // Render states
  const renderContent = () => {
    if (isLoading && profiles.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[styles.loadingText, { color: theme.text.muted }]}>
            Đang tìm kiếm...
          </Text>
        </View>
      );
    }

    if (isProfileMissing) {
      return (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorTitle, { color: theme.text.primary }]}>
            Chưa có hồ sơ hẹn hò
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.text.muted }]}>
            Tạo hồ sơ để bắt đầu khám phá
          </Text>
        </View>
      );
    }

    if (isEmpty || profiles.length === 0) {
      return <DiscoveryEmptyState onRefinePreferences={handleFilterPress} />;
    }

    return (
      <CardStack
        ref={cardStackRef}
        profiles={profiles}
        onSwipe={handleSwipe}
        onSwipeUp={handleSwipeUp}
        onCardPress={handleCardPress}
        isProcessing={isSwiping}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <DiscoveryHeader
          onBackPress={handleBackToSocial}
          onFilterPress={handleFilterPress}
          onNotificationsPress={handleNotificationsPress}
        />

        {/* Card Stack */}
        <View style={styles.cardContainer}>{renderContent()}</View>
      </SafeAreaView>

      {/* Action Buttons - positioned above Tab Bar */}
      {!isEmpty && !isProfileMissing && profiles.length > 0 && (
        <View style={styles.actionBarWrapper}>
          <ActionButtonsBar
            onNope={handleNope}
            onSuperLike={handleSuperLike}
            onLike={handleLike}
            isProcessing={isSwiping}
          />
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="slide"
        onRequestClose={handleFilterClose}
      >
        <Pressable style={styles.modalOverlay} onPress={handleFilterClose}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContentWrap}
          >
            <Pressable
              style={[styles.modalContent, { backgroundColor: theme.bg.base }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />
              <ScrollView
                style={styles.modalScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <DatingFilterForm
                  initialValues={currentFilter ?? undefined}
                  onApply={handleFilterApply}
                  loading={filterLoading}
                />
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DatingDiscoveryScreen: React.FC = () => {
  return <DiscoveryScreenInner />;
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
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: TAB_BAR.height + ACTION_BAR.height + SPACING.sm,
  },
  actionBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TAB_BAR.height,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  errorSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    paddingBottom: SPACING.xl,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  modalScroll: {
    paddingHorizontal: SPACING.md,
  },
});

export default DatingDiscoveryScreen;
