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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Media, RootStackParamList } from '../../types';
import { postService } from '../../services/post/postService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

// Image layout component
const PostImages: React.FC<{ media: Media[] }> = ({ media }) => {
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

  // 3+ images: vertical split layout (1 large left, 2 stacked right)
  return (
    <View style={imgStyles.tripleContainer}>
      <Image source={{ uri: media[0].url }} style={imgStyles.tripleLeft} resizeMode="cover" />
      <View style={imgStyles.tripleRight}>
        <Image source={{ uri: media[1].url }} style={imgStyles.tripleRightImage} resizeMode="cover" />
        <Image source={{ uri: media[2]?.url || media[1].url }} style={imgStyles.tripleRightImage} resizeMode="cover" />
      </View>
    </View>
  );
};

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

// Post Card Component
const PostCard: React.FC<{
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
    <View style={styles.postCard}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={onProfile} style={styles.postHeaderLeft}>
          <Image
            source={{ uri: post.author.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
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

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Media */}
      {post.media && post.media.length > 0 && (
        <PostImages media={post.media} />
      )}

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
            <Ionicons name="chatbubble-outline" size={20} color={Colors.textSecondary} />
            {post.commentsCount > 0 && (
              <Text style={styles.interactionCount}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRepost} style={styles.interactionButton}>
            <Ionicons name="repeat-outline" size={22} color={Colors.textSecondary} />
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
};

// Helper function
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Vừa xong';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày`;
  return date.toLocaleDateString('vi-VN');
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, accessToken } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await postService.getFeed({ page: 1, limit: 20 });
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, []);

  const handleLike = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

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
      setPosts(posts.map(p =>
        p.id === postId
          ? { ...p, isLiked: !p.isLiked, likesCount: p.isLiked ? p.likesCount + 1 : p.likesCount - 1 }
          : p
      ));
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onLike={() => handleLike(item.id)}
      onComment={() => navigation.navigate('PostDetail', { postId: item.id })}
      onRepost={() => Alert.alert('Đăng lại', 'Bạn muốn đăng lại bài viết này?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng lại', onPress: () => {} },
      ])}
      onShare={() => Share.share({ message: `Xem bài viết của ${item.author.fullName} trên PTIT Social!` })}
      onProfile={() => navigation.navigate('UserProfile', { userId: item.author.id })}
      onMore={() => Alert.alert('Tùy chọn', '', [
        { text: 'Lưu bài viết', onPress: () => {} },
        { text: 'Ẩn bài viết', onPress: () => setPosts(posts.filter(p => p.id !== item.id)) },
        { text: 'Báo cáo', style: 'destructive', onPress: () => {} },
        { text: 'Hủy', style: 'cancel' },
      ])}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </View>
          <Text style={styles.headerTitle}>PTIT Social</Text>
          <View style={styles.headerRight}>
            <Ionicons name="search-outline" size={24} color={Colors.textPrimary} />
          </View>
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
        <TouchableOpacity style={styles.headerLeft}>
          <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PTIT Social</Text>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={() => navigation.navigate('Messages')}
        >
          <Ionicons name="chatbubbles-outline" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
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
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.feedContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={64} color={Colors.gray300} />
            <Text style={styles.emptyTitle}>Chưa có bài viết nào</Text>
            <Text style={styles.emptyText}>Hãy theo dõi bạn bè để xem bài viết</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: Layout.headerHeight,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extraBold,
    color: Colors.primary,
  },
  headerRight: {
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
  avatar: {
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
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});

export default HomeScreen;
