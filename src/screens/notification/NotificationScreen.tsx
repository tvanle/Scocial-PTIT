import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BottomMenu } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import { Notification, NotificationType } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { notificationService } from '../../services/notification/notificationService';
import { userService } from '../../services/user/userService';
import { useFetch } from '../../hooks';
import { showAlert } from '../../utils/alert';
import Animated, {
  FadeInDown,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface NotificationScreenProps {
  navigation: any;
}

type FilterChip = 'all' | 'follows' | 'likes' | 'comments';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Notification Item Component
interface NotificationItemProps {
  item: Notification;
  index: number;
  colors: any;
  onPress: (item: Notification) => void;
  onFollowBack?: (userId: string) => void;
  isFollowed?: boolean;
  isFollowing?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = React.memo(({
  item,
  index,
  colors,
  onPress,
  onFollowBack,
  isFollowed,
  isFollowing,
}) => {
  const scale = useSharedValue(1);

  const getNotificationIcon = (type: NotificationType) => {
    const t = type.toUpperCase();
    switch (t) {
      case 'LIKE':
      case 'LIKE_POST':
        return { name: 'heart', color: '#FFFFFF', bgColor: '#FF3B5C', gradient: ['#FF3B5C', '#FF6B6B'] };
      case 'COMMENT':
      case 'COMMENT_POST':
        return { name: 'chatbubble', color: '#FFFFFF', bgColor: '#3B82F6', gradient: ['#3B82F6', '#60A5FA'] };
      case 'SHARE_POST':
        return { name: 'repeat', color: '#FFFFFF', bgColor: '#10B981', gradient: ['#10B981', '#34D399'] };
      case 'FOLLOW':
      case 'FOLLOW_BACK':
        return { name: 'person-add', color: '#FFFFFF', bgColor: '#8B5CF6', gradient: ['#8B5CF6', '#A78BFA'] };
      case 'MENTION':
      case 'TAG':
        return { name: 'at', color: '#FFFFFF', bgColor: '#F59E0B', gradient: ['#F59E0B', '#FBBF24'] };
      case 'MATCH_CREATED':
        return { name: 'heart-circle', color: '#FFFFFF', bgColor: '#EC4899', gradient: ['#EC4899', '#F472B6'] };
      case 'SUPER_LIKE':
        return { name: 'star', color: '#FFFFFF', bgColor: '#F59E0B', gradient: ['#F59E0B', '#FBBF24'] };
      case 'MESSAGE':
        return { name: 'chatbubbles', color: '#FFFFFF', bgColor: '#06B6D4', gradient: ['#06B6D4', '#22D3EE'] };
      default:
        return { name: 'notifications', color: '#FFFFFF', bgColor: colors.primary, gradient: [colors.primary, colors.primary] };
    }
  };

  const icon = getNotificationIcon(item.type);
  const isFollowType = item.type.toUpperCase() === 'FOLLOW';
  const actorId = item.actor?.id;
  const notificationBody = item.body || item.content || '';

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300).springify()}>
      <AnimatedTouchable
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.isRead ? colors.background : colors.primarySoft,
            borderColor: item.isRead ? colors.borderLight : colors.primaryLight,
          },
          animatedStyle,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item);
        }}
        activeOpacity={1}
      >
        {/* Avatar with Icon Badge */}
        <View style={styles.avatarContainer}>
          {item.actor?.avatar ? (
            <Image source={{ uri: item.actor.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.gray200 }]}>
              <Ionicons name="person" size={20} color={colors.gray400} />
            </View>
          )}
          <View style={[styles.iconBadge, { backgroundColor: icon.bgColor }]}>
            <Ionicons name={icon.name as any} size={10} color={icon.color} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.notificationText, { color: colors.textPrimary }]} numberOfLines={2}>
            <Text style={styles.actorName}>{item.actor?.fullName}</Text>
            {' '}{notificationBody}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
            <Text style={[styles.timeText, { color: colors.textTertiary }]}>
              {formatTimeAgo(item.createdAt)}
            </Text>
          </View>
        </View>

        {/* Action Button or Unread Indicator */}
        {isFollowType && actorId && onFollowBack ? (
          <TouchableOpacity
            style={[
              styles.followBackButton,
              {
                backgroundColor: isFollowed ? 'transparent' : colors.primary,
                borderWidth: isFollowed ? 1.5 : 0,
                borderColor: colors.gray300,
              },
            ]}
            onPress={() => !isFollowed && onFollowBack(actorId)}
            disabled={isFollowed || isFollowing}
            activeOpacity={0.8}
          >
            {isFollowing ? (
              <ActivityIndicator size="small" color={isFollowed ? colors.textSecondary : '#FFFFFF'} />
            ) : (
              <>
                <Ionicons
                  name={isFollowed ? 'checkmark' : 'person-add'}
                  size={14}
                  color={isFollowed ? colors.textSecondary : '#FFFFFF'}
                />
                <Text style={[styles.followBackText, { color: isFollowed ? colors.textSecondary : '#FFFFFF' }]}>
                  {isFollowed ? 'Đã theo dõi' : 'Theo dõi'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : !item.isRead ? (
          <View style={styles.unreadIndicator}>
            <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
          </View>
        ) : null}
      </AnimatedTouchable>
    </Animated.View>
  );
});

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { data: notificationsData, loading, refreshing, onRefresh, setData, refetch } = useFetch(
    useCallback(() => notificationService.getNotifications({ page: 1, limit: 50 }), []),
  );
  const notifications = notificationsData?.data || [];
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [showMenu, setShowMenu] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [followingInProgress, setFollowingInProgress] = useState<Set<string>>(new Set());

  const handleFollowBack = async (userId: string) => {
    if (followingInProgress.has(userId)) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFollowingInProgress(prev => new Set(prev).add(userId));
    try {
      await userService.follow(userId);
      setFollowedUsers(prev => new Set(prev).add(userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to follow user:', error);
      showAlert('Lỗi', 'Không thể theo dõi người dùng này');
    } finally {
      setFollowingInProgress(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      setData(notificationsData ? {
        ...notificationsData,
        data: notificationsData.data.map((n: Notification) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        ),
      } : null);
      try {
        await notificationService.markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    const postId = notification.referenceId || notification.data?.postId;
    const userId = notification.actor?.id;
    const type = notification.type.toUpperCase();

    switch (type) {
      case 'LIKE':
      case 'LIKE_POST':
      case 'COMMENT':
      case 'COMMENT_POST':
      case 'SHARE_POST':
      case 'MENTION':
      case 'TAG':
        if (postId) navigation.navigate('PostDetail', { postId });
        break;
      case 'FOLLOW':
      case 'FOLLOW_BACK':
        if (userId) navigation.navigate('UserProfile', { userId });
        break;
      case 'MATCH_CREATED':
        if (notification.actor) {
          navigation.navigate('DatingChatRoom', {
            conversationId: '',
            otherUser: {
              id: notification.actor.id,
              fullName: notification.actor.fullName || '',
              avatar: notification.actor.avatar,
            },
          });
        }
        break;
      case 'SUPER_LIKE':
        if (userId) navigation.navigate('UserProfile', { userId });
        break;
      case 'MESSAGE':
        if (notification.data?.conversationId) {
          navigation.navigate('ChatRoom', { conversationId: notification.data.conversationId });
        } else if (userId) {
          navigation.navigate('ChatRoom', { userId });
        }
        break;
    }
  };

  const handleMarkAllRead = async () => {
    setShowMenu(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setData(notificationsData ? {
      ...notificationsData,
      data: notificationsData.data.map((n: Notification) => ({ ...n, isRead: true })),
    } : null);
    try {
      await notificationService.markAllAsRead();
    } catch {
      refetch();
    }
  };

  const handleClearAll = () => {
    setShowMenu(false);
    showAlert(
      'Xóa tất cả',
      'Bạn có chắc muốn xóa tất cả thông báo?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setData(notificationsData ? { ...notificationsData, data: [] } : null);
            try {
              await notificationService.clearAll();
            } catch {
              refetch();
            }
          },
        },
      ]
    );
  };

  const filterChips: { key: FilterChip; label: string; icon: string; activeIcon: string }[] = [
    { key: 'all', label: 'Tất cả', icon: 'apps-outline', activeIcon: 'apps' },
    { key: 'follows', label: 'Theo dõi', icon: 'person-add-outline', activeIcon: 'person-add' },
    { key: 'likes', label: 'Lượt thích', icon: 'heart-outline', activeIcon: 'heart' },
    { key: 'comments', label: 'Bình luận', icon: 'chatbubble-outline', activeIcon: 'chatbubble' },
  ];

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;

    const typeMap: Record<FilterChip, string[]> = {
      all: [],
      follows: ['FOLLOW', 'FOLLOW_BACK'],
      likes: ['LIKE', 'LIKE_POST', 'SUPER_LIKE'],
      comments: ['COMMENT', 'COMMENT_POST', 'MENTION', 'TAG'],
    };

    return notifications.filter(n =>
      typeMap[activeFilter]?.includes(n.type.toUpperCase())
    );
  }, [notifications, activeFilter]);

  const groupedNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups: { title: string; data: Notification[] }[] = [];
    const todayItems: Notification[] = [];
    const yesterdayItems: Notification[] = [];
    const thisWeekItems: Notification[] = [];
    const earlierItems: Notification[] = [];

    filteredNotifications.forEach(n => {
      const date = new Date(n.createdAt);
      date.setHours(0, 0, 0, 0);

      if (date.getTime() === today.getTime()) {
        todayItems.push(n);
      } else if (date.getTime() === yesterday.getTime()) {
        yesterdayItems.push(n);
      } else if (date.getTime() > weekAgo.getTime()) {
        thisWeekItems.push(n);
      } else {
        earlierItems.push(n);
      }
    });

    if (todayItems.length > 0) groups.push({ title: 'Hôm nay', data: todayItems });
    if (yesterdayItems.length > 0) groups.push({ title: 'Hôm qua', data: yesterdayItems });
    if (thisWeekItems.length > 0) groups.push({ title: 'Tuần này', data: thisWeekItems });
    if (earlierItems.length > 0) groups.push({ title: 'Trước đó', data: earlierItems });

    return groups;
  }, [filteredNotifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const menuItems: BottomMenuItem[] = [
    {
      label: 'Đánh dấu đã đọc tất cả',
      icon: 'checkmark-done-outline',
      onPress: handleMarkAllRead,
    },
    {
      label: 'Xóa tất cả thông báo',
      icon: 'trash-outline',
      destructive: true,
      onPress: handleClearAll,
    },
  ];

  const renderSectionHeader = (title: string, index: number) => (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(300)}
      style={styles.sectionHeader}
    >
      <View style={[styles.sectionLine, { backgroundColor: colors.borderLight }]} />
      <Text style={[styles.sectionTitle, { color: colors.textTertiary, backgroundColor: colors.background }]}>
        {title}
      </Text>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyContainer}>
      <View style={[styles.emptyIconWrapper, { backgroundColor: colors.primarySoft }]}>
        <MaterialCommunityIcons name="bell-sleep-outline" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Chưa có thông báo</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        Khi có người tương tác với bạn, thông báo sẽ hiển thị ở đây
      </Text>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Thông báo</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Thông báo</Text>
            {unreadCount > 0 && (
              <Animated.View
                entering={FadeInRight.duration(300)}
                style={[styles.unreadBadge, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.unreadBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </Animated.View>
            )}
          </View>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowMenu(true);
            }}
            style={[styles.menuButton, { backgroundColor: colors.gray100 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <View style={styles.chipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {filterChips.map((chip, index) => {
              const isActive = activeFilter === chip.key;
              return (
                <Animated.View key={chip.key} entering={FadeInRight.delay(index * 50).duration(300)}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isActive ? colors.primary : colors.gray100,
                        borderColor: isActive ? colors.primary : colors.borderLight,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveFilter(chip.key);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={(isActive ? chip.activeIcon : chip.icon) as any}
                      size={16}
                      color={isActive ? '#FFFFFF' : colors.textSecondary}
                    />
                    <Text style={[styles.chipText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>

        {/* Notifications List */}
        <FlatList
          style={styles.list}
          data={groupedNotifications}
          renderItem={({ item: group, index: groupIndex }) => (
            <View>
              {renderSectionHeader(group.title, groupIndex)}
              {group.data.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  item={notification}
                  index={index}
                  colors={colors}
                  onPress={handleNotificationPress}
                  onFollowBack={handleFollowBack}
                  isFollowed={notification.actor?.id ? followedUsers.has(notification.actor.id) : false}
                  isFollowing={notification.actor?.id ? followingInProgress.has(notification.actor.id) : false}
                />
              ))}
            </View>
          )}
          keyExtractor={(item) => item.title}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            filteredNotifications.length === 0 && styles.listContentEmpty,
          ]}
          ListEmptyComponent={renderEmptyState}
        />
      </SafeAreaView>

      <BottomMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        items={menuItems}
      />
    </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: FontWeight.extraBold,
    letterSpacing: -0.5,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsWrapper: {
    paddingBottom: Spacing.sm,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: FontWeight.semiBold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
    paddingHorizontal: Spacing.sm,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actorName: {
    fontWeight: FontWeight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
  },
  unreadIndicator: {
    paddingLeft: Spacing.sm,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  followBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  followBackText: {
    fontSize: 12,
    fontWeight: FontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationScreen;
