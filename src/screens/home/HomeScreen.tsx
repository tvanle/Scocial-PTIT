import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Media, Poll, RootStackParamList } from '../../types';
import { postService } from '../../services/post/postService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatTimeAgo } from '../../utils/dateUtils';
import { EmptyState, BottomMenu, SharePostModal, ConfirmDialog } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';
import { useTheme } from '../../hooks/useThemeColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

// Image carousel component
const PostImages: React.FC<{ media: Media[]; colors: any; onPress?: () => void }> = React.memo(({ media, colors, onPress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CONTENT_WIDTH);
    setCurrentIndex(index);
  };

  // Single image - tappable
  if (media.length === 1) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={imgStyles.singleContainer}>
        <Image source={{ uri: media[0].url }} style={[imgStyles.singleImage, { backgroundColor: colors.gray100 }]} resizeMode="cover" />
      </TouchableOpacity>
    );
  }

  // Multiple images - carousel (swipeable)
  return (
    <View style={imgStyles.carouselContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CONTENT_WIDTH}
        snapToAlignment="start"
        nestedScrollEnabled
      >
        {media.map((item, index) => (
          <Image
            key={item.id || index}
            source={{ uri: item.url }}
            style={[imgStyles.carouselImage, { backgroundColor: colors.gray100 }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={imgStyles.paginationContainer}>
        {media.map((_, index) => (
          <View
            key={index}
            style={[
              imgStyles.paginationDot,
              { backgroundColor: index === currentIndex ? colors.primary : colors.gray300 },
            ]}
          />
        ))}
      </View>

      {/* Image counter */}
      <View style={[imgStyles.imageCounter, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <Text style={imgStyles.imageCounterText}>
          {currentIndex + 1}/{media.length}
        </Text>
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
  carouselContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  carouselImage: {
    width: CONTENT_WIDTH,
    height: 300,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageCounter: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  imageCounterText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    color: '#fff',
  },
});

// Poll component
const PostPoll: React.FC<{
  poll: Poll;
  postId: string;
  colors: any;
  onVote: (optionId: string) => void;
}> = React.memo(({ poll, postId, colors, onVote }) => {
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

  // Calculate total votes
  const totalVotes = poll.options.reduce((sum, opt) => sum + (opt._count?.votes || 0), 0);

  const handleVote = async (optionId: string) => {
    if (votedOptionId) return; // Already voted
    setVotedOptionId(optionId);
    onVote(optionId);
  };

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <View style={pollStyles.container}>
      {poll.options.map((option) => {
        const votes = option._count?.votes || 0;
        const percentage = getPercentage(votes);
        const isVoted = votedOptionId === option.id;
        const hasVoted = votedOptionId !== null;

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleVote(option.id)}
            disabled={hasVoted}
            style={[
              pollStyles.option,
              { borderColor: isVoted ? colors.primary : colors.borderLight },
            ]}
            activeOpacity={0.7}
          >
            {/* Progress bar background */}
            <View
              style={[
                pollStyles.progressBar,
                {
                  width: hasVoted ? `${percentage}%` : '0%',
                  backgroundColor: isVoted ? colors.primary + '30' : colors.gray200,
                },
              ]}
            />
            <View style={pollStyles.optionContent}>
              <Text style={[pollStyles.optionText, { color: colors.textPrimary }]}>
                {option.text}
              </Text>
              {hasVoted && (
                <Text style={[pollStyles.percentageText, { color: colors.textSecondary }]}>
                  {percentage}%
                </Text>
              )}
            </View>
            {isVoted && (
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={pollStyles.checkIcon} />
            )}
          </TouchableOpacity>
        );
      })}
      <Text style={[pollStyles.totalVotes, { color: colors.textTertiary }]}>
        {totalVotes} lượt bình chọn
      </Text>
    </View>
  );
});

const pollStyles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  option: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  optionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  percentageText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    marginLeft: Spacing.sm,
  },
  checkIcon: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    marginTop: -9,
  },
  totalVotes: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});

