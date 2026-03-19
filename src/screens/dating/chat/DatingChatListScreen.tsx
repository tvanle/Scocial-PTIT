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
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { DATING_SPACING } from '../../../constants/dating/tokens';
import { DiscoveryBottomNav } from '../discovery/components';
import datingChatService from '../../../services/dating/datingChatService';
import datingService from '../../../services/dating/datingService';
import socketService from '../../../services/socket/socketService';
import { useAuthStore } from '../../../store/slices/authSlice';
import type { RootStackParamList } from '../../../types';
import type { DatingConversation, MatchItem, DatingChatUser } from '../../../types/dating';

const colors = DATING_COLORS.discovery;
type Nav = NativeStackNavigationProp<RootStackParamList>;
const { width: SCREEN_W } = Dimensions.get('window');
const MATCH_CARD_W = 100;
const MATCH_CARD_H = 140;

// ─── New Match Card (vertical photo card with gradient name) ─────────
interface NewMatchItemProps {
  match: MatchItem;
  onPress: (match: MatchItem) => void;
}

const NewMatchItem: React.FC<NewMatchItemProps> = React.memo(({ match, onPress }) => {
  const photo = match.matchedUser.avatar;
  const firstName = match.matchedUser.fullName?.split(' ').pop() ?? 'Bạn';

  return (
    <TouchableOpacity
      style={styles.matchCard}
      activeOpacity={0.85}
      onPress={() => onPress(match)}
    >
      {photo ? (
        <Image source={{ uri: photo }} style={styles.matchCardImg} />
      ) : (
        <View style={[styles.matchCardImg, styles.matchCardPlaceholder]}>
          <Ionicons name="person" size={36} color="#d1d5db" />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.65)']}
        style={styles.matchCardGradient}
      >
        <Text style={styles.matchCardName} numberOfLines={1}>
          {firstName}
        </Text>
      </LinearGradient>
      <View style={styles.matchNewBadge}>
        <Text style={styles.matchNewBadgeText}>MỚI</Text>
      </View>
    </TouchableOpacity>
  );
});

// ─── Conversation Row ────────────────────────────────────────────────
interface ConvItemProps {
  item: DatingConversation;
  onPress: (item: DatingConversation) => void;
  onAvatarPress: (user: DatingChatUser) => void;
}

const ConversationItem: React.FC<ConvItemProps> = React.memo(
  ({ item, onPress, onAvatarPress }) => {
    const other = item.otherUser;
    const hasUnread = item.unreadCount > 0;

    const timeLabel = useMemo(() => {
      if (!item.lastMessageCreatedAt) return '';
      const d = new Date(item.lastMessageCreatedAt);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Vừa xong';
      if (diffMin < 60) return `${diffMin} phút`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `${diffH} giờ`;
      const diffD = Math.floor(diffH / 24);
      if (diffD < 7) return `${diffD} ngày`;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    }, [item.lastMessageCreatedAt]);

    return (
      <TouchableOpacity
        style={[styles.convRow, hasUnread && styles.convRowUnread]}
        activeOpacity={0.6}
        onPress={() => onPress(item)}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => other && onAvatarPress(other)}
          style={styles.convAvatarWrap}
        >
          {other?.avatar ? (
            <Image source={{ uri: other.avatar }} style={styles.convAvatar} />
          ) : (
            <View style={[styles.convAvatar, styles.convAvatarPlaceholder]}>
              <Ionicons name="person" size={26} color="#d1d5db" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.convBody}>
          <View style={styles.convTopRow}>
            <Text
              style={[styles.convName, hasUnread && styles.convNameUnread]}
              numberOfLines={1}
            >
              {other?.fullName ?? 'Người dùng'}
            </Text>
            {timeLabel ? (
              <Text style={[styles.convTime, hasUnread && styles.convTimeUnread]}>
                {timeLabel}
              </Text>
            ) : null}
          </View>
          <View style={styles.convBottomRow}>
            <Text
              style={[styles.convPreview, hasUnread && styles.convPreviewUnread]}
              numberOfLines={1}
            >
              {item.lastMessageContent ?? 'Bắt đầu trò chuyện nào! 💬'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadDot} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

// ─── Main Screen ─────────────────────────────────────────────────────
const DatingChatListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
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

  const handleBottomTabPress = useCallback(
    (key: string) => {
      if (key === 'discover') navigation.navigate('DatingDiscovery');
      else if (key === 'likes') navigation.navigate('DatingLikes');
      else if (key === 'profile') navigation.navigate('DatingMyProfile');
    },
    [navigation],
  );

  const handleBackToSocial = useCallback(() => {
    navigation.navigate('Main' as any);
  }, [navigation]);

  const renderConv = useCallback(
    ({ item }: { item: DatingConversation }) => (
      <ConversationItem item={item} onPress={handleConvPress} onAvatarPress={handleAvatarPress} />
    ),
    [handleConvPress, handleAvatarPress],
  );

  const isLoading = loadingConvs || loadingMatches;
  const convList = conversations ?? [];
  const hasContent = newMatches.length > 0 || convList.length > 0;

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleBackToSocial}>
            <Ionicons name="arrow-back" size={22} color={DATING_COLORS.profileDetail.name} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="heart" size={18} color={DATING_COLORS.primary} />
            <Text style={styles.headerTitle}>Tin nhắn</Text>
          </View>
          <View style={styles.headerBtnPlaceholder} />
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={DATING_COLORS.primary} />
          </View>
        ) : !hasContent ? (
          <View style={styles.center}>
            <View style={styles.emptyIconOuter}>
              <View style={styles.emptyIconInner}>
                <Ionicons name="chatbubble-ellipses" size={40} color={DATING_COLORS.primary} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện</Text>
            <Text style={styles.emptySubtext}>
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
                  <View style={styles.matchSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="sparkles" size={16} color={DATING_COLORS.primary} />
                      <Text style={styles.sectionLabel}>Kết nối mới</Text>
                      <View style={styles.sectionCount}>
                        <Text style={styles.sectionCountText}>{newMatches.length}</Text>
                      </View>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.matchCarousel}
                    >
                      {newMatches.map((m) => (
                        <NewMatchItem key={m.id} match={m} onPress={handleMatchPress} />
                      ))}
                    </ScrollView>
                  </View>
                )}

                {convList.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Ionicons name="chatbubbles" size={16} color={DATING_COLORS.primary} />
                    <Text style={styles.sectionLabel}>Cuộc trò chuyện</Text>
                  </View>
                )}
              </>
            }
            ListEmptyComponent={
              newMatches.length > 0 ? (
                <View style={styles.noConvsYet}>
                  <Ionicons name="chatbubble-outline" size={28} color="#d1d5db" />
                  <Text style={styles.noConvsTitle}>Chưa có tin nhắn nào</Text>
                  <Text style={styles.noConvsText}>
                    Nhấn vào một kết nối mới ở trên để bắt đầu trò chuyện!
                  </Text>
                </View>
              ) : null
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
      <DiscoveryBottomNav activeTab="chats" onTabPress={handleBottomTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fafafa' },
  safeArea: { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DATING_SPACING.md,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#efefef',
    backgroundColor: '#fff',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: DATING_COLORS.profileDetail.name,
    letterSpacing: -0.3,
  },
  headerBtnPlaceholder: { width: 38 },

  // ── Center / Empty
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 10,
  },
  emptyIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(232,48,48,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(232,48,48,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 21,
  },

  // ── Section headers
  listContent: { paddingBottom: DATING_SPACING.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.1,
  },
  sectionCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: DATING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Match carousel
  matchSection: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#efefef',
  },
  matchCarousel: {
    paddingHorizontal: 16,
    gap: 10,
  },
  matchCard: {
    width: MATCH_CARD_W,
    height: MATCH_CARD_H,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  matchCardImg: {
    width: '100%',
    height: '100%',
  },
  matchCardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  matchCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 50,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  matchCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  matchNewBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: DATING_COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchNewBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },

  // ── Conversation rows
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  convRowUnread: {
    backgroundColor: 'rgba(232,48,48,0.03)',
  },
  convAvatarWrap: { marginRight: 14 },
  convAvatar: { width: 54, height: 54, borderRadius: 27 },
  convAvatarPlaceholder: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convBody: { flex: 1 },
  convTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  convName: {
    fontSize: 15.5,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  convNameUnread: {
    fontWeight: '700',
    color: '#111827',
  },
  convTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  convTimeUnread: {
    color: DATING_COLORS.primary,
    fontWeight: '600',
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convPreview: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
    lineHeight: 19,
  },
  convPreviewUnread: {
    color: '#4b5563',
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: DATING_COLORS.primary,
    marginLeft: 8,
  },

  // ── Separator
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f0f0f0',
    marginLeft: 88,
  },

  // ── No convs placeholder
  noConvsYet: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
    gap: 8,
  },
  noConvsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  noConvsText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 19,
  },
});

export default DatingChatListScreen;
