import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  ActivityIndicator,
  Dimensions,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Media, Comment, Poll } from '../../types';
import { postService } from '../../services/post/postService';
import { userService } from '../../services/user/userService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { DEFAULT_AVATAR, Strings } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';
import { BottomMenu, MusicPicker, SharePostModal } from '../../components/common';
import type { BottomMenuItem, SelectedSong } from '../../components/common';
import songsData from '../../../songs.json';
import { useTheme } from '../../hooks/useThemeColors';
import { getImageUrl } from '../../utils/image';

interface SongItem {
  title: string;
  artist: string;
  artwork_url: string;
  embed_url: string;
}

const allSongs = songsData as SongItem[];

interface ProfileScreenProps {
  navigation: any;
  route?: any;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  optionText: {
    fontSize: FontSize.md,
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
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
  },
});

// Full PostCard component with all features (matches HomeScreen)
const ProfilePostCard: React.FC<{
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onProfile: () => void;
  onMore: () => void;
  onVote: (optionId: string) => void;
  colors: any;
}> = React.memo(({ post, onLike, onComment, onShare, onProfile, onMore, onVote, colors }) => {
  const timeAgo = formatTimeAgo(post.createdAt);
  const [showFullContent, setShowFullContent] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case 'PUBLIC':
        return 'globe-outline';
      case 'FOLLOWERS':
        return 'people-outline';
      case 'PRIVATE':
        return 'lock-closed-outline';
      default:
        return 'globe-outline';
    }
  };

  // Card content width = SCREEN_WIDTH - marginHorizontal*2 - padding*2 = SCREEN_WIDTH - 16 - 32 = SCREEN_WIDTH - 48
  const cardContentWidth = SCREEN_WIDTH - 48;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / cardContentWidth);
    setCurrentImageIndex(index);
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    const mediaCount = post.media.length;

    if (mediaCount === 1) {
      return (
        <TouchableOpacity onPress={onComment} activeOpacity={0.9} style={postStyles.singleContainer}>
          <Image
            source={{ uri: getImageUrl(post.media[0].url) }}
            style={[postStyles.singleImage, { backgroundColor: colors.gray100 }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    // Multiple images - horizontal scroll with pagination dots
    return (
      <View style={postStyles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={cardContentWidth}
          snapToAlignment="start"
        >
          {post.media.map((media) => (
            <TouchableOpacity
              key={media.id}
              onPress={onComment}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: getImageUrl(media.url) }}
                style={[postStyles.carouselImage, { width: cardContentWidth, backgroundColor: colors.gray100 }]}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View style={postStyles.paginationContainer}>
          {post.media.map((_, index) => (
            <View
              key={index}
              style={[
                postStyles.paginationDot,
                {
                  backgroundColor: index === currentImageIndex ? colors.primary : colors.gray300,
                },
              ]}
            />
          ))}
        </View>

        {/* Image counter */}
        <View style={[postStyles.imageCounter, { backgroundColor: colors.overlay }]}>
          <Text style={[postStyles.imageCounterText, { color: colors.white }]}>
            {currentImageIndex + 1}/{mediaCount}
          </Text>
        </View>
      </View>
    );
  };

  const contentLength = post.content?.length || 0;
  const shouldTruncate = contentLength > 200 && !showFullContent;

  return (
    <View style={[styles.postCard, { backgroundColor: colors.cardBackground }]}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={onProfile} style={styles.postHeaderLeft}>
          <View style={postStyles.avatarContainer}>
            <Image
              source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
              style={[styles.postAvatar, { backgroundColor: colors.gray200 }]}
            />
            {post.author.isOnline && (
              <View style={[postStyles.onlineIndicator, { backgroundColor: colors.success, borderColor: colors.cardBackground }]} />
            )}
          </View>
          <View style={styles.postHeaderInfo}>
            <View style={styles.postUsernameRow}>
              <Text style={[styles.username, { color: colors.textPrimary }]}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
              )}
            </View>
            <View style={postStyles.postMeta}>
              <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>{timeAgo}</Text>
              <Ionicons
                name={getPrivacyIcon()}
                size={12}
                color={colors.textTertiary}
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMore} style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content && (
        <View style={postStyles.contentContainer}>
          <Text style={[styles.postContent, { color: colors.textPrimary }]}>
            {shouldTruncate ? post.content.slice(0, 200) + '...' : post.content}
          </Text>
          {contentLength > 200 && (
            <TouchableOpacity onPress={() => setShowFullContent(!showFullContent)}>
              <Text style={[postStyles.seeMore, { color: colors.textSecondary }]}>
                {showFullContent ? Strings.common.seeLess : Strings.common.seeMore}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Feeling & Location */}
      {(post.feeling || post.location) && (
        <View style={postStyles.feelingLocation}>
          {post.feeling && (
            <View style={postStyles.feelingContainer}>
              <Text style={[postStyles.feelingText, { color: colors.textSecondary }]}>
                dang cam thay {post.feeling}
              </Text>
            </View>
          )}
          {post.location && (
            <View style={postStyles.locationContainer}>
              <Ionicons name="location" size={14} color={colors.textSecondary} />
              <Text style={[postStyles.locationText, { color: colors.textSecondary }]}>{post.location}</Text>
            </View>
          )}
        </View>
      )}

      {/* Media */}
      {renderMedia()}

      {/* Poll */}
      {post.poll && post.poll.options && post.poll.options.length > 0 && (
        <PostPoll poll={post.poll} postId={post.id} colors={colors} onVote={onVote} />
      )}

      {/* Stats */}
      {(post.likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
        <View style={postStyles.statsContainer}>
          {post.likesCount > 0 && (
            <View style={postStyles.likeStat}>
              <View style={[postStyles.likeIcon, { backgroundColor: colors.like }]}>
                <Ionicons name="heart" size={10} color={colors.white} />
              </View>
              <Text style={[postStyles.statText, { color: colors.textTertiary }]}>{post.likesCount}</Text>
            </View>
          )}
          <View style={postStyles.rightStats}>
            {post.commentsCount > 0 && (
              <Text style={[postStyles.statText, { color: colors.textTertiary }]}>
                {post.commentsCount} {Strings.post.comments}
              </Text>
            )}
            {post.sharesCount > 0 && (
              <Text style={[postStyles.statText, { color: colors.textTertiary }]}>
                {post.sharesCount} {Strings.post.shares}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Interaction Bar */}
      <View style={[styles.interactionBar, { borderTopColor: colors.borderLight }]}>
        <View style={styles.interactionLeft}>
          <TouchableOpacity onPress={onLike} style={styles.interactionButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? colors.like : colors.textSecondary}
            />
            <Text style={[styles.interactionCount, { color: colors.textSecondary }, post.isLiked && { color: colors.like }]}>
              {Strings.post.like}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onComment} style={styles.interactionButton}>
            <Ionicons name="chatbox-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.interactionCount, { color: colors.textSecondary }]}>{Strings.post.comment}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onShare} style={styles.interactionButton}>
            <Ionicons name="share-social-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.interactionCount, { color: colors.textSecondary }]}>{Strings.post.share}</Text>
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

const postStyles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  contentContainer: {
    marginTop: Spacing.md,
  },
  seeMore: {
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },
  feelingLocation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.sm,
  },
  feelingContainer: {
    marginRight: Spacing.md,
  },
  feelingText: {
    fontSize: FontSize.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: FontSize.sm,
    marginLeft: Spacing.xs,
  },
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
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  carouselImage: {
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
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
  },
  likeStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  rightStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statText: {
    fontSize: FontSize.sm,
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
    <TouchableOpacity style={[styles.replyCard, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={0.7}>
      {/* Original post (top part of thread) */}
      <View style={styles.threadTop}>
        <View style={styles.threadAvatarCol}>
          <Image
            source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
            style={[styles.threadAvatarSmall, { backgroundColor: colors.gray200 }]}
          />
          <View style={[styles.threadLine, { backgroundColor: colors.gray200 }]} />
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.threadAuthor, { color: colors.textPrimary }]}>{post.author.fullName}</Text>
            {post.author.isVerified && (
              <Ionicons name="checkmark-circle" size={12} color={colors.verified} style={{ marginLeft: 2 }} />
            )}
            <Text style={[styles.threadTime, { color: colors.textTertiary }]}> · {postTime}</Text>
          </View>
          <Text style={[styles.threadPostText, { color: colors.textSecondary }]} numberOfLines={2}>{post.content}</Text>
        </View>
      </View>

      {/* Reply (bottom part of thread) */}
      <View style={styles.threadBottom}>
        <Image
          source={{ uri: comment.author.avatar || DEFAULT_AVATAR }}
          style={[styles.threadAvatarMain, { backgroundColor: colors.gray200 }]}
        />
        <View style={styles.threadReplyContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.threadReplyAuthor, { color: colors.textPrimary }]}>{comment.author.fullName}</Text>
            {comment.author.isVerified && (
              <Ionicons name="checkmark-circle" size={12} color={colors.verified} style={{ marginLeft: 2 }} />
            )}
            <Text style={[styles.threadTime, { color: colors.textTertiary }]}> · {commentTime}</Text>
          </View>
          <Text style={[styles.replyingTo, { color: colors.textTertiary }]}>
            Đang trả lời <Text style={[styles.replyingToName, { color: colors.primary }]}>@{post.author.fullName}</Text>
          </Text>
          <Text style={[styles.threadReplyText, { color: colors.textPrimary }]}>{comment.content}</Text>

          {/* Actions */}
          <View style={styles.threadActions}>
            <View style={styles.threadAction}>
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.isLiked ? colors.like : colors.textTertiary}
              />
              {(comment.likesCount || 0) > 0 && (
                <Text style={[styles.threadActionText, { color: colors.textTertiary }, comment.isLiked && { color: colors.like }]}>
                  {comment.likesCount}
                </Text>
              )}
            </View>
            <View style={styles.threadAction}>
              <Ionicons name="chatbubble-outline" size={15} color={colors.textTertiary} />
            </View>
            <View style={styles.threadAction}>
              <Ionicons name="arrow-redo-outline" size={16} color={colors.textTertiary} />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// Shared Comment Card - displays a reposted comment
const SharedCommentCard: React.FC<{
  comment: Comment & { post?: Post };
  onPress: () => void;
  colors: any;
}> = React.memo(({ comment, onPress, colors }) => {
  const commentTime = formatTimeAgo(comment.createdAt);

  return (
    <TouchableOpacity style={[styles.replyCard, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={0.7}>
      {/* Repost indicator */}
      <View style={styles.repostIndicator}>
        <Ionicons name="repeat" size={14} color={colors.textTertiary} />
        <Text style={[styles.repostText, { color: colors.textTertiary }]}>Đã đăng lại</Text>
      </View>

      {/* Comment content */}
      <View style={styles.threadBottom}>
        <Image
          source={{ uri: comment.author.avatar || DEFAULT_AVATAR }}
          style={[styles.threadAvatarMain, { backgroundColor: colors.gray200 }]}
        />
        <View style={styles.threadReplyContent}>
          <View style={styles.threadHeader}>
            <Text style={[styles.threadReplyAuthor, { color: colors.textPrimary }]}>{comment.author.fullName}</Text>
            {comment.author.isVerified && (
              <Ionicons name="checkmark-circle" size={12} color={colors.verified} style={{ marginLeft: 2 }} />
            )}
            <Text style={[styles.threadTime, { color: colors.textTertiary }]}> · {commentTime}</Text>
          </View>
          <Text style={[styles.threadReplyText, { color: colors.textPrimary }]}>{comment.content}</Text>

          {/* Actions */}
          <View style={styles.threadActions}>
            <View style={styles.threadAction}>
              <Ionicons
                name={comment.isLiked ? 'heart' : 'heart-outline'}
                size={16}
                color={comment.isLiked ? colors.like : colors.textTertiary}
              />
              {(comment.likesCount || 0) > 0 && (
                <Text style={[styles.threadActionText, { color: colors.textTertiary }, comment.isLiked && { color: colors.like }]}>
                  {comment.likesCount}
                </Text>
              )}
            </View>
            <View style={styles.threadAction}>
              <Ionicons name="chatbubble-outline" size={15} color={colors.textTertiary} />
              {(comment.repliesCount || 0) > 0 && (
                <Text style={[styles.threadActionText, { color: colors.textTertiary }]}>{comment.repliesCount}</Text>
              )}
            </View>
            <View style={styles.threadAction}>
              <Ionicons name="repeat" size={16} color={colors.repost} />
              {(comment.sharesCount || 0) > 0 && (
                <Text style={[styles.threadActionText, { color: colors.repost }]}>{comment.sharesCount}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { user: currentUser, logout, updateUser } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'reposts'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [sharedPosts, setSharedPosts] = useState<Post[]>([]);
  const [sharedComments, setSharedComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<{ comment: Comment; post: Post }[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleShare, handleToggleRepost, handleToggleLike } = usePostActions();
  const needsRefresh = useRef(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<BottomMenuItem[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

  // Music picker state
  const [musicPickerVisible, setMusicPickerVisible] = useState(false);
  const [savingMusic, setSavingMusic] = useState(false);
  const [playingSong, setPlayingSong] = useState<SongItem | null>(null);

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
        postService.getUserReplies(userId, { page: 1, limit: 20 }),
        postService.getSharedComments(userId, { page: 1, limit: 20 }),
      ]);
      setPosts(results[0].status === 'fulfilled' ? results[0].value?.data || [] : []);
      setSharedPosts(results[1].status === 'fulfilled' ? results[1].value?.data || [] : []);
      setReplies(results[2].status === 'fulfilled' ? results[2].value?.data || [] : []);
      setSharedComments(results[3].status === 'fulfilled' ? results[3].value?.data || [] : []);
    } catch {
      setPosts([]);
      setSharedPosts([]);
      setReplies([]);
      setSharedComments([]);
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
      setSharedPosts(prev => prev.map(p => {
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

  // Music handlers
  const handleSelectMusic = useCallback(async (song: SelectedSong) => {
    if (savingMusic) return;
    setSavingMusic(true);
    const musicString = `${song.title} - ${song.artist}`;
    // Update UI immediately
    updateUser({ favoriteMusic: musicString });
    try {
      await userService.updateProfile({ favoriteMusic: musicString });
    } catch (error) {
      console.error('Failed to save music:', error);
      // Revert on error
      updateUser({ favoriteMusic: user?.favoriteMusic });
    } finally {
      setSavingMusic(false);
    }
  }, [savingMusic, updateUser, user?.favoriteMusic]);

  const handleRemoveMusic = useCallback(async () => {
    if (savingMusic) return;
    setSavingMusic(true);
    const oldMusic = user?.favoriteMusic;
    // Update UI immediately
    updateUser({ favoriteMusic: undefined });
    try {
      await userService.updateProfile({ favoriteMusic: null });
    } catch (error) {
      console.error('Failed to remove music:', error);
      // Revert on error
      updateUser({ favoriteMusic: oldMusic });
    } finally {
      setSavingMusic(false);
    }
  }, [savingMusic, updateUser, user?.favoriteMusic]);

  const handleToggleMusic = useCallback(() => {
    if (playingSong) {
      // Stop playing
      setPlayingSong(null);
      return;
    }
    if (!user?.favoriteMusic) return;
    const [title] = user.favoriteMusic.split(' - ');
    // Find song in songs.json
    const song = allSongs.find(s =>
      s.title.toLowerCase().includes(title.toLowerCase()) ||
      title.toLowerCase().includes(s.title.toLowerCase())
    );
    if (song) {
      setPlayingSong(song);
    }
  }, [user?.favoriteMusic, playingSong]);

  // Generate SoundCloud embed HTML
  const getPlayerHtml = useCallback((embedUrl: string) => {
    const baseUrl = embedUrl.split('&')[0];
    const fullUrl = `${baseUrl}&color=%23ff5500&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`;
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; }
            html, body { width: 100%; height: 100%; background: #1a1a1a; }
            iframe { width: 100%; height: 166px; border: none; }
          </style>
        </head>
        <body>
          <iframe scrolling="no" frameborder="no" allow="autoplay" src="${fullUrl}"></iframe>
        </body>
      </html>
    `;
  }, []);

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
      onShare={() => handleSharePost(post)}
      onProfile={() => handleProfile(post.author.id)}
      onMore={() => handleMore(post.id)}
      onVote={(optionId) => handleVote(post.id, optionId)}
      colors={colors}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="menu-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* Row: Name left, Avatar right */}
          <View style={styles.profileRow}>
            <View style={styles.profileLeft}>
              <Text style={[styles.fullName, { color: colors.textPrimary }]}>{user?.fullName || 'User'}</Text>
              <View style={styles.usernameRow}>
                <Text style={[styles.usernameText, { color: colors.textPrimary }]}>{user?.studentId || 'username'}</Text>
                <View style={[styles.threadsBadge, { backgroundColor: colors.gray200 }]}>
                  <Text style={[styles.threadsBadgeText, { color: colors.textSecondary }]}>ptit.social</Text>
                </View>
              </View>
            </View>
            <Image
              source={{ uri: user?.avatar || DEFAULT_AVATAR }}
              style={[styles.avatar, { backgroundColor: colors.gray200 }]}
            />
          </View>

          {/* Bio */}
          {user?.bio && (
            <Text style={[styles.bio, { color: colors.textPrimary }]}>{user.bio}</Text>
          )}

          {/* Music */}
          {user?.favoriteMusic ? (
            <View style={styles.musicRow}>
              <TouchableOpacity onPress={handleToggleMusic} activeOpacity={0.7}>
                <Ionicons name={playingSong ? "pause-circle" : "play-circle"} size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.musicText, { color: colors.textSecondary }]} numberOfLines={1}>
                {user.favoriteMusic}
              </Text>
              {isOwnProfile && (
                <TouchableOpacity onPress={() => setMusicPickerVisible(true)} activeOpacity={0.7}>
                  <Ionicons name="pencil" size={14} color={colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          ) : isOwnProfile ? (
            <TouchableOpacity style={styles.musicRow} onPress={() => setMusicPickerVisible(true)} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={[styles.musicText, { color: colors.primary }]}>Thêm nhạc yêu thích</Text>
            </TouchableOpacity>
          ) : null}

          {/* Followers */}
          <TouchableOpacity
            style={styles.followersRow}
            onPress={() => navigation.navigate('Followers', { userId, tab: 'followers' })}
          >
            <Text style={[styles.followersText, { color: colors.textTertiary }]}>
              {user?.followersCount || 0} người theo dõi
            </Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isOwnProfile ? (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.gray300 }]}
                  onPress={() => navigation.navigate('EditProfile')}
                >
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Chỉnh sửa trang cá nhân</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { borderColor: colors.gray300 }]}
                  onPress={() => Share.share({ message: `Xem trang cá nhân của ${user?.fullName} trên PTIT Social!` })}
                >
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Chia sẻ trang cá nhân</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}>
                  <Text style={[styles.actionBtnText, { color: colors.background }]}>Theo dõi</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: colors.gray300 }]}>
                  <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Đề cập</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { borderBottomColor: colors.gray200, backgroundColor: colors.background }]}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && [styles.activeTab, { borderBottomColor: colors.primary }]]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab.key && { color: colors.primary, fontWeight: FontWeight.bold }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Posts */}
        <View style={styles.postsSection}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : activeTab === 'posts' ? (
            posts.length > 0 ? (
              posts.map(renderPostCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color={colors.gray200} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Chua co bai viet nao</Text>
              </View>
            )
          ) : activeTab === 'reposts' ? (
            sharedPosts.length > 0 || sharedComments.length > 0 ? (
              <>
                {sharedPosts.map(renderPostCard)}
                {sharedComments.map((comment) => (
                  <SharedCommentCard
                    key={`comment-${comment.id}`}
                    comment={comment}
                    onPress={() => navigation.navigate('PostDetail', { postId: comment.postId })}
                    colors={colors}
                  />
                ))}
              </>
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

      {/* Music Picker */}
      <MusicPicker
        visible={musicPickerVisible}
        onClose={() => setMusicPickerVisible(false)}
        onSelect={handleSelectMusic}
        currentSong={user?.favoriteMusic}
      />

      {/* Hidden WebView for audio playback */}
      {playingSong && (
        <View style={styles.hiddenWebview}>
          <WebView
            source={{ html: getPlayerHtml(playingSong.embed_url) }}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      )}

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
    </View>
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
    paddingVertical: Spacing.sm,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  headerIcon: {
    padding: Spacing.xs,
  },
  profileSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  fullName: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: Spacing.sm,
  },
  usernameText: {
    fontSize: FontSize.md,
  },
  threadsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  threadsBadgeText: {
    fontSize: 11,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  bio: {
    fontSize: 15,
    marginTop: Spacing.md,
    lineHeight: 21,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  musicText: {
    fontSize: 14,
  },
  followersRow: {
    marginTop: Spacing.md,
  },
  followersText: {
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 14,
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
  // PostCard styles (same as HomeScreen)
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
  postUsernameRow: {
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
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  interactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  interactionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  interactionCount: {
    fontSize: FontSize.sm,
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
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  // ReplyCard thread styles
  replyCard: {
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.sm,
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
  replyingToName: {
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
  repostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  repostText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  // Hidden WebView for audio
  hiddenWebview: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export default ProfileScreen;
