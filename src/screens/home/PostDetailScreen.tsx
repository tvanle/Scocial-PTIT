import React, { useState, useRef } from 'react';
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Comment, RootStackParamList } from '../../types';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

// Mock data
const mockPost: Post = {
  id: '1',
  author: {
    id: '2',
    fullName: 'Tran Van B',
    avatar: 'https://i.pravatar.cc/150?img=2',
    studentId: 'B21DCCN002',
    isOnline: true,
    isVerified: true,
    createdAt: '',
    updatedAt: '',
    email: '',
  },
  content: 'Hom nay la ngay tuyet voi de hoc tap va chia se kien thuc voi moi nguoi! Cung nhau co gang nhe cac ban.',
  media: [],
  privacy: 'public',
  likesCount: 128,
  commentsCount: 24,
  sharesCount: 5,
  isLiked: false,
  isSaved: false,
  isShared: false,
  createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockComments: Comment[] = [
  {
    id: '1',
    postId: '1',
    author: { id: '3', fullName: 'Le Thi C', avatar: 'https://i.pravatar.cc/150?img=3', email: '', createdAt: '', updatedAt: '' },
    content: 'Bai viet rat hay! Cam on ban da chia se.',
    repliesCount: 1,
    likesCount: 5,
    isLiked: false,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: '',
  },
  {
    id: '2',
    postId: '1',
    author: { id: '4', fullName: 'Nguyen Van D', avatar: 'https://i.pravatar.cc/150?img=4', email: '', createdAt: '', updatedAt: '' },
    content: 'Dong y! Moi ngay deu la co hoi moi.',
    repliesCount: 0,
    likesCount: 2,
    isLiked: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: '',
  },
];

const getTimeAgo = (dateString: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Vua xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}p`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const PostDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PostDetailRouteProp>();
  const { user } = useAuthStore();
  const inputRef = useRef<TextInput>(null);

  const [post, setPost] = useState(mockPost);
  const [comments, setComments] = useState(mockComments);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
  };

  const handleCommentLike = (commentId: string) => {
    setComments(comments.map(c =>
      c.id === commentId
        ? { ...c, isLiked: !c.isLiked, likesCount: c.isLiked ? c.likesCount - 1 : c.likesCount + 1 }
        : c
    ));
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      postId: post.id,
      author: {
        id: user?.id || '1',
        fullName: user?.fullName || 'Me',
        avatar: user?.avatar,
        email: '',
        createdAt: '',
        updatedAt: '',
      },
      content: commentText.trim(),
      repliesCount: 0,
      likesCount: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      updatedAt: '',
    };

    setComments([...comments, newComment]);
    setCommentText('');
  };

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
                onPress={() => navigation.navigate('UserProfile' as never, { userId: post.author.id } as never)}
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
              <Text style={styles.statsText}>{likesCount} luot thich</Text>
              <Text style={styles.statsText}>{comments.length} binh luan</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                <Ionicons
                  name={isLiked ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isLiked ? Colors.like : Colors.textPrimary}
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
});

export default PostDetailScreen;
