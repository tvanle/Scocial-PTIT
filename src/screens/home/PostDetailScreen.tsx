import React, { useState, useRef, useEffect } from 'react';
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Comment, RootStackParamList } from '../../types';
import { postService } from '../../services/post/postService';

type PostDetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

const getTimeAgo = (dateString: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Vua xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}p`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

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

  const fetchData = async () => {
    try {
      const [postData, commentsData] = await Promise.all([
        postService.getPost(postId),
        postService.getComments(postId, { page: 1, limit: 50 }),
      ]);
      setPost(postData);
      setComments(commentsData.data);
    } catch (error) {
      console.error('Failed to fetch post data:', error);
      Alert.alert('Lỗi', 'Không thể tải bài viết. Vui lòng thử lại.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;

    // Optimistic update
    const wasLiked = post.isLiked;
    setPost({
      ...post,
      isLiked: !wasLiked,
      likesCount: wasLiked ? post.likesCount - 1 : post.likesCount + 1,
    });

    try {
      if (wasLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
      // Revert on error
      setPost({
        ...post,
        isLiked: wasLiked,
        likesCount: wasLiked ? post.likesCount + 1 : post.likesCount - 1,
      });
      Alert.alert('Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
    }
  };

  const handleCommentLike = (commentId: string) => {
    // Comment likes not implemented in API yet
    Alert.alert('Thông báo', 'Tính năng đang phát triển');
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || !post) return;

    try {
      const newComment = await postService.addComment(postId, {
        content: commentText.trim(),
      });
      setComments([...comments, newComment]);
      setCommentText('');
      setPost({ ...post, commentsCount: post.commentsCount + 1 });
    } catch (error) {
      console.error('Failed to send comment:', error);
      Alert.alert('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
    }
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thread</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={{ width: 32 }} />
      </View>

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
                  source={{ uri: post.author.avatar || 'https://i.pravatar.cc/150' }}
                  style={styles.avatar}
                />
                <View>
                  <View style={styles.nameRow}>
                    <Text style={styles.authorName}>{post.author.fullName}</Text>
                    {post.author.isVerified && (
                      <Ionicons name="checkmark-circle" size={14} color={Colors.verified} style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.timeText}>{getTimeAgo(post.createdAt)}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity>
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            {post.media && post.media.length > 0 && (
              <Image source={{ uri: post.media[0].url }} style={styles.postImage} resizeMode="cover" />
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
              <Text style={styles.statsText}>{post.likesCount} luot thich</Text>
              <Text style={styles.statsText}>{post.commentsCount} binh luan</Text>
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
                <Ionicons name="chatbubble-outline" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="repeat-outline" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="paper-plane-outline" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments */}
          <View style={styles.commentsSection}>
            {comments.map(comment => (
              <View key={comment.id} style={styles.commentItem}>
                <Image
                  source={{ uri: comment.author.avatar || 'https://i.pravatar.cc/150' }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{comment.author.fullName}</Text>
                    <Text style={styles.commentText}>{comment.content}</Text>
                  </View>
                  <View style={styles.commentActions}>
                    <Text style={styles.commentTime}>{getTimeAgo(comment.createdAt)}</Text>
                    <TouchableOpacity onPress={() => handleCommentLike(comment.id)}>
                      <Text style={[styles.commentAction, comment.isLiked && { color: Colors.like }]}>
                        Thich {comment.likesCount > 0 ? `(${comment.likesCount})` : ''}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={styles.commentAction}>Tra loi</Text>
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
            source={{ uri: user?.avatar || 'https://i.pravatar.cc/150?img=1' }}
            style={styles.inputAvatar}
          />
          <View style={styles.textInputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Viet binh luan..."
              placeholderTextColor={Colors.gray400}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
          </View>
          {commentText.trim().length > 0 && (
            <TouchableOpacity onPress={handleSendComment} style={styles.sendButton}>
              <Ionicons name="send" size={20} color={Colors.black} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
    color: Colors.black,
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
    color: Colors.black,
  },
  timeText: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginTop: 2,
  },
  postContent: {
    fontSize: FontSize.lg,
    color: Colors.black,
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
    flexDirection: 'row',
    gap: Spacing.lg,
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
  commentBubble: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  commentAuthor: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    color: Colors.black,
  },
  commentText: {
    fontSize: FontSize.md,
    color: Colors.black,
    marginTop: 2,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  commentTime: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
  },
  commentAction: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    color: Colors.gray500,
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
    color: Colors.black,
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
