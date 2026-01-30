import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Image,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post } from '../../types';

// Mock posts data
const mockPosts: Post[] = [
  {
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
    content: 'Hom nay la ngay tuyet voi de hoc tap va chia se kien thuc voi moi nguoi!',
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
  },
  {
    id: '2',
    author: {
      id: '3',
      fullName: 'Le Thi C',
      avatar: 'https://i.pravatar.cc/150?img=3',
      studentId: 'B21DCCN003',
      isOnline: false,
      isVerified: false,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'Chia se kinh nghiem hoc lap trinh:\n\n1. Code moi ngay\n2. Doc docs truoc khi hoi\n3. Debug la ban',
    media: [
      { id: '1', url: 'https://picsum.photos/800/600?random=1', type: 'image' },
    ],
    privacy: 'public',
    likesCount: 256,
    commentsCount: 48,
    sharesCount: 32,
    isLiked: true,
    isSaved: false,
    isShared: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    author: {
      id: '4',
      fullName: 'Nguyen Van D',
      avatar: 'https://i.pravatar.cc/150?img=4',
      studentId: 'B21DCCN004',
      isOnline: true,
      isVerified: true,
      createdAt: '',
      updatedAt: '',
      email: '',
    },
    content: 'PTIT la noi bat dau cua nhung uoc mo',
    media: [],
    privacy: 'public',
    likesCount: 89,
    commentsCount: 12,
    sharesCount: 3,
    isLiked: false,
    isSaved: true,
    isShared: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface HomeScreenProps {
  navigation: any;
}

// Thread Post Item Component
const ThreadPost: React.FC<{
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
  onShare: () => void;
  onProfile: () => void;
  onMore: () => void;
}> = ({ post, onLike, onComment, onRepost, onShare, onProfile, onMore }) => {
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <View style={styles.postContainer}>
      {/* Left: Avatar + Thread Line */}
      <View style={styles.postLeft}>
        <TouchableOpacity onPress={onProfile}>
          <Image
            source={{ uri: post.author.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
        </TouchableOpacity>
        {/* Thread line */}
        <View style={styles.threadLine} />
      </View>

      {/* Right: Content */}
      <View style={styles.postRight}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <TouchableOpacity onPress={onProfile} style={styles.usernameRow}>
              <Text style={styles.username}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons name="checkmark-circle" size={14} color={Colors.verified} style={styles.verifiedIcon} />
              )}
            </TouchableOpacity>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
          <TouchableOpacity onPress={onMore} style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: post.media[0].url }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={onLike} style={styles.actionButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.isLiked ? Colors.like : Colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onComment} style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onRepost} style={styles.actionButton}>
            <Ionicons name="repeat-outline" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare} style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {(post.commentsCount > 0 || post.likesCount > 0) && (
          <View style={styles.statsRow}>
            {post.commentsCount > 0 && (
              <Text style={styles.statsText}>{post.commentsCount} tra loi</Text>
            )}
            {post.commentsCount > 0 && post.likesCount > 0 && (
              <Text style={styles.statsDot}> · </Text>
            )}
            {post.likesCount > 0 && (
              <Text style={styles.statsText}>{post.likesCount} luot thich</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// Helper function
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Vua xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}p`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString('vi-VN');
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleLike = (postId: string) => {
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ));
  };

  const renderPost = ({ item }: { item: Post }) => (
    <ThreadPost
      post={item}
      onLike={() => handleLike(item.id)}
      onComment={() => navigation.navigate('PostDetail', { postId: item.id })}
      onRepost={() => Alert.alert('Repost', 'Ban muon dang lai bai viet nay?', [
        { text: 'Huy', style: 'cancel' },
        { text: 'Dang lai', onPress: () => Alert.alert('Thanh cong', 'Da dang lai bai viet') },
      ])}
      onShare={() => Share.share({ message: `Xem bai viet cua ${item.author.fullName} tren PTIT Social!` })}
      onProfile={() => navigation.navigate('UserProfile', { userId: item.author.id })}
      onMore={() => Alert.alert('Tuy chon', '', [
        { text: 'Luu bai viet', onPress: () => Alert.alert('Da luu') },
        { text: 'An bai viet', onPress: () => setPosts(posts.filter(p => p.id !== item.id)) },
        { text: 'Bao cao', style: 'destructive', onPress: () => Alert.alert('Da bao cao') },
        { text: 'Huy', style: 'cancel' },
      ])}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLogo}>@</Text>
      </View>

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
            tintColor={Colors.textPrimary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.feedContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    height: Layout.headerHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerLogo: {
    fontSize: 32,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  feedContent: {
    paddingBottom: 100,
  },
  separator: {
    height: 0.5,
    backgroundColor: Colors.border,
  },
  // Post styles
  postContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  postLeft: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatar: {
    width: Layout.avatarSize.md,
    height: Layout.avatarSize.md,
    borderRadius: Layout.avatarSize.md / 2,
    backgroundColor: Colors.gray200,
  },
  threadLine: {
    flex: 1,
    width: 2,
    backgroundColor: Colors.gray200,
    marginTop: Spacing.sm,
    borderRadius: 1,
    minHeight: 20,
  },
  postRight: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  verifiedIcon: {
    marginLeft: Spacing.xxs,
  },
  timeAgo: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  moreButton: {
    padding: Spacing.xs,
  },
  postContent: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  mediaContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.gray100,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.lg,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  statsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  statsDot: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
});

export default HomeScreen;
