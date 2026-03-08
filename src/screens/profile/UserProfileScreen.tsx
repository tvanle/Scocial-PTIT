import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Media, RootStackParamList, UserProfile } from '../../types';
import { userService } from '../../services/user/userService';
import { postService } from '../../services/post/postService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';
import { BottomMenu } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';

type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Image layout component (same as HomeScreen)
const PostImages: React.FC<{ media: Media[] }> = React.memo(({ media }) => {
  if (!media || media.length === 0) return null;

  if (media.length === 1) {
    return (
      <View style={imgStyles.singleContainer}>
        <Image source={{ uri: media[0].url }} style={imgStyles.singleImage} resizeMode="cover" />
      </View>
    );
  }

  if (media.length === 2) {
    return (
      <View style={imgStyles.doubleContainer}>
        <Image source={{ uri: media[0].url }} style={imgStyles.doubleImage} resizeMode="cover" />
        <Image source={{ uri: media[1].url }} style={imgStyles.doubleImage} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={imgStyles.tripleContainer}>
      <Image source={{ uri: media[0].url }} style={imgStyles.tripleLeft} resizeMode="cover" />
      <View style={imgStyles.tripleRight}>
        <Image source={{ uri: media[1].url }} style={imgStyles.tripleRightImage} resizeMode="cover" />
        <Image source={{ uri: media[2]?.url || media[1].url }} style={imgStyles.tripleRightImage} resizeMode="cover" />
      </View>
    </View>
  );
});

const imgStyles = StyleSheet.create({
  singleContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  singleImage: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.gray100,
  },
  doubleContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  doubleImage: {
    flex: 1,
    height: 220,
    backgroundColor: Colors.gray100,
  },
  tripleContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
    height: 300,
  },
  tripleLeft: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  tripleRight: {
    flex: 1,
    gap: Spacing.xs,
  },
  tripleRightImage: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
});

