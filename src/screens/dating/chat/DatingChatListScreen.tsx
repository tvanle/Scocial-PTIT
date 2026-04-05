/**
 * Dating Chat List Screen
 *
 * Chat list with new matches carousel and conversations
 * Using new dating design system
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  DURATION,
  SPRING,
  AVATAR,
} from '../../../constants/dating/design-system';
import datingChatService from '../../../services/dating/datingChatService';
import datingService from '../../../services/dating/datingService';
import socketService from '../../../services/socket/socketService';
import { useAuthStore } from '../../../store/slices/authSlice';
import type { RootStackParamList } from '../../../types';
import type { DatingConversation, MatchItem, DatingChatUser } from '../../../types/dating';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Parse message content and return a displayable preview
 * Handles special message types like prompt_reply
 */
const getMessagePreview = (content: string | null | undefined): string => {
  if (!content) return 'Bắt đầu trò chuyện';

  try {
    const parsed = JSON.parse(content);
    console.log('[ChatList] Parsed preview:', parsed?.type);
    if (parsed?.type === 'prompt_reply' && parsed.reply) {
      return `💬 ${parsed.reply}`;
    }
  } catch {
    // Not JSON, return as-is
  }

  return content;
};

const { width: SCREEN_W } = Dimensions.get('window');
const MATCH_CARD_W = 80;
const MATCH_CARD_H = 100;

// ═══════════════════════════════════════════════════════════════
// NEW MATCH CARD
// ═══════════════════════════════════════════════════════════════

interface NewMatchItemProps {
  match: MatchItem;
  index: number;
  onPress: (match: MatchItem) => void;
}

const NewMatchItem: React.FC<NewMatchItemProps> = React.memo(({ match, index, onPress }) => {
  const { theme } = useDatingTheme();
  const photo = match.matchedUser.avatar;
  const firstName = match.matchedUser.fullName?.split(' ').pop() ?? 'Bạn';

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(match);
  }, [match, onPress]);

  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(DURATION.normal)}>
      <TouchableOpacity
        style={[styles.matchCard, { backgroundColor: theme.bg.surface }]}
        activeOpacity={0.85}
        onPress={handlePress}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={styles.matchCardImg} />
        ) : (
          <View style={[styles.matchCardImg, styles.matchCardPlaceholder, { backgroundColor: theme.bg.elevated }]}>
            <Ionicons name="person" size={28} color={theme.text.muted} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.matchCardGradient}
        >
          <Text style={styles.matchCardName} numberOfLines={1}>
            {firstName}
          </Text>
        </LinearGradient>
        <View style={[styles.matchNewBadge, { backgroundColor: theme.brand.primary }]}>
          <MaterialCommunityIcons name="heart" size={10} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

// ═══════════════════════════════════════════════════════════════
// CONVERSATION ITEM
// ═══════════════════════════════════════════════════════════════

interface ConvItemProps {
  item: DatingConversation;
  index: number;
  onPress: (item: DatingConversation) => void;
  onAvatarPress: (user: DatingChatUser) => void;
}

