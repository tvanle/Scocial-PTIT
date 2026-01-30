import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Header } from '../../components/common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Notification, NotificationType } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like_post',
    actor: { id: '2', fullName: 'Trần Văn B', avatar: 'https://i.pravatar.cc/150?img=2', email: '', createdAt: '', updatedAt: '' },
    title: 'Thích bài viết',
    body: 'đã thích bài viết của bạn',
    data: { postId: '1' },
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'comment_post',
    actor: { id: '3', fullName: 'Lê Thị C', avatar: 'https://i.pravatar.cc/150?img=3', email: '', createdAt: '', updatedAt: '' },
    title: 'Bình luận mới',
    body: 'đã bình luận bài viết của bạn: "Bài viết rất hay!"',
    data: { postId: '1', commentId: '1' },
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'friend_request',
    actor: { id: '4', fullName: 'Phạm Văn D', avatar: 'https://i.pravatar.cc/150?img=4', email: '', createdAt: '', updatedAt: '' },
    title: 'Lời mời kết bạn',
    body: 'đã gửi cho bạn lời mời kết bạn',
    isRead: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'friend_accepted',
    actor: { id: '5', fullName: 'Nguyễn Thị E', avatar: 'https://i.pravatar.cc/150?img=5', email: '', createdAt: '', updatedAt: '' },
    title: 'Chấp nhận kết bạn',
    body: 'đã chấp nhận lời mời kết bạn của bạn',
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'mention',
    actor: { id: '6', fullName: 'Hoàng Văn F', avatar: 'https://i.pravatar.cc/150?img=6', email: '', createdAt: '', updatedAt: '' },
    title: 'Đã nhắc đến bạn',
    body: 'đã nhắc đến bạn trong một bình luận',
    data: { postId: '2', commentId: '3' },
    isRead: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    type: 'group_invite',
    actor: { id: '7', fullName: 'Vũ Thị G', avatar: 'https://i.pravatar.cc/150?img=7', email: '', createdAt: '', updatedAt: '' },
    title: 'Lời mời vào nhóm',
    body: 'đã mời bạn tham gia nhóm "CLB Lập trình PTIT"',
    data: { groupId: '1' },
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '7',
    type: 'share_post',
    actor: { id: '8', fullName: 'Đặng Văn H', avatar: 'https://i.pravatar.cc/150?img=8', email: '', createdAt: '', updatedAt: '' },
    title: 'Chia sẻ bài viết',
    body: 'đã chia sẻ bài viết của bạn',
    data: { postId: '3' },
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface NotificationScreenProps {
  navigation: any;
}

const NotificationScreen: React.FC<NotificationScreenProps> = ({ navigation }) => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  }, []);

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
    );

    // Navigate based on type
    switch (notification.type) {
      case 'like_post':
      case 'comment_post':
      case 'share_post':
        if (notification.data?.postId) {
          navigation.navigate('PostDetail', { postId: notification.data.postId });
        }
        break;
      case 'friend_request':
      case 'friend_accepted':
        navigation.navigate('UserProfile', { userId: notification.actor.id });
        break;
      case 'mention':
      case 'tag':
        if (notification.data?.postId) {
          navigation.navigate('PostDetail', { postId: notification.data.postId });
        }
        break;
      case 'group_invite':
        if (notification.data?.groupId) {
          navigation.navigate('GroupDetail', { groupId: notification.data.groupId });
        }
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: NotificationType): { name: keyof typeof Ionicons.glyphMap; color: string } => {
    switch (type) {
      case 'like_post':
        return { name: 'heart', color: Colors.like };
      case 'comment_post':
        return { name: 'chatbubble', color: Colors.comment };
      case 'share_post':
        return { name: 'share-social', color: Colors.share };
      case 'friend_request':
      case 'friend_accepted':
        return { name: 'person-add', color: Colors.primary };
      case 'mention':
      case 'tag':
        return { name: 'at', color: Colors.info };
      case 'group_invite':
      case 'group_post':
        return { name: 'people', color: Colors.secondary };
      case 'message':
        return { name: 'chatbubble-ellipses', color: Colors.primary };
      default:
        return { name: 'notifications', color: Colors.primary };
    }
  };

  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

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
            <Ionicons name={icon.name} size={12} color={Colors.textLight} />
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

        {item.type === 'friend_request' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => {
                setNotifications(prev => prev.filter(n => n.id !== item.id));
              }}
            >
              <Text style={styles.acceptButtonText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => {
                setNotifications(prev => prev.filter(n => n.id !== item.id));
              }}
            >
              <Text style={styles.rejectButtonText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
        onPress={() => setActiveTab('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
          {Strings.notifications.all}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
        onPress={() => setActiveTab('unread')}
      >
        <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
          {Strings.notifications.unread}
          {unreadCount > 0 && ` (${unreadCount})`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={Strings.notifications.title}
        rightIcon={unreadCount > 0 ? 'checkmark-done-outline' : undefined}
        onRightPress={handleMarkAllRead}
      />

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
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
            <Ionicons name="notifications-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>Không có thông báo nào</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.backgroundSecondary,
  },
  activeTab: {
    backgroundColor: Colors.primarySoft,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  notificationText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  actorName: {
    fontWeight: FontWeight.semiBold,
  },
  timeText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    marginLeft: 52,
  },
  acceptButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  acceptButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textLight,
  },
  rejectButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.sm,
  },
  rejectButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
});

export default NotificationScreen;