// Post Card Component
const PostCard: React.FC<{
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onShare: () => void;
  onProfile: () => void;
  onMore: () => void;
  onVote: (optionId: string) => void;
  colors: any;
}> = React.memo(({ post, onLike, onComment, onRepost, onShare, onProfile, onMore, onVote, colors }) => {
  const timeAgo = formatTimeAgo(post.createdAt);

  const dynamicStyles = {
    postCard: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: Spacing.sm,
      marginVertical: Spacing.xs,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      ...Shadow.sm,
    },
    postAvatar: {
      width: Layout.avatarSize.md,
      height: Layout.avatarSize.md,
      borderRadius: Layout.avatarSize.md / 2,
      backgroundColor: colors.gray200,
    },
    username: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
    },
    timeAgo: {
      fontSize: FontSize.xs,
      color: colors.textTertiary,
      marginTop: 2,
    },
    postContent: {
      fontSize: FontSize.md,
      color: colors.textPrimary,
      lineHeight: 22,
      marginTop: Spacing.md,
    },
    statsText: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      marginTop: Spacing.md,
    },
    interactionBar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginTop: Spacing.lg,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    interactionCount: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      fontWeight: FontWeight.medium,
    },
  };

  return (
    <View style={dynamicStyles.postCard}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={onProfile} style={styles.postHeaderLeft}>
          <Image
            source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
            style={dynamicStyles.postAvatar}
          />
          <View style={styles.postHeaderInfo}>
            <View style={styles.usernameRow}>
              <Text style={dynamicStyles.username}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
              )}
            </View>
            <Text style={dynamicStyles.timeAgo}>{timeAgo}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMore} style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content - tappable to navigate */}
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        <Text style={dynamicStyles.postContent}>{post.content}</Text>
      </TouchableOpacity>

      {/* Media - outside TouchableOpacity so carousel can swipe */}
      {post.media && post.media.length > 0 && (
        <PostImages media={post.media} colors={colors} onPress={onComment} />
      )}

      {/* Poll */}
      {post.poll && post.poll.options && post.poll.options.length > 0 && (
        <PostPoll poll={post.poll} postId={post.id} colors={colors} onVote={onVote} />
      )}

      {/* Stats Text Line */}
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <Text style={dynamicStyles.statsText}>
            {post.likesCount > 0 ? `${post.likesCount} Likes` : ''}
            {post.likesCount > 0 && post.commentsCount > 0 ? ' . ' : ''}
            {post.commentsCount > 0 ? `${post.commentsCount} Comments` : ''}
          </Text>
        )}
      </TouchableOpacity>

      {/* Interaction Bar */}
      <View style={dynamicStyles.interactionBar}>
        <View style={styles.interactionLeft}>
          <TouchableOpacity onPress={onLike} style={styles.interactionButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? colors.like : colors.textSecondary}
            />
            {post.likesCount > 0 && (
              <Text style={[dynamicStyles.interactionCount, post.isLiked && { color: colors.like }]}>
                {post.likesCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onComment} style={styles.interactionButton}>
            <Ionicons name="chatbox-outline" size={20} color={colors.textSecondary} />
            {post.commentsCount > 0 && (
              <Text style={dynamicStyles.interactionCount}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRepost} style={styles.interactionButton}>
            <Ionicons
              name="repeat-outline"
              size={22}
              color={post.isShared ? colors.repost : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onShare} style={styles.interactionButton}>
            <Ionicons name="paper-plane-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const { user, accessToken } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { handleShare, handleToggleRepost, handleToggleLike } = usePostActions();
  const needsRefresh = useRef(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<BottomMenuItem[]>([]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getFeed({ page: 1, limit: 20 });
      setPosts(response.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      setPosts([]);
      fetchPosts();
    }
  }, [accessToken]);

  // Re-fetch when coming back from PostDetail to sync data
  useFocusEffect(
    useCallback(() => {
      if (needsRefresh.current) {
        needsRefresh.current = false;
        fetchPosts();
      }
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ));

    const success = await handleToggleLike(postId, post.isLiked);
    if (!success) {
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount + 1 : p.likesCount - 1 }
          : p
      ));
    }
  }, [posts, handleToggleLike]);

  const handleRepostToggle = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const wasShared = post.isShared;
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, isShared: !wasShared, sharesCount: wasShared ? p.sharesCount - 1 : p.sharesCount + 1 }
        : p
    ));

    const success = await handleToggleRepost(postId, wasShared);
    if (!success) {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, isShared: wasShared, sharesCount: wasShared ? p.sharesCount + 1 : p.sharesCount - 1 }
          : p
      ));
    }
  }, [posts, handleToggleRepost]);

  const handleComment = useCallback((postId: string) => {
    needsRefresh.current = true;
    navigation.navigate('PostDetail', { postId });
  }, [navigation]);

  const handleProfile = useCallback((userId: string) => {
    navigation.navigate('UserProfile', { userId });
  }, [navigation]);

  const handleVote = useCallback(async (postId: string, optionId: string) => {
    try {
      await postService.votePoll(postId, optionId);
      // Optimistically update the UI - increment vote count for the selected option
      setPosts(prev => prev.map(p => {
        if (p.id !== postId || !p.poll) return p;
        return {
          ...p,
          poll: {
            ...p.poll,
            options: p.poll.options.map(opt => ({
              ...opt,
              _count: {
                votes: opt.id === optionId ? (opt._count?.votes || 0) + 1 : (opt._count?.votes || 0),
              },
            })),
          },
        };
      }));
    } catch {
      // silently fail
    }
  }, []);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  // Share modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [sharePostData, setSharePostData] = useState<{ id: string; authorName: string; content?: string } | null>(null);

  const handleSharePost = useCallback((post: Post) => {
    setSharePostData({
      id: post.id,
      authorName: post.author.fullName,
      content: post.content,
    });
    setShareModalVisible(true);
  }, []);

  const handleMore = useCallback((postId: string) => {
    const post = posts.find(p => p.id === postId);
    const isOwnPost = post?.author.id === user?.id;

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
          onPress: () => setPosts(prev => prev.filter(p => p.id !== postId)),
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
  }, [posts, user]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletePostId) return;
    try {
      await postService.deletePost(deletePostId);
      setPosts(prev => prev.filter(p => p.id !== deletePostId));
    } catch {
      // silently fail
    }
    setDeleteConfirmVisible(false);
    setDeletePostId(null);
  }, [deletePostId]);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => handleLike(item.id)}
      onComment={() => handleComment(item.id)}
      onRepost={() => handleRepostToggle(item.id)}
      onShare={() => handleSharePost(item)}
      onProfile={() => handleProfile(item.author.id)}
      onMore={() => handleMore(item.id)}
      onVote={(optionId) => handleVote(item.id, optionId)}
      colors={colors}
    />
  ), [handleLike, handleComment, handleRepostToggle, handleSharePost, handleProfile, handleMore, handleVote, colors]);

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.cardBackground, borderBottomColor: colors.borderLight }]}>
      <TouchableOpacity
        style={styles.headerIconButton}
        onPress={() => (navigation as any).navigate('Notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color={colors.gray400} />
      </TouchableOpacity>
      <Image
        source={require('../../../assets/logo.png')}
        style={styles.headerLogo}
        resizeMode="contain"
      />
      <TouchableOpacity
        style={styles.headerIconButton}
        onPress={() => (navigation as any).navigate('Search')}
      >
        <Ionicons name="search-outline" size={24} color={colors.gray400} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.gray50 }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.gray50 }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      {renderHeader()}

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={styles.feedContent}
        ListEmptyComponent={
          <EmptyState
            icon="newspaper-outline"
            title="Chưa có bài viết nào"
            subtitle="Hãy theo dõi bạn bè để xem bài viết"
          />
        }
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        initialNumToRender={5}
        windowSize={5}
      />

      <BottomMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        items={menuItems}
      />

      <ConfirmDialog
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa bài viết?"
        message="Bài viết này sẽ bị xóa vĩnh viễn và không thể khôi phục."
        confirmText="Xóa"
        cancelText="Hủy"
        confirmDestructive
        icon="trash"
      />

      {/* Share Post Modal */}
      {sharePostData && (
        <SharePostModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSharePostData(null);
          }}
          postId={sharePostData.id}
          postAuthorName={sharePostData.authorName}
          postContent={sharePostData.content}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Layout.headerHeight,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  headerLogo: {
    width: 55,
    height: 55,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedContent: {
    paddingVertical: Spacing.sm,
    paddingBottom: 100,
  },
  // Post Card
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
  postHeaderInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreButton: {
    padding: Spacing.sm,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});

export default HomeScreen;