const ConversationItem: React.FC<ConvItemProps> = React.memo(
  ({ item, index, onPress, onAvatarPress }) => {
    const { theme } = useDatingTheme();
    const other = item.otherUser;
    const hasUnread = item.unreadCount > 0;

    const timeLabel = useMemo(() => {
      if (!item.lastMessageCreatedAt) return '';
      const d = new Date(item.lastMessageCreatedAt);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin}ph`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH}h`;
      const diffD = Math.floor(diffH / 24);
      if (diffD < 7) return `${diffD}d`;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }, [item.lastMessageCreatedAt]);

    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(item);
    }, [item, onPress]);

    return (
      <Animated.View entering={FadeInDown.delay(index * 30).duration(DURATION.normal)}>
        <TouchableOpacity
          style={[
            styles.convRow,
            { backgroundColor: hasUnread ? theme.brand.primaryMuted : 'transparent' },
          ]}
          activeOpacity={0.6}
          onPress={handlePress}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => other && onAvatarPress(other)}
            style={styles.convAvatarWrap}
          >
            {other?.avatar ? (
              <Image source={{ uri: other.avatar }} style={styles.convAvatar} />
            ) : (
              <View style={[styles.convAvatar, styles.convAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
                <Ionicons name="person" size={24} color={theme.text.muted} />
              </View>
            )}
            {hasUnread && (
              <View style={[styles.unreadDot, { backgroundColor: theme.semantic.online, borderColor: theme.bg.base }]} />
            )}
          </TouchableOpacity>

          <View style={styles.convBody}>
            <View style={styles.convTopRow}>
              <Text
                style={[
                  styles.convName,
                  { color: hasUnread ? theme.text.primary : theme.text.secondary },
                  hasUnread && styles.convNameUnread,
                ]}
                numberOfLines={1}
              >
                {other?.fullName ?? 'Người dùng'}
              </Text>
              {timeLabel ? (
                <Text
                  style={[
                    styles.convTime,
                    { color: hasUnread ? theme.brand.primary : theme.text.muted },
                  ]}
                >
                  {timeLabel}
                </Text>
              ) : null}
            </View>
            <View style={styles.convBottomRow}>
              <Text
                style={[
                  styles.convPreview,
                  { color: hasUnread ? theme.text.secondary : theme.text.muted },
                  hasUnread && styles.convPreviewUnread,
                ]}
                numberOfLines={1}
              >
                {getMessagePreview(item.lastMessageContent)}
              </Text>
              {hasUnread && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.brand.primary }]}>
                  <Text style={styles.unreadBadgeText}>
                    {item.unreadCount > 9 ? '9+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

// ═══════════════════════════════════════════════════════════════
// INNER COMPONENT
// ═══════════════════════════════════════════════════════════════

const ChatListInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useDatingTheme();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ['dating', 'chat', 'conversations'],
    queryFn: () => datingChatService.getConversations(),
  });

  const { data: matchesData, isLoading: loadingMatches } = useQuery({
    queryKey: ['dating', 'matches'],
    queryFn: () => datingService.getMatches({ page: '1', limit: '50' }),
  });

  useEffect(() => {
    const unsub = socketService.onNewMessage(() => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'chat', 'conversations'] });
    });
    return unsub;
  }, [queryClient]);

  const newMatches = useMemo(() => {
    if (!matchesData?.data) return [];
    const convsWithMessages = new Set(
      (conversations ?? [])
        .filter((c) => c.lastMessageContent)
        .map((c) => c.otherUser?.id)
        .filter(Boolean),
    );
    return matchesData.data.filter(
      (m) => m.matchedUser.id !== currentUser?.id && !convsWithMessages.has(m.matchedUser.id),
    );
  }, [matchesData?.data, conversations, currentUser?.id]);

  const handleMatchPress = useCallback(
    async (match: MatchItem) => {
      try {
        const conv = await datingChatService.getOrCreateConversation(match.matchedUser.id);
        navigation.navigate('DatingChatRoom', {
          conversationId: conv.id,
          otherUser: {
            id: match.matchedUser.id,
            fullName: match.matchedUser.fullName,
            avatar: match.matchedUser.avatar,
          },
        });
      } catch {
        navigation.navigate('DatingChatRoom', {
          conversationId: '',
          otherUser: {
            id: match.matchedUser.id,
            fullName: match.matchedUser.fullName,
            avatar: match.matchedUser.avatar,
          },
        });
      }
    },
    [navigation],
  );

  const handleConvPress = useCallback(
    (conv: DatingConversation) => {
      navigation.navigate('DatingChatRoom', {
        conversationId: conv.id,
        otherUser: conv.otherUser,
      });
    },
    [navigation],
  );

  const handleAvatarPress = useCallback(
    async (user: DatingChatUser) => {
      try {
        const profile = await datingService.getProfileByUserId(user.id);
        const card = {
          userId: user.id,
          bio: profile.bio ?? '',
          photos: profile.photos ?? [],
          prompts: profile.prompts?.map((p: any) => ({ question: p.question, answer: p.answer })),
          user: {
            id: profile.user?.id ?? user.id,
            fullName: profile.user?.fullName ?? user.fullName,
            avatar: profile.user?.avatar ?? user.avatar,
            dateOfBirth: profile.user?.dateOfBirth ?? '',
            gender: profile.user?.gender ?? null,
          },
          lifestyle: profile.lifestyle ?? null,
        };
        navigation.navigate('DatingProfileDetail', { profile: card as any });
      } catch {
        // silent
      }
    },
    [navigation],
  );

  const handleBackPress = useCallback(() => {
    navigation.navigate('Main' as any);
  }, [navigation]);

  const renderConv = useCallback(
    ({ item, index }: { item: DatingConversation; index: number }) => (
      <ConversationItem
        item={item}
        index={index}
        onPress={handleConvPress}
        onAvatarPress={handleAvatarPress}
      />
    ),
    [handleConvPress, handleAvatarPress],
  );

  const isLoading = loadingConvs || loadingMatches;
  const convList = conversations ?? [];
  const hasContent = newMatches.length > 0 || convList.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="heart" size={18} color={theme.brand.primary} />
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>
              Tin nhắn
            </Text>
          </View>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('DatingNotifications')}>
            <Ionicons name="notifications-outline" size={22} color={theme.text.primary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
          </View>
        ) : !hasContent ? (
          <View style={styles.center}>
            <Animated.View entering={FadeIn.duration(DURATION.slow)} style={styles.emptyIconOuter}>
              <View style={[styles.emptyIconInner, { backgroundColor: theme.brand.primaryMuted }]}>
                <MaterialCommunityIcons name="message-text-outline" size={40} color={theme.brand.primary} />
              </View>
            </Animated.View>
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              Chưa có cuộc trò chuyện
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text.muted }]}>
              Khi bạn match với ai đó, cuộc trò chuyện sẽ xuất hiện ở đây
            </Text>
          </View>
        ) : (
          <FlatList
            data={convList}
            keyExtractor={(item) => item.id}
            renderItem={renderConv}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                {newMatches.length > 0 && (
                  <View style={[styles.matchSection, { borderBottomColor: theme.border.subtle }]}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="star-four-points" size={16} color={theme.brand.primary} />
                      <Text style={[styles.sectionLabel, { color: theme.text.primary }]}>
                        Kết nối mới
                      </Text>
                      <View style={[styles.sectionCount, { backgroundColor: theme.brand.primary }]}>
                        <Text style={styles.sectionCountText}>{newMatches.length}</Text>
                      </View>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.matchCarousel}
                    >
                      {newMatches.map((m, i) => (
                        <NewMatchItem key={m.id} match={m} index={i} onPress={handleMatchPress} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {convList.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons name="message-text" size={16} color={theme.brand.primary} />
                    <Text style={[styles.sectionLabel, { color: theme.text.primary }]}>
                      Cuộc trò chuyện
                    </Text>
                  </View>
                )}
              </>
            }
            ListEmptyComponent={
              newMatches.length > 0 ? (
                <View style={styles.noConvsYet}>
                  <MaterialCommunityIcons name="message-outline" size={28} color={theme.text.muted} />
                  <Text style={[styles.noConvsTitle, { color: theme.text.secondary }]}>
                    Chưa có tin nhắn nào
                  </Text>
                  <Text style={[styles.noConvsText, { color: theme.text.muted }]}>
                    Nhấn vào một kết nối mới để bắt đầu trò chuyện!
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DatingChatListScreen: React.FC = () => {
  return <ChatListInner />;
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

  // Center / Empty
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyIconOuter: {
    marginBottom: SPACING.md,
  },
  emptyIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...TEXT_STYLES.headingMedium,
  },
  emptySubtext: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Section headers
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  sectionLabel: {
    ...TEXT_STYLES.labelLarge,
  },
  sectionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  sectionCountText: {
    ...TEXT_STYLES.tiny,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Match carousel
  matchSection: {
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchCarousel: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  matchCard: {
    width: MATCH_CARD_W,
    height: MATCH_CARD_H,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  matchCardImg: {
    width: '100%',
    height: '100%',
  },
  matchCardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  matchCardName: {
    ...TEXT_STYLES.labelSmall,
    color: '#FFFFFF',
  },
  matchNewBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Conversation rows
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    marginHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xxs,
  },
  convAvatarWrap: {
    marginRight: SPACING.sm,
    position: 'relative',
  },
  convAvatar: {
    width: AVATAR.lg,
    height: AVATAR.lg,
    borderRadius: AVATAR.lg / 2,
  },
  convAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  convBody: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  convName: {
    ...TEXT_STYLES.bodyMedium,
    flex: 1,
    marginRight: SPACING.xs,
  },
  convNameUnread: {
    fontWeight: '700',
  },
  convTime: {
    ...TEXT_STYLES.tiny,
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convPreview: {
    ...TEXT_STYLES.bodySmall,
    flex: 1,
  },
  convPreviewUnread: {
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  unreadBadgeText: {
    ...TEXT_STYLES.tiny,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // No convs placeholder
  noConvsYet: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xxl,
    gap: SPACING.xs,
  },
  noConvsTitle: {
    ...TEXT_STYLES.labelLarge,
  },
  noConvsText: {
    ...TEXT_STYLES.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DatingChatListScreen;
