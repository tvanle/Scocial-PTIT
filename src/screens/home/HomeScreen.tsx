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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Layout, Shadow } from '../../constants/theme';
import { useAuthStore } from '../../store/slices/authSlice';
import { Post, Media, RootStackParamList } from '../../types';
import { postService } from '../../services/post/postService';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatTimeAgo } from '../../utils/dateUtils';
import { EmptyState, BottomMenu } from '../../components/common';
import type { BottomMenuItem } from '../../components/common';
import { DEFAULT_AVATAR } from '../../constants/strings';
import { usePostActions } from '../../hooks/usePostActions';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONTENT_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

// Image layout component
const PostImages: React.FC<{ media: Media[] }> = React.memo(({ media }) => {
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
}> = React.memo(({ post, onLike, onComment, onRepost, onShare, onProfile, onMore }) => {
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <View style={styles.postCard}>
      {/* User Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={onProfile} style={styles.postHeaderLeft}>
          <Image
            source={{ uri: post.author.avatar || DEFAULT_AVATAR }}
            style={styles.postAvatar}
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

      {/* Content - tappable to navigate */}
      <TouchableOpacity onPress={onComment} activeOpacity={0.7}>
        <Text style={styles.postContent}>{post.content}</Text>

        {/* Media */}
        {post.media && post.media.length > 0 && (
          <PostImages media={post.media} />
        )}

        {/* Stats Text Line */}
        {(post.likesCount > 0 || post.commentsCount > 0) && (
          <Text style={styles.statsText}>
            {post.likesCount > 0 ? `${post.likesCount} Likes` : ''}
            {post.likesCount > 0 && post.commentsCount > 0 ? ' . ' : ''}
            {post.commentsCount > 0 ? `${post.commentsCount} Comments` : ''}
          </Text>
        )}
      </TouchableOpacity>

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
            <Ionicons name="chatbox-outline" size={20} color={Colors.textSecondary} />
            {post.commentsCount > 0 && (
              <Text style={styles.interactionCount}>{post.commentsCount}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onRepost} style={styles.interactionButton}>
            <Ionicons
              name="repeat-outline"
              size={22}
              color={post.isShared ? Colors.repost : Colors.textSecondary}
            />
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
});

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
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

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

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
      onShare={() => handleShare(item.author.fullName)}
      onProfile={() => handleProfile(item.author.id)}
      onMore={() => handleMore(item.id)}
    />
  ), [handleLike, handleComment, handleRepostToggle, handleShare, handleProfile, handleMore]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerIconButton}
        onPress={() => (navigation as any).navigate('Notifications')}
      >
        <Ionicons name="notifications-outline" size={24} color={Colors.gray400} />
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
        <Ionicons name="search-outline" size={24} color={Colors.gray400} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        {renderHeader()}
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
            tintColor={Colors.primary}
            colors={[Colors.primary]}
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
  postAvatar: {
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
  statsText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
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
