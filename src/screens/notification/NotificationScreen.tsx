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
  Modal,
  Pressable,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, EmptyState } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { Notification, NotificationType } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { notificationService } from '../../services/notification/notificationService';
import { useFetch } from '../../hooks';
import { showAlert } from '../../utils/alert';

interface NotificationScreenProps {
  navigation: any;
}

type FilterChip = 'all' | 'follows' | 'invites';

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const { data: notificationsData, loading, refreshing, onRefresh, setData, refetch } = useFetch(
    useCallback(() => notificationService.getNotifications({ page: 1, limit: 50 }), []),
  );
  const notifications = notificationsData?.data || [];
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [showMenu, setShowMenu] = useState(false);

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
        if (notification.actor?.id) {
          navigation.navigate('UserProfile', { userId: notification.actor.id });
        }
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
    setShowMenu(false);
    setData(notificationsData ? {
      ...notificationsData,
      data: notificationsData.data.map((n: Notification) => ({ ...n, isRead: true })),
    } : null);
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      refetch();
    }
  };

  const handleClearAll = () => {
    setShowMenu(false);
    showAlert(
      'Xoa tat ca thong bao',
      'Ban co chac chan muon xoa tat ca thong bao? Hanh dong nay khong the hoan tac.',
      [
        { text: 'Huy', style: 'cancel' },
        {
          text: 'Xoa tat ca',
          style: 'destructive',
          onPress: async () => {
            setData(notificationsData ? { ...notificationsData, data: [] } : null);
            try {
              await notificationService.clearAll();
            } catch (error) {
              refetch();
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'like_post':
        return { name: 'heart', color: Colors.like };
      case 'comment_post':
        return { name: 'chatbox', color: Colors.info };
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
    { key: 'all', label: 'Tat ca' },
    { key: 'follows', label: 'Luot theo doi' },
    { key: 'invites', label: 'Cuoc tro chuyen' },
  ];

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    const typeMap: Record<FilterChip, NotificationType[]> = {
      all: [],
      follows: ['follow', 'follow_back'],
      invites: ['mention', 'tag'],
    };
    return notifications.filter(n => typeMap[activeFilter]?.includes(n.type));
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, !item.isRead && styles.unreadItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Avatar uri={item.actor?.avatar} name={item.actor?.fullName} size="md" />
          <View style={[styles.iconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name} size={10} color={Colors.white} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.notificationText}>
            <Text style={styles.actorName}>{item.actor?.fullName}</Text>
            {' '}{item.body}
          </Text>
          <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
        </View>

        {!item.isRead && <View style={styles.unreadDot} />}

        {item.type === 'follow' && (
          <TouchableOpacity style={styles.followBackButton}>
            <Text style={styles.followBackText}>Theo doi lai</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Hoat dong</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hoat dong</Text>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.markAllButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Action Menu Modal */}
        <Modal
          visible={showMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowMenu(false)}
        >
          <Pressable style={styles.menuOverlay} onPress={() => setShowMenu(false)}>
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleMarkAllRead}>
                <Ionicons name="checkmark-done-outline" size={20} color={Colors.textPrimary} />
                <Text style={styles.menuItemText}>Danh dau da doc tat ca</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={handleClearAll}>
                <Ionicons name="trash-outline" size={20} color={Colors.error} />
                <Text style={[styles.menuItemText, { color: Colors.error }]}>Xoa tat ca thong bao</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Filter Chips */}
        <View style={styles.chipsWrapper}>
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
        </View>

        <FlatList
          style={styles.list}
          data={filteredNotifications}
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
            <EmptyState
              icon="notifications-outline"
              title="Khong co hoat dong nao"
              subtitle="Khi co nguoi tuong tac, ban se thay o day"
            />
          }
          removeClippedSubviews
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          windowSize={5}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
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
  chipsWrapper: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  chipsContainer: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gray50,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  list: {
    flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: Spacing.lg,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.gray200,
    marginHorizontal: Spacing.md,
  },
});

export default NotificationScreen;
