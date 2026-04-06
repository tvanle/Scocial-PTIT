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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Comment, RootStackParamList } from '../../types';
import { postService } from '../../services/post/postService';
import { formatTimeAgo } from '../../utils/dateUtils';
import { ScreenHeader, BottomMenu } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';

type PostDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation<PostDetailNavigationProp>();
  const route = useRoute<PostDetailRouteProp>();
  const { postId } = route.params;
  const { user } = useAuthStore();
  const inputRef = useRef<TextInput>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const { handleShare, handleToggleRepost, handleToggleLike } = usePostActions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItems, setMenuItems] = useState<BottomMenuItem[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

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

  const handleCommentLike = (_commentId: string) => {
    // Comment likes not implemented in API yet
  };

  const handleSendComment = useCallback(async () => {
    if (!commentText.trim() || !post) return;

    try {
      const newComment = await postService.addComment(postId, {
        content: commentText.trim(),
      });
      setComments([...comments, newComment]);
      setCommentText('');
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
    } catch {
      // silently fail
    }
  }, [commentText, post, postId, comments]);

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Thread" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <ScreenHeader title="Thread" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Post */}
          <View style={styles.postContainer}>
            <View style={styles.postHeader}>
              <TouchableOpacity
                style={styles.authorRow}
                onPress={() => navigation.navigate('UserProfile', { userId: post.author.id })}
              >
                <Image
                  source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
                  style={styles.avatar}
                />
                <View>
                  <View style={styles.nameRow}>
                    <Text style={styles.authorName}>{post.author.fullName}</Text>
                    {post.author.isVerified && (
                      <Ionicons name="checkmark-circle" size={14} color={Colors.verified} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMore} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={{ padding: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.media && post.media.length > 0 && (
              <Image source={{ uri: post.media[0].url }} style={styles.postImage} resizeMode="cover" />
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>
                {post.likesCount} Likes . {post.commentsCount} Comments
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Ionicons
                  name={post.isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={post.isLiked ? Colors.like : Colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => inputRef.current?.focus()} style={styles.actionButton}>
                <Ionicons name="chatbox-outline" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleRepost}>
                <Ionicons
                  name="repeat-outline"
                  size={24}
                  color={post.isShared ? Colors.repost : Colors.textPrimary}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(post.author.fullName)}>
                <Ionicons name="paper-plane-outline" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentsSection}>
            {comments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                <Image
                  source={{ uri: comment.author.avatar || DEFAULT_AVATAR }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.author.fullName}</Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity onPress={() => handleCommentLike(comment.id)} style={styles.commentActionBtn}>
                      <Ionicons
                        name={comment.isLiked ? 'heart' : 'heart-outline'}
                        size={16}
                        color={comment.isLiked ? Colors.like : Colors.gray400}
                      />
                      {comment.likesCount > 0 && (
                        <Text style={[styles.commentActionCount, comment.isLiked && { color: Colors.like }]}>
                          {comment.likesCount}
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.commentActionBtn}>
                      <Text style={styles.replyText}>Trả lời</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.commentActionBtn}>
                      <Ionicons name="repeat-outline" size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.commentActionBtn}>
                      <Ionicons name="paper-plane-outline" size={16} color={Colors.gray400} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputContainer}>
          <Image
            source={{ uri: user?.avatar || DEFAULT_AVATAR }}
            style={styles.inputAvatar}
          />
          <View style={styles.textInputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={`Viết đến ${post.author.fullName}...`}
              placeholderTextColor={Colors.gray400}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
          </View>
          {commentText.trim().length > 0 && (
            <TouchableOpacity onPress={handleSendComment} style={styles.sendButton}>
              <Ionicons name="send" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    height: Layout.headerHeight,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  postContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
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
  avatar: {
    width: Layout.avatarSize.md,
    height: Layout.avatarSize.md,
    borderRadius: Layout.avatarSize.md / 2,
    backgroundColor: Colors.gray200,
    marginRight: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  timeText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  postContent: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginTop: Spacing.md,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.gray100,
  },
  statsRow: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  statsText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    gap: Spacing.xl,
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
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gray200,
    marginRight: Spacing.sm,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  commentText: {
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
    marginTop: Spacing.xxs,
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
  commentActionCount: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
  commentTime: {
    fontSize: FontSize.xs,
    color: Colors.gray400,
  },
  replyText: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
    fontWeight: FontWeight.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray200,
    marginRight: Spacing.sm,
  },
  textInputWrapper: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    maxHeight: 80,
  },
  textInput: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    maxHeight: 60,
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
});

export default PostDetailScreen;
