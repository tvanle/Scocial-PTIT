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
  Share,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Media } from '../../types';
import { postService } from '../../services/post/postService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';
import { BottomMenu } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';

interface ProfileScreenProps {
  navigation: any;
  route?: any;
}

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
const ProfilePostCard: React.FC<{
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
    <View style={styles.postCard}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={onProfile} style={styles.postHeaderLeft}>
          <Image
            source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
            style={styles.postAvatar}
          />
          <View style={styles.postHeaderInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.verified} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMore} style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content - tappable to navigate */}
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <PostImages media={post.media} />
        )}

        {/* Stats Text Line */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <Text style={styles.statsText}>
            {post.likesCount > 0 ? `${post.likesCount} Likes` : ''}
            {post.likesCount > 0 && post.commentsCount > 0 ? ' . ' : ''}
            {post.commentsCount > 0 ? `${post.commentsCount} Comments` : ''}
          </Text>
        )}
      </TouchableOpacity>

      {/* Interaction Bar */}
      <View style={styles.interactionBar}>
        <View style={styles.interactionLeft}>
          <TouchableOpacity onPress={onLike} style={styles.interactionButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? Colors.like : Colors.textSecondary}
            />
            {post.likesCount > 0 && (
              <Text style={[styles.interactionCount, post.isLiked && { color: Colors.like }]}>
                {post.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onComment} style={styles.interactionButton}>
            <Ionicons name="chatbox-outline" size={20} color={Colors.textSecondary} />
            {post.commentsCount > 0 && (
              <Text style={styles.interactionCount}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRepost} style={styles.interactionButton}>
            <Ionicons
              name="repeat-outline"
              size={22}
              color={post.isShared ? Colors.repost : Colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onShare} style={styles.interactionButton}>
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

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const { user: currentUser, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'reposts'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [sharedPosts, setSharedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleShare, handleToggleRepost, handleToggleLike } = usePostActions();
  const needsRefresh = useRef(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<BottomMenuItem[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  const isOwnProfile = !route?.params?.userId || route?.params?.userId === currentUser?.id;
  const user = currentUser;
  const userId = route?.params?.userId || currentUser?.id;

  const fetchData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled([
        postService.getUserPosts(userId, { page: 1, limit: 20 }),
        postService.getSharedPosts(userId, { page: 1, limit: 20 }),
      ]);
      setPosts(results[0].status === 'fulfilled' ? results[0].value?.data || [] : []);
      setSharedPosts(results[1].status === 'fulfilled' ? results[1].value?.data || [] : []);
    } catch {
      setPosts([]);
      setSharedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (needsRefresh.current) {
        needsRefresh.current = false;
        fetchData();
      }
    }, [fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

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
    if (authorId !== currentUser?.id) {
      navigation.navigate('UserProfile', { userId: authorId });
    }
  }, [navigation, currentUser]);

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
        onPress: () => {
          setDeletePostId(postId);
          setDeleteConfirmVisible(true);
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

  const handleConfirmDelete = useCallback(async () => {
    if (!deletePostId) return;
    try {
      await postService.deletePost(deletePostId);
      setPosts(prev => prev.filter(p => p.id !== deletePostId));
      setSharedPosts(prev => prev.filter(p => p.id !== deletePostId));
    } catch {
      // silently fail
    }
    setDeleteConfirmVisible(false);
    setDeletePostId(null);
  }, [deletePostId]);

  const tabs = [
    { key: 'posts' as const, label: 'Bài đăng' },
    { key: 'replies' as const, label: 'Trả lời' },
    { key: 'reposts' as const, label: 'Bài đăng lại' },
  ];

  const renderPostCard = (post: Post) => (
    <ProfilePostCard
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon}>
          <Ionicons name="share-outline" size={24} color={Colors.textPrimary} />
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
              source={{ uri: user?.avatar || DEFAULT_AVATAR }}
              style={styles.avatar}
            />
          </View>

          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}

          {/* Stats - Inline text style */}
          <Text style={styles.statsInline}>
            {user?.postsCount || 0} bài đăng . {user?.followersCount || 0} Lượt người theo dõi
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={styles.actionBtnText}>Chỉnh sửa trang cá nhân</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Share.share({ message: `Xem trang cá nhân của ${user?.fullName} trên PTIT Social!` })}
                >
                  <Text style={styles.actionBtnText}>Chia sẻ trang cá nhân</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.followButton]}>
                  <Text style={styles.followButtonText}>Theo dõi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>Nhắn tin</Text>
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

      <BottomMenu
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        title="Bạn có chắc muốn xóa bài viết này?"
        items={[
          {
            label: 'Xóa',
            icon: 'trash-outline',
            destructive: true,
            onPress: handleConfirmDelete,
          },
        ]}
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
  statsInline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
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
  // PostCard styles (same as HomeScreen)
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
