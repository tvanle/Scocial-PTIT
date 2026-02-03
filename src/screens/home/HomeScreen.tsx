import React, { useState, useCallback, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, RootStackParamList } from '../../types';
import { postService } from '../../services/post/postService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const response = await postService.getFeed({ page: 1, limit: 20 });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      Alert.alert('Loi', 'Khong the tai bai viet. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic update
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
        : p
    ));

    try {
      if (post.isLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
    } catch (error) {
      console.error('Failed to like/unlike post:', error);
      // Revert on error
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount + 1 : p.likesCount - 1 }
          : p
      ));
      Alert.alert('Loi', 'Khong the thuc hien. Vui long thu lai.');
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <Text style={styles.headerLogo}>@</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chua co bai viet nao</Text>
          </View>
        }
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
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
});

export default HomeScreen;
