/**
 * Dating Notifications Screen
 *
 * List of dating-related notifications (matches, likes, messages)
 */

import React, { useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, TEXT_STYLES, RADIUS, DURATION } from '../../../constants/dating/design-system';
import datingService from '../../../services/dating/datingService';
import type { RootStackParamList } from '../../../types';
import type { MatchItem } from '../../../types/dating';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AVATAR_SIZE = 56;

type NotificationType = 'match' | 'like' | 'message';

interface DatingNotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  avatar: string | null;
  userId: string;
  createdAt: string;
  isRead: boolean;
  data?: any;
}

const transformMatchesToNotifications = (matches: MatchItem[]): DatingNotificationItem[] => {
  return matches.map((match) => ({
    id: `match-${match.id}`,
    type: 'match' as NotificationType,
    title: 'Match moi!',
    body: `Ban va ${match.matchedUser.fullName} da match voi nhau`,
    avatar: match.matchedUser.avatar,
    userId: match.matchedUser.id,
    createdAt: match.createdAt,
    isRead: false,
    data: match,
  }));
};

interface NotificationItemProps {
  item: DatingNotificationItem;
  index: number;
  onPress: (item: DatingNotificationItem) => void;
}

const NotificationItemRow: React.FC<NotificationItemProps> = React.memo(({ item, index, onPress }) => {
  const { theme } = useDatingTheme();

  const iconConfig = useMemo(() => {
    switch (item.type) {
      case 'match':
        return { name: 'heart' as const, color: theme.semantic.like.main, bg: theme.semantic.like.light };
      case 'like':
        return { name: 'thumb-up' as const, color: theme.semantic.superLike.main, bg: theme.semantic.superLike.light };
      case 'message':
        return { name: 'chat' as const, color: theme.brand.primary, bg: theme.brand.primaryMuted };
      default:
        return { name: 'bell' as const, color: theme.text.muted, bg: theme.bg.elevated };
    }
  }, [item.type, theme]);

  const timeLabel = useMemo(() => {
    const d = new Date(item.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vua xong';
    if (diffMin < 60) return `${diffMin} phut`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} gio`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} ngay`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }, [item.createdAt]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  }, [item, onPress]);

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(DURATION.normal)}>
      <TouchableOpacity
        style={[
          styles.notifRow,
          { backgroundColor: item.isRead ? theme.bg.surface : theme.semantic.like.light },
        ]}
        activeOpacity={0.6}
        onPress={handlePress}
      >
        <View style={styles.notifAvatarWrap}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.notifAvatar} />
          ) : (
            <View style={[styles.notifAvatar, styles.notifAvatarPlaceholder, { backgroundColor: theme.bg.elevated }]}>
              <Ionicons name="person" size={24} color={theme.text.muted} />
            </View>
          )}
          <View style={[styles.notifTypeIcon, { backgroundColor: iconConfig.bg }]}>
            <MaterialCommunityIcons name={iconConfig.name} size={14} color={iconConfig.color} />
          </View>
        </View>

        <View style={styles.notifBody}>
          <View style={styles.notifTopRow}>
            <Text
              style={[
                styles.notifTitle,
                { color: item.isRead ? theme.text.secondary : theme.text.primary },
                !item.isRead && styles.notifTitleUnread,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[styles.notifTime, { color: theme.text.muted }]}>{timeLabel}</Text>
          </View>
          <Text style={[styles.notifText, { color: theme.text.muted }]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: theme.semantic.like.main }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

const STORAGE_KEY = 'dating_notif_read_ids';

const NotificationsInner: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useDatingTheme();
  const queryClient = useQueryClient();
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());
  const [isLoadingReadIds, setIsLoadingReadIds] = React.useState(true);

  // Load read IDs from SecureStore on mount
  useEffect(() => {
    const loadReadIds = async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as string[];
          setReadIds(new Set(parsed));
        }
      } catch (error) {
        console.error('Failed to load read notification IDs:', error);
      } finally {
        setIsLoadingReadIds(false);
      }
    };
    loadReadIds();
  }, []);

  // Save read IDs to SecureStore when changed
  const saveReadIds = useCallback(async (ids: Set<string>) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify([...ids]));
    } catch (error) {
      console.error('Failed to save read notification IDs:', error);
    }
  }, []);

  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['dating', 'matches'],
    queryFn: () => datingService.getMatches({ page: '1', limit: '50' }),
  });

  const notifications = useMemo(() => {
    if (!matchesData?.data) return [];
    return transformMatchesToNotifications(matchesData.data)
      .map((n) => ({ ...n, isRead: readIds.has(n.id) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [matchesData?.data, readIds]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleNotificationPress = useCallback(
    (item: DatingNotificationItem) => {
      // Mark as read
      if (!readIds.has(item.id)) {
        const newReadIds = new Set(readIds);
        newReadIds.add(item.id);
        setReadIds(newReadIds);
        saveReadIds(newReadIds);
      }

      // Navigate
      if (item.type === 'match' && item.data) {
        navigation.navigate('DatingTabs', { screen: 'DatingChatsTab' });
      } else if (item.type === 'like') {
        navigation.navigate('DatingTabs', { screen: 'DatingLikesTab' });
      } else if (item.type === 'message') {
        navigation.navigate('DatingTabs', { screen: 'DatingChatsTab' });
      }
    },
    [navigation, readIds, saveReadIds]
  );

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  const handleClearAll = useCallback(() => {
    if (unreadNotifications.length === 0) return;

    Alert.alert(
      'Danh dau da doc',
      `Danh dau ${unreadNotifications.length} thong bao la da doc?`,
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Dong y',
          onPress: () => {
            const allIds = notifications.map((n) => n.id);
            const newReadIds = new Set(allIds);
            setReadIds(newReadIds);
            saveReadIds(newReadIds);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [notifications, unreadNotifications.length, saveReadIds]);

  const renderItem = useCallback(
    ({ item, index }: { item: DatingNotificationItem; index: number }) => (
      <NotificationItemRow item={item} index={index} onPress={handleNotificationPress} />
    ),
    [handleNotificationPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border.subtle }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={22} color={theme.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons name="bell" size={20} color={theme.brand.primary} />
            <Text style={[styles.headerTitle, { color: theme.text.primary }]}>Thong bao</Text>
            {unreadNotifications.length > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: theme.semantic.like.main }]}>
                <Text style={styles.headerBadgeText}>{unreadNotifications.length}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleClearAll}
            disabled={unreadNotifications.length === 0}
          >
            <Ionicons
              name="checkmark-done"
              size={22}
              color={unreadNotifications.length > 0 ? theme.brand.primary : theme.text.muted}
            />
          </TouchableOpacity>
        </View>

        {isLoading || isLoadingReadIds ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.brand.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <Animated.View entering={FadeIn.duration(DURATION.slow)} style={styles.center}>
            <View style={[styles.emptyIconOuter, { backgroundColor: theme.semantic.like.light }]}>
              <MaterialCommunityIcons name="bell-outline" size={48} color={theme.semantic.like.main} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>
              Khong co thong bao
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.text.muted }]}>
              Khi co ai do thich hoac match voi ban, thong bao se xuat hien o day
            </Text>
          </Animated.View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: theme.border.subtle }]} />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export const DatingNotificationsScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <NotificationsInner />
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

  // Center / Empty
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  emptySubtext: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },

  // List
  listContent: {
    paddingBottom: SPACING.xl,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 88,
  },

  // Notification row
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  notifAvatarWrap: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  notifAvatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  notifAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTypeIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  notifBody: {
    flex: 1,
  },
  notifTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    ...TEXT_STYLES.labelMedium,
    flex: 1,
    marginRight: SPACING.xs,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifTime: {
    ...TEXT_STYLES.tiny,
  },
  notifText: {
    ...TEXT_STYLES.bodySmall,
    lineHeight: 20,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: SPACING.xs,
  },
});

export default DatingNotificationsScreen;
