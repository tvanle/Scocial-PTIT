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
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Media, RootStackParamList, UserProfile, Comment } from '../../types';
import { userService } from '../../services/user/userService';
import { postService } from '../../services/post/postService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';
import { BottomMenu } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';
import { useTheme } from '../../hooks/useThemeColors';

type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Image layout component (same as HomeScreen)
const PostImages: React.FC<{ media: Media[]; colors: any }> = React.memo(({ media, colors }) => {
  if (!media || media.length === 0) return null;

  if (media.length === 1) {
    return (
      <View style={imgStyles.singleContainer}>
        <Image source={{ uri: media[0].url }} style={[imgStyles.singleImage, { backgroundColor: colors.gray100 }]} resizeMode="cover" />
      </View>
    );
  }

  if (media.length === 2) {
    return (
      <View style={imgStyles.doubleContainer}>
        <Image source={{ uri: media[0].url }} style={[imgStyles.doubleImage, { backgroundColor: colors.gray100 }]} resizeMode="cover" />
        <Image source={{ uri: media[1].url }} style={[imgStyles.doubleImage, { backgroundColor: colors.gray100 }]} resizeMode="cover" />
      </View>
    );
  }

  return (
    <View style={imgStyles.tripleContainer}>
      <Image source={{ uri: media[0].url }} style={[imgStyles.tripleLeft, { backgroundColor: colors.gray100 }]} resizeMode="cover" />
      <View style={imgStyles.tripleRight}>
        <Image source={{ uri: media[1].url }} style={[imgStyles.tripleRightImage, { backgroundColor: colors.gray100 }]} resizeMode="cover" />
        <Image source={{ uri: media[2]?.url || media[1].url }} style={[imgStyles.tripleRightImage, { backgroundColor: colors.gray100 }]} resizeMode="cover" />
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
  },
  tripleRight: {
    flex: 1,
    gap: Spacing.xs,
  },
  tripleRightImage: {
    flex: 1,
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
  colors: any;
}> = React.memo(({ post, onLike, onComment, onRepost, onShare, onProfile, onMore, colors }) => {
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <View style={[cardStyles.postCard, { backgroundColor: colors.cardBackground }]}>
      {/* User Header */}
      <View style={cardStyles.postHeader}>
        <TouchableOpacity onPress={onProfile} style={cardStyles.postHeaderLeft}>
          <Image
            source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
            style={[cardStyles.postAvatar, { backgroundColor: colors.gray200 }]}
          />
          <View style={cardStyles.postHeaderInfo}>
            <View style={cardStyles.usernameRow}>
              <Text style={[cardStyles.username, { color: colors.textPrimary }]}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={[cardStyles.timeAgo, { color: colors.textTertiary }]}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMore} style={cardStyles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        <Text style={[cardStyles.postContent, { color: colors.textPrimary }]}>{post.content}</Text>

        {post.media && post.media.length > 0 && (
          <PostImages media={post.media} colors={colors} />
        )}

        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <Text style={[cardStyles.statsText, { color: colors.textSecondary }]}>
            {post.likesCount > 0 ? `${post.likesCount} Likes` : ''}
            {post.likesCount > 0 && post.commentsCount > 0 ? ' . ' : ''}
            {post.commentsCount > 0 ? `${post.commentsCount} Comments` : ''}
          </Text>
        )}
      </TouchableOpacity>

      {/* Interaction Bar */}
      <View style={[cardStyles.interactionBar, { borderTopColor: colors.borderLight }]}>
        <View style={cardStyles.interactionLeft}>
          <TouchableOpacity onPress={onLike} style={cardStyles.interactionButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? colors.like : colors.textSecondary}
            />
            {post.likesCount > 0 && (
              <Text style={[cardStyles.interactionCount, { color: colors.textSecondary }, post.isLiked && { color: colors.like }]}>
                {post.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onComment} style={cardStyles.interactionButton}>
            <Ionicons name="chatbox-outline" size={20} color={colors.textSecondary} />
            {post.commentsCount > 0 && (
              <Text style={[cardStyles.interactionCount, { color: colors.textSecondary }]}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRepost} style={cardStyles.interactionButton}>
            <Ionicons
              name="repeat-outline"
              size={22}
              color={post.isShared ? colors.repost : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onShare} style={cardStyles.interactionButton}>
            <Ionicons name="paper-plane-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity>
          <Ionicons
            name={post.isSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={post.isSaved ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const cardStyles = StyleSheet.create({
  postCard: {
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
  },
  timeAgo: {
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  moreButton: {
    padding: Spacing.sm,
  },
  postContent: {
    fontSize: FontSize.md,
    lineHeight: 22,
    marginTop: Spacing.md,
  },
  statsText: {
    fontSize: FontSize.sm,
    marginTop: Spacing.md,
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
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
    fontWeight: FontWeight.medium,
  },
});

// Reply Card component for showing user's comments (thread style)
const ReplyCard: React.FC<{
  reply: { comment: Comment; post: Post };
  onPress: () => void;
  colors: any;
}> = React.memo(({ reply, onPress, colors }) => {
  const { comment, post } = reply;
  const commentTime = formatTimeAgo(comment.createdAt);
  const postTime = formatTimeAgo(post.createdAt);

  return (
    <TouchableOpacity style={[replyStyles.replyCard, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={0.7}>
      {/* Original post (top part of thread) */}
      <View style={replyStyles.threadTop}>
        <View style={replyStyles.threadAvatarCol}>
          <Image
            source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
            style={[replyStyles.threadAvatarSmall, { backgroundColor: colors.gray200 }]}
          />
          <View style={[replyStyles.threadLine, { backgroundColor: colors.gray200 }]} />
        </View>
        <View style={replyStyles.threadContent}>
          <View style={replyStyles.threadHeader}>
            <Text style={[replyStyles.threadAuthor, { color: colors.textPrimary }]}>{post.author.fullName}</Text>
            {post.author.isVerified && (
              <Ionicons name="checkmark-circle" size={12} color={colors.verified} style={{ marginLeft: 2 }} />
            )}
            <Text style={[replyStyles.threadTime, { color: colors.textTertiary }]}> · {postTime}</Text>
          </View>
          <Text style={[replyStyles.threadPostText, { color: colors.textSecondary }]} numberOfLines={2}>{post.content}</Text>
        </View>
      </View>

      {/* Reply (bottom part of thread) */}
      <View style={replyStyles.threadBottom}>
        <Image
          source={{ uri: comment.author.avatar || DEFAULT_AVATAR }}
          style={[replyStyles.threadAvatarMain, { backgroundColor: colors.gray200 }]}
        />
        <View style={replyStyles.threadReplyContent}>
          <View style={replyStyles.threadHeader}>
            <Text style={[replyStyles.threadReplyAuthor, { color: colors.textPrimary }]}>{comment.author.fullName}</Text>
            {comment.author.isVerified && (
              <Ionicons name="checkmark-circle" size={12} color={colors.verified} style={{ marginLeft: 2 }} />
            )}
            <Text style={[replyStyles.threadTime, { color: colors.textTertiary }]}> · {commentTime}</Text>
          </View>
          <Text style={[replyStyles.replyingTo, { color: colors.textTertiary }]}>
            Đang trả lời <Text style={{ color: colors.primary }}>@{post.author.fullName}</Text>
          </Text>
          <Text style={[replyStyles.threadReplyText, { color: colors.textPrimary }]}>{comment.content}</Text>

          {/* Actions */}
          <View style={replyStyles.threadActions}>
            <View style={replyStyles.threadAction}>
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.isLiked ? colors.like : colors.textTertiary}
              />
              {(comment.likesCount || 0) > 0 && (
                <Text style={[replyStyles.threadActionText, { color: colors.textTertiary }, comment.isLiked && { color: colors.like }]}>
                  {comment.likesCount}
                </Text>
              )}
            </View>
            <View style={replyStyles.threadAction}>
              <Ionicons name="chatbubble-outline" size={15} color={colors.textTertiary} />
            </View>
            <View style={replyStyles.threadAction}>
              <Ionicons name="arrow-redo-outline" size={16} color={colors.textTertiary} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const replyStyles = StyleSheet.create({
  replyCard: {
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  threadTop: {
    flexDirection: 'row',
  },
  threadAvatarCol: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  threadAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  threadLine: {
    width: 2,
    flex: 1,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs,
    borderRadius: 1,
  },
  threadContent: {
    flex: 1,
    paddingBottom: Spacing.sm,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  threadAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  threadTime: {
    fontSize: FontSize.sm,
  },
  threadPostText: {
    fontSize: FontSize.sm,
    marginTop: Spacing.xxs,
    lineHeight: 20,
  },
  threadBottom: {
    flexDirection: 'row',
  },
  threadAvatarMain: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  threadReplyContent: {
    flex: 1,
  },
  threadReplyAuthor: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  replyingTo: {
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  threadReplyText: {
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  threadActions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.xl,
  },
  threadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  threadActionText: {
    fontSize: FontSize.xs,
  },
});

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<UserProfileNavigationProp>();
  const route = useRoute<UserProfileRouteProp>();
  const { userId } = route.params;
  const { user: currentUser } = useAuthStore();
  const { colors, isDark } = useTheme();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sharedPosts, setSharedPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<{ comment: Comment; post: Post }[]>([]);
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
        postService.getUserReplies(userId, { page: 1, limit: 20 }),
      ]);
      setPosts(results[0].status === 'fulfilled' ? results[0].value?.data || [] : []);
      setSharedPosts(results[1].status === 'fulfilled' ? results[1].value?.data || [] : []);
      setReplies(results[2].status === 'fulfilled' ? results[2].value?.data || [] : []);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      showAlert('Lỗi', 'Không thể tải thông tin người dùng. Vui lòng thử lại.');
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
      showAlert('Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
    }
  }, [profileUser, userId]);

  const handleMessage = useCallback(() => {
    if (!profileUser) return;
    navigation.navigate('ChatRoom', { userId });
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
      colors={colors}
    />
  );

  if (loading || !profileUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerIcon, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.headerIcon, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerIcon, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.headerIcon, { backgroundColor: colors.gray100 }]}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileTop}>
            <View style={styles.profileInfo}>
              <Text style={[styles.fullName, { color: colors.textPrimary }]}>{profileUser.fullName}</Text>
              <View style={styles.profileUsernameRow}>
                <Text style={[styles.profileUsername, { color: colors.textPrimary }]}>{profileUser.studentId}</Text>
                <View style={[styles.badge, { backgroundColor: colors.gray100 }]}>
                  <Text style={[styles.badgeText, { color: colors.textSecondary }]}>ptit.edu.vn</Text>
                </View>
              </View>
            </View>
            <Image
              source={{ uri: profileUser.avatar }}
              style={[styles.avatar, { backgroundColor: colors.gray200 }]}
            />
          </View>

          {profileUser.bio && <Text style={[styles.bio, { color: colors.textPrimary }]}>{profileUser.bio}</Text>}

          <Text style={[styles.followers, { color: colors.textSecondary }]}>
            {profileUser.followersCount || 0} nguoi theo doi
          </Text>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.gray100, borderColor: colors.gray200 },
                profileUser.isFollowing
                  ? { backgroundColor: colors.background, borderColor: colors.gray200 }
                  : { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={handleFollow}
            >
              <Text style={profileUser.isFollowing ? [styles.followingButtonText, { color: colors.textPrimary }] : [styles.followButtonText, { color: colors.white }]}>
                {profileUser.isFollowing ? 'Dang theo doi' : 'Theo doi'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.gray100, borderColor: colors.gray200 }]} onPress={handleMessage}>
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>Nhan tin</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.gray200, backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('posts')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'posts' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              Bai dang
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'replies' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('replies')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'replies' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              Tra loi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reposts' && [styles.activeTab, { borderBottomColor: colors.primary }]]}
            onPress={() => setActiveTab('reposts')}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'reposts' && { color: colors.primary, fontWeight: FontWeight.bold }]}>
              Bai dang lai
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
                <Ionicons name="document-text-outline" size={48} color={colors.gray200} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chua co bai viet nao</Text>
              </View>
            )
          ) : activeTab === 'reposts' ? (
            sharedPosts.length > 0 ? (
              sharedPosts.map(renderPostCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="repeat-outline" size={48} color={colors.gray200} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chua co bai dang lai nao</Text>
              </View>
            )
          ) : activeTab === 'replies' ? (
            replies.length > 0 ? (
              replies.map((reply) => (
                <ReplyCard
                  key={reply.comment.id}
                  reply={reply}
                  onPress={() => navigation.navigate('PostDetail', { postId: reply.post.id })}
                  colors={colors}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbox-outline" size={48} color={colors.gray200} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chua co tra loi nao</Text>
              </View>
            )
          ) : null}
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
    borderRadius: 12,
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
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  profileUsernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileUsername: {
    fontSize: FontSize.md,
  },
  badge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xxs,
    marginLeft: Spacing.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
  },
  avatar: {
    width: Layout.avatarSize.xl,
    height: Layout.avatarSize.xl,
    borderRadius: Layout.avatarSize.xl / 2,
  },
  bio: {
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    lineHeight: 22,
  },
  followers: {
    fontSize: FontSize.md,
    marginTop: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  followButton: {
  },
  followButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  followingButton: {
  },
  followingButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  tabs: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
  },
  activeTabText: {
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
    marginTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserProfileScreen;