// Full PostCard component (same style as HomeScreen)
const UserProfilePostCard: React.FC<{
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onShare: () => void;
  onProfile: () => void;
  onMore: () => void;
}> = React.memo(({ post, onLike, onComment, onRepost, onShare, onProfile, onMore }) => {
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <View style={cardStyles.postCard}>
      {/* User Header */}
      <View style={cardStyles.postHeader}>
        <TouchableOpacity onPress={onProfile} style={cardStyles.postHeaderLeft}>
          <Image
            source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
            style={cardStyles.postAvatar}
          />
          <View style={cardStyles.postHeaderInfo}>
            <View style={cardStyles.usernameRow}>
              <Text style={cardStyles.username}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.verified} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={cardStyles.timeAgo}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMore} style={cardStyles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        <Text style={cardStyles.postContent}>{post.content}</Text>

        {post.media && post.media.length > 0 && (
          <PostImages media={post.media} />
        )}

        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <Text style={cardStyles.statsText}>
            {post.likesCount > 0 ? `${post.likesCount} Likes` : ''}
            {post.likesCount > 0 && post.commentsCount > 0 ? ' . ' : ''}
            {post.commentsCount > 0 ? `${post.commentsCount} Comments` : ''}
          </Text>
        )}
      </TouchableOpacity>

      {/* Interaction Bar */}
      <View style={cardStyles.interactionBar}>
        <View style={cardStyles.interactionLeft}>
          <TouchableOpacity onPress={onLike} style={cardStyles.interactionButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? Colors.like : Colors.textSecondary}
            />
            {post.likesCount > 0 && (
              <Text style={[cardStyles.interactionCount, post.isLiked && { color: Colors.like }]}>
                {post.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onComment} style={cardStyles.interactionButton}>
            <Ionicons name="chatbox-outline" size={20} color={Colors.textSecondary} />
            {post.commentsCount > 0 && (
              <Text style={cardStyles.interactionCount}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRepost} style={cardStyles.interactionButton}>
            <Ionicons
              name="repeat-outline"
              size={22}
              color={post.isShared ? Colors.repost : Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onShare} style={cardStyles.interactionButton}>
            <Ionicons name="paper-plane-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={post.isSaved ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const cardStyles = StyleSheet.create({
  postCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: Layout.avatarSize.md,
    height: Layout.avatarSize.md,
    borderRadius: Layout.avatarSize.md / 2,
    backgroundColor: Colors.gray200,
  },
  postHeaderInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  timeAgo: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  postContent: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  statsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  interactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  interactionCount: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
});

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
  const { handleShare, handleToggleRepost, handleToggleLike } = usePostActions();
  const needsRefresh = useRef(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<BottomMenuItem[]>([]);

  const fetchData = async () => {
    try {
      const userData = await userService.getUser(userId);
      setProfileUser(userData);

      const results = await Promise.allSettled([
        postService.getUserPosts(userId, { page: 1, limit: 20 }),
        postService.getSharedPosts(userId, { page: 1, limit: 20 }),
      ]);
      setPosts(results[0].status === 'fulfilled' ? results[0].value?.data || [] : []);
      setSharedPosts(results[1].status === 'fulfilled' ? results[1].value?.data || [] : []);
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

  useFocusEffect(
    useCallback(() => {
      if (needsRefresh.current) {
        needsRefresh.current = false;
        fetchData();
      }
    }, [userId])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [userId]);

  const handleFollow = useCallback(async () => {
    if (!profileUser) return;

    const wasFollowing = profileUser.isFollowing;
    const currentFollowersCount = profileUser.followersCount || 0;

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

  // Post action handlers
  const updatePostInList = useCallback((postId: string, updater: (post: Post) => Post) => {
    setPosts(prev => prev.map(p => p.id === postId ? updater(p) : p));
    setSharedPosts(prev => prev.map(p => p.id === postId ? updater(p) : p));
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    const allPosts = [...posts, ...sharedPosts];
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    updatePostInList(postId, p => ({
      ...p,
      isLiked: !p.isLiked,
      likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1,
    }));

    const success = await handleToggleLike(postId, post.isLiked);
    if (!success) {
      updatePostInList(postId, p => ({
        ...p,
        isLiked: !p.isLiked,
        likesCount: p.isLiked ? p.likesCount + 1 : p.likesCount - 1,
      }));
    }
  }, [posts, sharedPosts, handleToggleLike, updatePostInList]);

  const handleRepostToggle = useCallback(async (postId: string) => {
    const allPosts = [...posts, ...sharedPosts];
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    const wasShared = post.isShared;
    updatePostInList(postId, p => ({
      ...p,
      isShared: !wasShared,
      sharesCount: wasShared ? p.sharesCount - 1 : p.sharesCount + 1,
    }));

    const success = await handleToggleRepost(postId, wasShared);
    if (!success) {
      updatePostInList(postId, p => ({
        ...p,
        isShared: wasShared,
        sharesCount: wasShared ? p.sharesCount + 1 : p.sharesCount - 1,
      }));
    }
  }, [posts, sharedPosts, handleToggleRepost, updatePostInList]);

  const handleComment = useCallback((postId: string) => {
    needsRefresh.current = true;
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleProfile = useCallback((authorId: string) => {
    if (authorId !== userId) {
      navigation.push('UserProfile', { userId: authorId });
    }
  }, [navigation, userId]);

  const handleMore = useCallback((postId: string) => {
    const allPosts = [...posts, ...sharedPosts];
    const post = allPosts.find(p => p.id === postId);
    const isOwnPost = post?.author.id === currentUser?.id;

    const items: BottomMenuItem[] = [];

    if (isOwnPost) {
      items.push({
        label: 'Xóa bài viết',
        icon: 'trash-outline',
        destructive: true,
        onPress: async () => {
          try {
            await postService.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            setSharedPosts(prev => prev.filter(p => p.id !== postId));
          } catch {
            // silently fail
          }
        },
      });
    } else {
      items.push(
        {
          label: 'Ẩn bài viết',
          icon: 'eye-off-outline',
          onPress: () => {
            setPosts(prev => prev.filter(p => p.id !== postId));
            setSharedPosts(prev => prev.filter(p => p.id !== postId));
          },
        },
        {
          label: 'Báo cáo',
          icon: 'flag-outline',
          destructive: true,
          onPress: async () => {
            try {
              await postService.reportPost(postId, 'Nội dung không phù hợp');
            } catch {
              // silently fail
            }
          },
        },
      );
    }

    setMenuItems(items);
    setMenuVisible(true);
  }, [posts, sharedPosts, currentUser]);

  const renderPostCard = (post: Post) => (
    <UserProfilePostCard
      key={post.id}
      post={post}
      onLike={() => handleLike(post.id)}
      onComment={() => handleComment(post.id)}
      onRepost={() => handleRepostToggle(post.id)}
      onShare={() => handleShare(post.author.fullName)}
      onProfile={() => handleProfile(post.author.id)}
      onMore={() => handleMore(post.id)}
    />
  );

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
              <View style={styles.profileUsernameRow}>
                <Text style={styles.profileUsername}>{profileUser.studentId}</Text>
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
            {profileUser.followersCount || 0} người theo dõi
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, profileUser.isFollowing ? styles.followingButton : styles.followButton]}
              onPress={handleFollow}
            >
              <Text style={profileUser.isFollowing ? styles.followingButtonText : styles.followButtonText}>
                {profileUser.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleMessage}>
              <Text style={styles.actionButtonText}>Nhắn tin</Text>
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
              Trả lời
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
              posts.map(renderPostCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
              </View>
            )
          ) : activeTab === 'reposts' ? (
            sharedPosts.length > 0 ? (
              sharedPosts.map(renderPostCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="repeat-outline" size={48} color={Colors.gray300} />
                <Text style={styles.emptyText}>Chưa có bài đăng lại nào</Text>
              </View>
            )
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="chatbox-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyText}>Chưa có trả lời nào</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={menuItems}
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
  profileUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileUsername: {
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
  emptyState: {
    padding: Spacing.huge,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.gray400,
    marginTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserProfileScreen;
