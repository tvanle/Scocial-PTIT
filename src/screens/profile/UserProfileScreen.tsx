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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, RootStackParamList, UserProfile } from '../../types';
import { userService } from '../../services/user/userService';
import { postService } from '../../services/post/postService';
import { formatTimeAgo } from '../../utils/dateUtils';

type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();
  const { userId } = route.params;
  const { user: currentUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sharedPosts, setSharedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'reposts'>('posts');

  const fetchData = async () => {
    try {
      const [userData, postsData, sharesData] = await Promise.all([
        userService.getUser(userId),
        postService.getUserPosts(userId, { page: 1, limit: 20 }),
        postService.getSharedPosts(userId, { page: 1, limit: 20 }),
      ]);
      setProfileUser(userData);
      setPosts(postsData.data);
      setSharedPosts(sharesData.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin người dùng. Vui lòng thử lại.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [userId]);

  const handleFollow = useCallback(async () => {
    if (!profileUser) return;

    const wasFollowing = profileUser.isFollowing;
    const currentFollowersCount = profileUser.followersCount || 0;

    // Optimistic update
    setProfileUser({
      ...profileUser,
      isFollowing: !wasFollowing,
      followersCount: wasFollowing ? currentFollowersCount - 1 : currentFollowersCount + 1,
    });

    try {
      if (wasFollowing) {
        await userService.unfollow(userId);
      } else {
        await userService.follow(userId);
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
      // Revert on error
      setProfileUser({
        ...profileUser,
        isFollowing: wasFollowing,
        followersCount: currentFollowersCount,
      });
      Alert.alert('Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
    }
  }, [profileUser, userId]);

  const handleMessage = useCallback(() => {
    if (!profileUser) return;
    navigation.navigate('ChatRoom', { conversationId: userId });
  }, [profileUser, navigation, userId]);

  if (loading || !profileUser) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.textPrimary} />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <View style={styles.profileInfo}>
              <Text style={styles.fullName}>{profileUser.fullName}</Text>
              <View style={styles.usernameRow}>
                <Text style={styles.username}>{profileUser.studentId}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>ptit.edu.vn</Text>
                </View>
              </View>
            </View>
            <Image
              source={{ uri: profileUser.avatar }}
              style={styles.avatar}
            />
          </View>

          {profileUser.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}

          <Text style={styles.followers}>
            {profileUser.followersCount || 0} nguoi theo doi
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, profileUser.isFollowing ? styles.followingButton : styles.followButton]}
              onPress={handleFollow}
            >
              <Text style={profileUser.isFollowing ? styles.followingButtonText : styles.followButtonText}>
                {profileUser.isFollowing ? 'Dang theo doi' : 'Theo doi'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <Text style={styles.actionButtonText}>Nhan tin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
              Bài đăng
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
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reposts' && styles.activeTab]}
            onPress={() => setActiveTab('reposts')}
          >
            <Text style={[styles.tabText, activeTab === 'reposts' && styles.activeTabText]}>
              Bài đăng lại
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts */}
        <View style={styles.postsSection}>
          {activeTab === 'posts' ? (
            posts.length > 0 ? (
              posts.map(post => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postItem}
                  onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                >
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
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Chua co bai viet nao</Text>
              </View>
            )
          ) : activeTab === 'reposts' ? (
            sharedPosts.length > 0 ? (
              sharedPosts.map(post => (
                <TouchableOpacity
                  key={post.id}
                  style={styles.postItem}
                  onPress={() => navigation.navigate('PostDetail', { postId: post.id })}
                >
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
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Chưa có bài đăng lại nào</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
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
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
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
    color: Colors.textPrimary,
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
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  followButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  followButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.white,
  },
  followingButton: {
    backgroundColor: Colors.white,
    borderColor: Colors.border,
  },
  followingButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
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
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.gray400,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: FontWeight.bold,
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
    color: Colors.textPrimary,
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
  emptyState: {
    padding: Spacing.huge,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.gray400,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserProfileScreen;
