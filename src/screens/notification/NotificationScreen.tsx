import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Notification, NotificationType } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { notificationService } from '../../services/notification/notificationService';
import { useAuthStore } from '../../store/slices/authSlice';

interface NotificationScreenProps {
  navigation: any;
}

type FilterChip = 'all' | 'replies' | 'mentions' | 'likes' | 'follows';

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const { accessToken } = useAuthStore();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({ page: 1, limit: 50 });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      setNotifications([]);
      fetchNotifications();
    }
  }, [accessToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.isRead) {
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
      );
      try {
        await notificationService.markAsRead(notification.id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    switch (notification.type) {
      case 'like_post':
      case 'comment_post':
      case 'share_post':
        if (notification.data?.postId) {
          navigation.navigate('PostDetail', { postId: notification.data.postId });
        }
        break;
      case 'follow':
      case 'follow_back':
        navigation.navigate('UserProfile', { userId: notification.actor.id });
        break;
      case 'mention':
      case 'tag':
        if (notification.data?.postId) {
          navigation.navigate('PostDetail', { postId: notification.data.postId });
        }
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      fetchNotifications();
    }
  };

  const getNotificationIcon = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'like_post':
        return { name: 'heart', color: Colors.like };
      case 'comment_post':
        return { name: 'chatbubble', color: Colors.info };
      case 'share_post':
        return { name: 'repeat', color: Colors.success };
      case 'follow':
      case 'follow_back':
        return { name: 'person-add', color: Colors.primary };
      case 'mention':
      case 'tag':
        return { name: 'at', color: Colors.info };
      default:
        return { name: 'notifications', color: Colors.primary };
    }
  };

  const filterChips: { key: FilterChip; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'replies', label: 'Trả lời' },
    { key: 'mentions', label: 'Đề cập' },
    { key: 'likes', label: 'Thích' },
    { key: 'follows', label: 'Theo dõi' },
  ];

  const getFilteredNotifications = () => {
    if (activeFilter === 'all') return notifications;
    const typeMap: Record<FilterChip, NotificationType[]> = {
      all: [],
      replies: ['comment_post'],
      mentions: ['mention', 'tag'],
      likes: ['like_post'],
      follows: ['follow', 'follow_back'],
    };
    return notifications.filter(n => typeMap[activeFilter]?.includes(n.type));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar uri={item.actor.avatar} name={item.actor.fullName} size="md" />
          <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={10} color={Colors.white} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.notificationText}>
            <Text style={styles.actorName}>{item.actor.fullName}</Text>
            {' '}{item.body}
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}

        {item.type === 'follow' && (
          <TouchableOpacity style={styles.followBackButton}>
            <Text style={styles.followBackText}>Theo dõi lại</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hoạt động</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hoạt động</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Ionicons name="checkmark-done-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {filterChips.map(chip => (
          <TouchableOpacity
            key={chip.key}
            style={[styles.chip, activeFilter === chip.key && styles.chipActive]}
            onPress={() => setActiveFilter(chip.key)}
          >
            <Text style={[styles.chipText, activeFilter === chip.key && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={getFilteredNotifications()}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Không có hoạt động nào</Text>
            <Text style={styles.emptyText}>Khi có người tương tác, bạn sẽ thấy ở đây</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Layout.headerHeight,
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  markAllButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingBottom: 100,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  unreadItem: {
    backgroundColor: Colors.primarySoft,
  },
  avatarContainer: {
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  notificationText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  actorName: {
    fontWeight: FontWeight.bold,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.xxs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  followBackButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  followBackText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationScreen;
