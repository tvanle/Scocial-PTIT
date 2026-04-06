/**
 * Dating Likes Screen
 *
 * Grid of profiles who liked you
 * Using new dating design system
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  DURATION,
  SPRING,
} from '../../../constants/dating/design-system';
import datingService from '../../../services/dating/datingService';
import datingPaymentService from '../../../services/dating/datingPaymentService';
import type { DiscoveryCard, RootStackParamList } from '../../../types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_W } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const CARD_GAP = SPACING.sm;
const CARD_WIDTH = (SCREEN_W - SPACING.md * 2 - CARD_GAP) / NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

// ═══════════════════════════════════════════════════════════════
// LIKE CARD
// ═══════════════════════════════════════════════════════════════

interface LikeCardProps {
  item: DiscoveryCard & { isBlurred?: boolean; isSuperLike?: boolean };
  index: number;
  onPress: (item: DiscoveryCard) => void;
  isBlurred?: boolean;
  isSuperLike?: boolean;
  onUpgradePress?: () => void;
}

const LikeCard: React.FC<LikeCardProps> = React.memo(({ item, index, onPress, isBlurred, isSuperLike, onUpgradePress }) => {
  const { theme } = useDatingTheme();
  const scale = useSharedValue(1);

  const name = isBlurred ? '???' : (item.user.fullName ?? 'Ai đó');
  const age = item.user.dateOfBirth
    ? new Date().getFullYear() - new Date(item.user.dateOfBirth).getFullYear()
    : null;

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, SPRING.snappy);
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING.snappy);
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isBlurred && onUpgradePress) {
      onUpgradePress();
    } else {
      onPress(item);
    }
  }, [item, onPress, isBlurred, onUpgradePress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const row = Math.floor(index / NUM_COLUMNS);
  const col = index % NUM_COLUMNS;
  const delay = (row + col) * 50;

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(DURATION.normal).springify()}
      style={[styles.cardWrapper, { marginRight: col === 0 ? CARD_GAP : 0 }]}
    >
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.bg.surface }]}
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          {item.photos[0]?.url ? (
            <Image
              source={{ uri: item.photos[0].url }}
              style={styles.cardImage}
              resizeMode="cover"
              blurRadius={isBlurred ? 25 : 0}
            />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder, { backgroundColor: theme.bg.elevated }]}>
              <Ionicons name="person" size={40} color={theme.text.muted} />
            </View>
          )}

          {/* Like badge */}
          <View style={[
            styles.likeBadge,
            { backgroundColor: isSuperLike ? '#F59E0B' : theme.semantic.like.main }
          ]}>
            <MaterialCommunityIcons
              name={isSuperLike ? 'star' : 'heart'}
              size={12}
              color="#FFFFFF"
            />
            <Text style={styles.likeBadgeText}>
              {isSuperLike ? 'Super Like' : 'Thích bạn'}
            </Text>
          </View>

          {/* Blurred overlay with lock icon */}
          {isBlurred && (
            <View style={styles.blurOverlay}>
              <View style={[styles.lockContainer, { backgroundColor: theme.brand.primary }]}>
                <Ionicons name="lock-closed" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.unlockText}>Mở khóa</Text>
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.cardGradient}
          >
            <Text style={styles.cardName} numberOfLines={1}>
              {name}{!isBlurred && age ? `, ${age}` : ''}
            </Text>
            {!isBlurred && item.bio && (
              <Text style={styles.cardBio} numberOfLines={1}>
                {item.bio}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

const LikesInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useDatingTheme();

  const {
    data: incomingLikes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['dating', 'likes', 'incoming'],
    queryFn: () => datingService.getIncomingLikes({ page: 1, limit: 50 }),
  });

  // Check subscription status
  const { data: subscriptionData } = useQuery({
    queryKey: ['dating', 'subscription'],
    queryFn: () => datingPaymentService.getSubscriptionInfo(),
  });

  const canSeeLikes = subscriptionData?.subscription?.limits?.canSeeLikes ?? false;
  const listData = incomingLikes?.data ?? [];

  const handleCardPress = useCallback(
    (card: DiscoveryCard) => {
      navigation.navigate('DatingProfileDetail', { profile: card });
    },
    [navigation],
  );

  const handleBackPress = useCallback(() => {
    navigation.navigate('Main' as any);
  }, [navigation]);

  const handleUpgradePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('DatingPremium');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: DiscoveryCard & { isBlurred?: boolean; isSuperLike?: boolean }; index: number }) => (
      <LikeCard
        item={item}
        index={index}
        onPress={handleCardPress}
        isBlurred={item.isBlurred || !canSeeLikes}
        isSuperLike={item.isSuperLike}
        onUpgradePress={handleUpgradePress}
      />
    ),
    [handleCardPress, canSeeLikes, handleUpgradePress],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="heart" size={18} color={theme.semantic.like.main} />
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
              Lượt thích
            </Text>
            {listData.length > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: theme.semantic.like.main }]}>
                <Text style={styles.headerBadgeText}>{listData.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('DatingNotifications')}>
            <Ionicons name="notifications-outline" size={22} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Premium Banner */}
        {!canSeeLikes && listData.length > 0 && (
          <TouchableOpacity
            style={[styles.premiumBanner, { backgroundColor: theme.brand.primary }]}
            onPress={handleUpgradePress}
            activeOpacity={0.9}
          >
            <View style={styles.premiumBannerContent}>
              <Ionicons name="diamond" size={24} color="#FFFFFF" />
              <View style={styles.premiumBannerText}>
                <Text style={styles.premiumBannerTitle}>
                  {listData.length} người đã thích bạn!
                </Text>
                <Text style={styles.premiumBannerSubtitle}>
                  Nâng cấp Premium để xem họ là ai
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Content */}
        <FlatList
          data={listData}
          keyExtractor={(item) => item.userId}
          numColumns={NUM_COLUMNS}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            listData.length === 0 && styles.emptyListContent,
          ]}
          columnWrapperStyle={styles.columnWrapper}
          refreshing={isLoading}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !isLoading ? (
              <Animated.View entering={FadeIn.duration(DURATION.slow)} style={styles.emptyContainer}>
                <View style={[styles.emptyIconOuter, { backgroundColor: theme.semantic.like.light }]}>
                  <MaterialCommunityIcons
                    name="heart-outline"
                    size={48}
                    color={theme.semantic.like.main}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
                  Chưa có lượt thích mới
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.text.muted }]}>
                  Khi ai đó thích hồ sơ của bạn, họ sẽ xuất hiện ở đây
                </Text>
              </Animated.View>
            ) : null
          }
        />
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DatingLikesScreen: React.FC = () => {
  return <LikesInner />;
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  headerTitle: {
    ...TEXT_STYLES.headingMedium,
  },
  headerBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  headerBadgeText: {
    ...TEXT_STYLES.labelSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // List
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  columnWrapper: {
    marginBottom: CARD_GAP,
  },

  // Card
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  likeBadgeText: {
    ...TEXT_STYLES.tiny,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingTop: SPACING.xl,
  },
  cardName: {
    ...TEXT_STYLES.labelLarge,
    color: '#FFFFFF',
  },
  cardBio: {
    ...TEXT_STYLES.tiny,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Blur overlay
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  lockContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  unlockText: {
    ...TEXT_STYLES.labelSmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  premiumBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  premiumBannerText: {
    flex: 1,
  },
  premiumBannerTitle: {
    ...TEXT_STYLES.labelLarge,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  premiumBannerSubtitle: {
    ...TEXT_STYLES.tiny,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    ...TEXT_STYLES.headingMedium,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default DatingLikesScreen;
