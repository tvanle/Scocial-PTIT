import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Comment, Poll, RootStackParamList } from '../../types';
import { postService } from '../../services/post/postService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { ScreenHeader, BottomMenu, SharePostModal, ConfirmDialog } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';
import { useTheme } from '../../hooks/useThemeColors';

type PostDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<PostDetailNavigationProp>();
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;
  const { user } = useAuthStore();
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const { handleShare, handleToggleRepost, handleToggleLike } = usePostActions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<BottomMenuItem[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [commentReplies, setCommentReplies] = useState<Record<string, Comment[]>>({});

  // Share modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imageScrollRef = useRef<ScrollView>(null);

  const handleImageScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  const fetchData = async () => {
    try {
      const [postData, commentsData] = await Promise.all([
        postService.getPost(postId),
        postService.getComments(postId, { page: 1, limit: 50 }),
      ]);
      setPost(postData);
      setComments(commentsData.data);
    } catch {
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [postId]);

  const handleLike = useCallback(async () => {
    if (!post) return;

    const wasLiked = post.isLiked;
    setPost({
      ...post,
      isLiked: !wasLiked,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
    });

    const success = await handleToggleLike(postId, wasLiked);
    if (!success) {
      setPost({
        ...post,
        isLiked: wasLiked,
        likesCount: wasLiked ? post.likesCount + 1 : post.likesCount - 1,
      });
    }
  }, [post, postId, handleToggleLike]);

  const handleRepost = useCallback(async () => {
    if (!post) return;

    const wasShared = post.isShared;
    setPost({
      ...post,
      isShared: !wasShared,
      sharesCount: wasShared ? post.sharesCount - 1 : post.sharesCount + 1,
    });

    const success = await handleToggleRepost(postId, wasShared);
    if (!success) {
      setPost({
        ...post,
        isShared: wasShared,
        sharesCount: wasShared ? post.sharesCount + 1 : post.sharesCount - 1,
      });
    }
  }, [post, postId, handleToggleRepost]);

  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);

  const handleVote = useCallback(async (optionId: string) => {
    if (!post || votedOptionId) return;
    setVotedOptionId(optionId);
    try {
      await postService.votePoll(postId, optionId);
      // Update poll vote counts
      if (post.poll) {
        setPost({
          ...post,
          poll: {
            ...post.poll,
            options: post.poll.options.map(opt => ({
              ...opt,
              _count: {
                votes: opt.id === optionId ? (opt._count?.votes || 0) + 1 : (opt._count?.votes || 0),
              },
            })),
          },
        });
      }
    } catch {
      setVotedOptionId(null);
    }
  }, [post, postId, votedOptionId]);

  const handleMore = useCallback(() => {
    if (!post) return;
    const isOwnPost = post.author.id === user?.id;

    const items: BottomMenuItem[] = [];

    if (isOwnPost) {
      items.push({
        label: 'Xóa bài viết',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => {
          setDeleteConfirmVisible(true);
        },
      });
    } else {
      items.push({
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
      });
    }

    setMenuItems(items);
    setMenuVisible(true);
  }, [post, user, postId]);

  const handleConfirmDelete = useCallback(async () => {
    try {
      await postService.deletePost(postId);
      navigation.goBack();
    } catch {
      // silently fail
    }
    setDeleteConfirmVisible(false);
  }, [postId, navigation]);

  const handleCommentLike = useCallback(async (commentId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await postService.unlikeComment(commentId);
      } else {
        await postService.likeComment(commentId);
      }
      // Update comment state
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, isLiked: !isLiked, likesCount: isLiked ? c.likesCount - 1 : c.likesCount + 1 }
          : c
      ));
      // Also update in replies
      setCommentReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(c =>
            c.id === commentId
              ? { ...c, isLiked: !isLiked, likesCount: isLiked ? c.likesCount - 1 : c.likesCount + 1 }
              : c
          );
        });
        return updated;
      });
    } catch {
      // silently fail
    }
  }, []);

  const handleReplyToComment = useCallback((comment: Comment) => {
    setReplyingTo(comment);
    inputRef.current?.focus();
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
    setCommentText('');
  }, []);

  const handleLoadReplies = useCallback(async (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      // Collapse replies
      setExpandedReplies(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
      return;
    }

    try {
      const response = await postService.getCommentReplies(commentId, { page: 1, limit: 20 });
      setCommentReplies(prev => ({ ...prev, [commentId]: response.data }));
      setExpandedReplies(prev => new Set(prev).add(commentId));
    } catch {
      // silently fail
    }
  }, [expandedReplies]);

  const handleRepostComment = useCallback(async (comment: Comment) => {
    // Repost/share the comment
    const wasShared = comment.isShared;

    // Optimistic update
    setComments(prev => prev.map(c =>
      c.id === comment.id
        ? { ...c, isShared: !wasShared, sharesCount: wasShared ? c.sharesCount - 1 : c.sharesCount + 1 }
        : c
    ));
    setCommentReplies(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key] = updated[key].map(c =>
          c.id === comment.id
            ? { ...c, isShared: !wasShared, sharesCount: wasShared ? c.sharesCount - 1 : c.sharesCount + 1 }
            : c
        );
      });
      return updated;
    });

    try {
      if (wasShared) {
        await postService.unshareComment(comment.id);
      } else {
        await postService.shareComment(comment.id);
      }
    } catch {
      // Revert on error
      setComments(prev => prev.map(c =>
        c.id === comment.id
          ? { ...c, isShared: wasShared, sharesCount: wasShared ? c.sharesCount + 1 : c.sharesCount - 1 }
          : c
      ));
      setCommentReplies(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          updated[key] = updated[key].map(c =>
            c.id === comment.id
              ? { ...c, isShared: wasShared, sharesCount: wasShared ? c.sharesCount + 1 : c.sharesCount - 1 }
              : c
          );
        });
        return updated;
      });
    }
  }, []);

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim() || !post) return;

    try {
      const newComment = await postService.addComment(postId, {
        content: commentText.trim(),
        parentId: replyingTo?.id,
      });

      if (replyingTo) {
        // Add to replies of parent comment
        setCommentReplies(prev => ({
          ...prev,
          [replyingTo.id]: [...(prev[replyingTo.id] || []), newComment],
        }));
        // Update repliesCount
        setComments(prev => prev.map(c =>
          c.id === replyingTo.id
            ? { ...c, repliesCount: c.repliesCount + 1 }
            : c
        ));
        // Expand replies if not already
        setExpandedReplies(prev => new Set(prev).add(replyingTo.id));
        setReplyingTo(null);
      } else {
        setComments([...comments, newComment]);
      }
      setCommentText('');
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
    } catch {
      // silently fail
    }
  }, [commentText, post, postId, comments, replyingTo]);

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.cardBackground,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: Spacing.lg,
      height: Layout.headerHeight,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
    },
    postContainer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: Layout.avatarSize.md,
      height: Layout.avatarSize.md,
      borderRadius: Layout.avatarSize.md / 2,
      backgroundColor: colors.gray200,
      marginRight: Spacing.md,
    },
    authorName: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.semiBold,
      color: colors.textPrimary,
    },
    timeText: {
      fontSize: FontSize.sm,
      color: colors.gray500,
      marginTop: 2,
    },
    postContent: {
      fontSize: FontSize.lg,
      color: colors.textPrimary,
      lineHeight: 24,
      marginTop: Spacing.md,
    },
    postImage: {
      width: '100%' as const,
      height: 300,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
      backgroundColor: colors.gray100,
    },
    statsRow: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
    },
    statsText: {
      fontSize: FontSize.sm,
      color: colors.gray500,
    },
    actionsRow: {
      flexDirection: 'row' as const,
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      gap: Spacing.xl,
    },
    commentAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.gray200,
      marginRight: Spacing.sm,
    },
    commentAuthor: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.bold,
      color: colors.textPrimary,
    },
    commentText: {
      fontSize: FontSize.sm,
      color: colors.textPrimary,
      lineHeight: 20,
      marginTop: Spacing.xxs,
    },
    commentActionCount: {
      fontSize: FontSize.xs,
      color: colors.gray400,
    },
    commentTime: {
      fontSize: FontSize.xs,
      color: colors.gray400,
    },
    replyText: {
      fontSize: FontSize.xs,
      color: colors.gray500,
      fontWeight: FontWeight.medium,
    },
    inputContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderTopWidth: 0.5,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.gray200,
      marginRight: Spacing.sm,
    },
    textInputWrapper: {
      flex: 1,
      backgroundColor: colors.gray100,
      borderRadius: BorderRadius.round,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      maxHeight: 80,
    },
    textInput: {
      fontSize: FontSize.md,
      color: colors.textPrimary,
      maxHeight: 60,
    },
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={dynamicStyles.container} edges={['top']}>
        <ScreenHeader title="Thread" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={dynamicStyles.container} edges={['top']}>
      {/* Header */}
      <ScreenHeader title="Thread" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post */}
          <View style={dynamicStyles.postContainer}>
            <View style={styles.postHeader}>
              <TouchableOpacity
                style={styles.authorRow}
                onPress={() => navigation.navigate('UserProfile', { userId: post.author.id })}
              >
                <Image
                  source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
                  style={dynamicStyles.avatar}
                />
                <View>
                  <View style={styles.nameRow}>
                    <Text style={dynamicStyles.authorName}>{post.author.fullName}</Text>
                    {post.author.isVerified && (
                      <Ionicons name="checkmark-circle" size={14} color={colors.verified} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={dynamicStyles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMore} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={dynamicStyles.postContent}>{post.content}</Text>

            {post.media && post.media.length > 0 && (
              <View>
                {post.media.length === 1 ? (
                  <Image source={{ uri: post.media[0].url }} style={dynamicStyles.postImage} resizeMode="cover" />
                ) : (
                  <View style={styles.carouselContainer}>
                    <ScrollView
                      ref={imageScrollRef}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={handleImageScroll}
                      scrollEventThrottle={16}
                      decelerationRate="fast"
                      snapToInterval={SCREEN_WIDTH}
                      snapToAlignment="start"
                    >
                      {post.media.map((media, index) => (
                        <Image
                          key={media.id || index}
                          source={{ uri: media.url }}
                          style={styles.carouselImage}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                    <View style={styles.paginationContainer}>
                      {post.media.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.paginationDot,
                            { backgroundColor: index === currentImageIndex ? colors.primary : colors.gray300 },
                          ]}
                        />
                      ))}
                    </View>
                    <View style={[styles.imageCounter, { backgroundColor: colors.overlay }]}>
                      <Text style={styles.imageCounterText}>
                        {currentImageIndex + 1}/{post.media.length}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Poll */}
            {post.poll && (
              <View style={styles.pollContainer}>
                {post.poll.options.map((option) => {
                  const totalVotes = post.poll!.options.reduce((sum, opt) => sum + (opt._count?.votes || 0), 0);
                  const votes = option._count?.votes || 0;
                  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                  const isVoted = votedOptionId === option.id;
                  const hasVoted = votedOptionId !== null;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => handleVote(option.id)}
                      disabled={hasVoted}
                      style={[
                        styles.pollOption,
                        { borderColor: isVoted ? colors.primary : colors.borderLight },
                      ]}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.pollProgressBar,
                          {
                            width: hasVoted ? `${percentage}%` : '0%',
                            backgroundColor: isVoted ? colors.primary + '30' : colors.gray200,
                          },
                        ]}
                      />
                      <View style={styles.pollOptionContent}>
                        <Text style={[styles.pollOptionText, { color: colors.textPrimary }]}>
                          {option.text}
                        </Text>
                        {hasVoted && (
                          <Text style={[styles.pollPercentage, { color: colors.textSecondary }]}>
                            {percentage}%
                          </Text>
                        )}
                      </View>
                      {isVoted && (
                        <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.pollCheckIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                <Text style={[styles.pollTotalVotes, { color: colors.textTertiary }]}>
                  {post.poll.options.reduce((sum, opt) => sum + (opt._count?.votes || 0), 0)} lượt bình chọn
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={dynamicStyles.statsRow}>
              <Text style={dynamicStyles.statsText}>
                {post.likesCount} Likes . {post.commentsCount} Comments
              </Text>
            </View>

            {/* Actions */}
            <View style={dynamicStyles.actionsRow}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={post.isLiked ? colors.like : colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => inputRef.current?.focus()} style={styles.actionButton}>
                <Ionicons name="chatbox-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleRepost}>
                <Ionicons
                  name="repeat-outline"
                  size={24}
                  color={post.isShared ? colors.repost : colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => setShareModalVisible(true)}>
                <Ionicons name="paper-plane-outline" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentsSection}>
            {comments.map(comment => (
              <View key={comment.id}>
                <View style={styles.commentItem}>
                  <Image
                    source={{ uri: comment.author.avatar || DEFAULT_AVATAR }}
                    style={dynamicStyles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                      <Text style={dynamicStyles.commentAuthor}>{comment.author.fullName}</Text>
                      <Text style={dynamicStyles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                    </View>
                    <Text style={dynamicStyles.commentText}>{comment.content}</Text>
                    <View style={styles.commentActions}>
                      <TouchableOpacity onPress={() => handleCommentLike(comment.id, comment.isLiked)} style={styles.commentActionBtn}>
                        <Ionicons
                          name={comment.isLiked ? 'heart' : 'heart-outline'}
                          size={16}
                          color={comment.isLiked ? colors.like : colors.gray400}
                        />
                        {comment.likesCount > 0 && (
                          <Text style={[dynamicStyles.commentActionCount, comment.isLiked && { color: colors.like }]}>
                            {comment.likesCount}
                          </Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleReplyToComment(comment)}>
                        <Text style={dynamicStyles.replyText}>Trả lời</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleRepostComment(comment)}>
                        <Ionicons
                          name="repeat-outline"
                          size={16}
                          color={comment.isShared ? colors.repost : colors.gray400}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentActionBtn} onPress={() => setShareModalVisible(true)}>
                        <Ionicons name="paper-plane-outline" size={16} color={colors.gray400} />
                      </TouchableOpacity>
                    </View>
                    {/* View replies button */}
                    {comment.repliesCount > 0 && (
                      <TouchableOpacity
                        style={styles.viewRepliesBtn}
                        onPress={() => handleLoadReplies(comment.id)}
                      >
                        <View style={[styles.replyLine, { backgroundColor: colors.gray300 }]} />
                        <Text style={[styles.viewRepliesText, { color: colors.gray500 }]}>
                          {expandedReplies.has(comment.id)
                            ? 'Ẩn phản hồi'
                            : `Xem ${comment.repliesCount} phản hồi`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {/* Replies */}
                {expandedReplies.has(comment.id) && commentReplies[comment.id] && (
                  <View style={styles.repliesContainer}>
                    {commentReplies[comment.id].map(reply => (
                      <View key={reply.id} style={styles.replyItem}>
                        <Image
                          source={{ uri: reply.author.avatar || DEFAULT_AVATAR }}
                          style={[dynamicStyles.commentAvatar, styles.replyAvatar]}
                        />
                        <View style={styles.commentContent}>
                          <View style={styles.commentHeader}>
                            <Text style={dynamicStyles.commentAuthor}>{reply.author.fullName}</Text>
                            <Text style={dynamicStyles.commentTime}>{formatTimeAgo(reply.createdAt)}</Text>
                          </View>
                          <Text style={dynamicStyles.commentText}>{reply.content}</Text>
                          <View style={styles.commentActions}>
                            <TouchableOpacity onPress={() => handleCommentLike(reply.id, reply.isLiked)} style={styles.commentActionBtn}>
                              <Ionicons
                                name={reply.isLiked ? 'heart' : 'heart-outline'}
                                size={14}
                                color={reply.isLiked ? colors.like : colors.gray400}
                              />
                              {reply.likesCount > 0 && (
                                <Text style={[dynamicStyles.commentActionCount, reply.isLiked && { color: colors.like }]}>
                                  {reply.likesCount}
                                </Text>
                              )}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.commentActionBtn} onPress={() => handleReplyToComment(comment)}>
                              <Text style={dynamicStyles.replyText}>Trả lời</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Comment Input */}
        <View>
          {replyingTo && (
            <View style={[styles.replyIndicator, { backgroundColor: colors.gray100, borderTopColor: colors.border }]}>
              <Text style={[styles.replyIndicatorText, { color: colors.gray500 }]}>
                Đang trả lời <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{replyingTo.author.fullName}</Text>
              </Text>
              <TouchableOpacity onPress={handleCancelReply} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={18} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          )}
          <View style={dynamicStyles.inputContainer}>
            <Image
              source={{ uri: user?.avatar || DEFAULT_AVATAR }}
              style={dynamicStyles.inputAvatar}
            />
            <View style={dynamicStyles.textInputWrapper}>
              <TextInput
                ref={inputRef}
                style={dynamicStyles.textInput}
                placeholder={replyingTo ? `Trả lời ${replyingTo.author.fullName}...` : `Viết đến ${post.author.fullName}...`}
                placeholderTextColor={colors.gray400}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
            </View>
            {commentText.trim().length > 0 && (
              <TouchableOpacity onPress={handleSendComment} style={styles.sendButton}>
                <Ionicons name="send" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

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
      {post && (
        <SharePostModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          postId={post.id}
          postAuthorName={post.author.fullName}
          postContent={post.content}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: Spacing.xs,
  },
  commentsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  commentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sendButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewRepliesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  replyLine: {
    width: 24,
    height: 1,
  },
  viewRepliesText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  repliesContainer: {
    marginLeft: 48,
    paddingLeft: Spacing.md,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderTopWidth: 0.5,
  },
  replyIndicatorText: {
    fontSize: FontSize.sm,
  },
  // Carousel styles
  carouselContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    alignSelf: 'center',
  },
  carouselImage: {
    width: SCREEN_WIDTH,
    height: 350,
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
  // Poll styles
  pollContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  pollOption: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  pollProgressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: BorderRadius.md,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  pollOptionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    flex: 1,
  },
  pollPercentage: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    marginLeft: Spacing.sm,
  },
  pollCheckIcon: {
    position: 'absolute',
    right: Spacing.md,
    top: '50%',
    marginTop: -9,
  },
  pollTotalVotes: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});

export default PostDetailScreen;
