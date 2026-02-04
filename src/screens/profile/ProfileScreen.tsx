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
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post } from '../../types';
import { postService } from '../../services/post/postService';

interface ProfileScreenProps {
  navigation: any;
  route?: any;
}

// Helper
const getTimeAgo = (dateString: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Vua xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}p`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

// Thread Post Component (simplified for profile)
const ProfilePost: React.FC<{ post: Post; onPress: () => void }> = ({ post, onPress }) => (
  <TouchableOpacity style={styles.postItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.postContent}>
      <Text style={styles.postText} numberOfLines={3}>{post.content}</Text>
      <Text style={styles.postMeta}>
        {post.commentsCount} tra loi · {post.likesCount} luot thich
      </Text>
    </View>
    {post.media && post.media.length > 0 && (
      <Image source={{ uri: post.media[0].url }} style={styles.postThumbnail} />
    )}
  </TouchableOpacity>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { user: currentUser, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'threads' | 'replies'>('threads');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !route?.params?.userId || route?.params?.userId === currentUser?.id;
  const user = currentUser;
  const userId = route?.params?.userId || currentUser?.id;

  // Fetch user posts
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
      Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng thử lại.');
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => Alert.alert('Ngon ngu', 'Hien tai chi ho tro Tieng Viet')}
        >
          <Ionicons name="globe-outline" size={24} color={Colors.black} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="menu-outline" size={26} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.black}
          />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>{user?.fullName || 'User'}</Text>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{user?.studentId || 'username'}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ptit.edu.vn</Text>
                </View>
              </View>
            </View>
            <Image
              source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=1' }}
              style={styles.avatar}
            />
          </View>

          {/* Bio */}
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Followers */}
          <Text style={styles.followers}>
            {user?.followersCount || 0} nguoi theo doi
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={styles.actionButtonText}>Chinh sua trang ca nhan</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Share.share({ message: `Xem trang ca nhan cua ${user?.fullName} tren PTIT Social!` })}
                >
                  <Text style={styles.actionButtonText}>Chia se trang ca nhan</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, styles.followButton]}
                  onPress={() => Alert.alert('Theo doi', 'Da gui yeu cau theo doi')}
                >
                  <Text style={styles.followButtonText}>Theo doi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('ChatRoom', { conversationId: route?.params?.userId })}
                >
                  <Text style={styles.actionButtonText}>Nhan tin</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'threads' && styles.activeTab]}
            onPress={() => setActiveTab('threads')}
          >
            <Text style={[styles.tabText, activeTab === 'threads' && styles.activeTabText]}>
              Thread
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'replies' && styles.activeTab]}
            onPress={() => setActiveTab('replies')}
          >
            <Text style={[styles.tabText, activeTab === 'replies' && styles.activeTabText]}>
              Tra loi
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        <View style={styles.postsSection}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={Colors.black} />
            </View>
          ) : activeTab === 'threads' ? (
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
                <Text style={styles.emptyText}>Chua co bai viet nao</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbox-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyText}>Chua co tra loi nao</Text>
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
    padding: Spacing.xs,
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
    fontWeight: FontWeight.bold,
    color: Colors.black,
    marginBottom: Spacing.xs,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: FontSize.md,
    color: Colors.black,
  },
  badge: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    marginLeft: Spacing.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
  },
  avatar: {
    width: Layout.avatarSize.xl,
    height: Layout.avatarSize.xl,
    borderRadius: Layout.avatarSize.xl / 2,
    backgroundColor: Colors.gray200,
  },
  bio: {
    fontSize: FontSize.md,
    color: Colors.black,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  followers: {
    fontSize: FontSize.md,
    color: Colors.gray500,
    marginTop: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.black,
  },
  followButton: {
    backgroundColor: Colors.black,
    borderColor: Colors.black,
  },
  followButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.white,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.black,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.gray400,
  },
  activeTabText: {
    color: Colors.black,
  },
  postsSection: {
    paddingTop: Spacing.sm,
  },
  postItem: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  postContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  postText: {
    fontSize: FontSize.md,
    color: Colors.black,
    lineHeight: 22,
  },
  postMeta: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: Spacing.sm,
  },
  postThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.gray100,
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
    color: Colors.gray400,
    marginTop: Spacing.md,
  },
});

export default ProfileScreen;
