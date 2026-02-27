import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StatusBar,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post } from '../../types';
import { postService } from '../../services/post/postService';

interface ProfileScreenProps {
  navigation: any;
  route?: any;
}

const getTimeAgo = (dateString: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
  return `${Math.floor(seconds / 86400)} ngày`;
};

const ProfilePost: React.FC<{ post: Post; onPress: () => void }> = ({ post, onPress }) => (
  <TouchableOpacity style={styles.postItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.postContent}>
      <Text style={styles.postText} numberOfLines={3}>{post.content}</Text>
      {post.media && post.media.length > 0 && (
        <Image source={{ uri: post.media[0].url }} style={styles.postThumbnail} />
      )}
      <View style={styles.postStats}>
        <View style={styles.postStat}>
          <Ionicons name="heart-outline" size={16} color={Colors.textTertiary} />
          <Text style={styles.postStatText}>{post.likesCount}</Text>
        </View>
        <View style={styles.postStat}>
          <Ionicons name="chatbubble-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.postStatText}>{post.commentsCount}</Text>
        </View>
        <Text style={styles.postTime}>{getTimeAgo(post.createdAt)}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { user: currentUser, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'reposts'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !route?.params?.userId || route?.params?.userId === currentUser?.id;
  const user = currentUser;
  const userId = route?.params?.userId || currentUser?.id;

  const fetchUserPosts = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await postService.getUserPosts(userId, { page: 1, limit: 20 });
      const postsData = response?.data || [];
      setPosts(postsData);
    } catch (error) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserPosts();
  }, [fetchUserPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserPosts();
    setRefreshing(false);
  }, [fetchUserPosts]);

  const tabs = [
    { key: 'posts' as const, label: 'Bài đăng' },
    { key: 'replies' as const, label: 'Trả lời' },
    { key: 'reposts' as const, label: 'Bài đăng lại' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="globe-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>{user?.fullName || 'User'}</Text>
              <Text style={styles.usernameHandle}>@{user?.studentId || 'username'}</Text>
            </View>
            <Image
              source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=1' }}
              style={styles.avatar}
            />
          </View>

          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Người theo dõi</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Đang theo dõi</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem}>
              <Text style={styles.statNumber}>{user?.postsCount || 0}</Text>
              <Text style={styles.statLabel}>Bài viết</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={styles.actionButtonText}>Chỉnh sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Share.share({ message: `Xem trang cá nhân của ${user?.fullName} trên PTIT Social!` })}
                >
                  <Text style={styles.actionButtonText}>Chia sẻ</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionButton, styles.followButton]}>
                  <Text style={styles.followButtonText}>Theo dõi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Nhắn tin</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts */}
        <View style={styles.postsSection}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : activeTab === 'posts' ? (
            posts.length > 0 ? (
              posts.map(post => (
                <ProfilePost
                  key={post.id}
                  post={post}
                  onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name={activeTab === 'replies' ? 'chatbubble-outline' : 'repeat-outline'}
                size={48}
                color={Colors.gray300}
              />
              <Text style={styles.emptyText}>
                {activeTab === 'replies' ? 'Chưa có trả lời nào' : 'Chưa có bài đăng lại nào'}
              </Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: Layout.headerHeight,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flex: 1,
  },
  fullName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  usernameHandle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  avatar: {
    width: Layout.avatarSize.xxl,
    height: Layout.avatarSize.xxl,
    borderRadius: Layout.avatarSize.xxl / 2,
    backgroundColor: Colors.gray200,
  },
  bio: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extraBold,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  followButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  followButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.textTertiary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
  postsSection: {
    paddingTop: Spacing.sm,
  },
  postItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  postContent: {},
  postText: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  postThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray100,
    marginTop: Spacing.md,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  postStatText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  postTime: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },
  loadingState: {
    padding: Spacing.huge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: Spacing.huge,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
});

export default ProfileScreen;
