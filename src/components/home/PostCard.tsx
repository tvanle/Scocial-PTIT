import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card } from '../common';
import { FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';
import { Strings } from '../../constants/strings';
import { Post } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';
import { getImageUrl } from '../../utils/image';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onProfilePress?: () => void;
  onMenuPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  onLike,
  onComment,
  onShare,
  onProfilePress,
  onMenuPress,
}) => {
  const { colors } = useTheme();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showFullContent, setShowFullContent] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.();
  };

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

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentImageIndex(index);
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    const mediaCount = post.media.length;
    console.log('Post media count:', mediaCount, 'Post ID:', post.id);

    if (mediaCount === 1) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <Image
            source={{ uri: getImageUrl(post.media[0].url) }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    // Multiple images - horizontal scroll with pagination dots
    return (
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          snapToAlignment="start"
        >
          {post.media.map((media, index) => (
            <TouchableOpacity
              key={media.id}
              onPress={onPress}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: getImageUrl(media.url) }}
                style={styles.carouselImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pagination dots */}
        <View style={styles.paginationContainer}>
          {post.media.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentImageIndex ? colors.primary : colors.gray300,
                },
              ]}
            />
          ))}
        </View>

        {/* Image counter */}
        <View style={[styles.imageCounter, { backgroundColor: colors.overlay }]}>
          <Text style={[styles.imageCounterText, { color: colors.white }]}>
            {currentImageIndex + 1}/{mediaCount}
          </Text>
        </View>
      </View>
    );
  };

  const contentLength = post.content.length;
  const shouldTruncate = contentLength > 200 && !showFullContent;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onComment}>
    <Card style={styles.card} padding="none">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.userInfo} onPress={onProfilePress}>
          <Avatar
            uri={post.author.avatar}
            name={post.author.fullName}
            size="md"
            showOnlineStatus
            isOnline={post.author.isOnline}
          />
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.verified}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            <View style={styles.postMeta}>
              <Text style={[styles.timeText, { color: colors.textTertiary }]}>{formatTimeAgo(post.createdAt)}</Text>
              <Ionicons
                name={getPrivacyIcon()}
                size={12}
                color={colors.textTertiary}
                style={styles.privacyIcon}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content && (
        <View style={styles.contentContainer}>
          <Text style={[styles.content, { color: colors.textPrimary }]}>
            {shouldTruncate ? post.content.slice(0, 200) + '...' : post.content}
          </Text>
          {contentLength > 200 && (
            <TouchableOpacity onPress={() => setShowFullContent(!showFullContent)}>
              <Text style={[styles.seeMore, { color: colors.textSecondary }]}>
                {showFullContent ? Strings.common.seeLess : Strings.common.seeMore}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Feeling & Location */}
      {(post.feeling || post.location) && (
        <View style={styles.feelingLocation}>
          {post.feeling && (
            <View style={styles.feelingContainer}>
              <Text style={[styles.feelingText, { color: colors.textSecondary }]}>
                dang cam thay {post.feeling}
              </Text>
            </View>
          )}
          {post.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={colors.textSecondary} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{post.location}</Text>
            </View>
          )}
        </View>
      )}

      {/* Media */}
      {renderMedia()}

      {/* Stats */}
      {(likesCount > 0 || post.commentsCount > 0 || post.sharesCount > 0) && (
        <View style={styles.statsContainer}>
          {likesCount > 0 && (
            <View style={styles.likeStat}>
              <View style={[styles.likeIcon, { backgroundColor: colors.like }]}>
                <Ionicons name="heart" size={12} color={colors.textLight} />
              </View>
              <Text style={[styles.statText, { color: colors.textTertiary }]}>{likesCount}</Text>
            </View>
          )}
          <View style={styles.rightStats}>
            {post.commentsCount > 0 && (
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {post.commentsCount} {Strings.post.comments}
              </Text>
            )}
            {post.sharesCount > 0 && (
              <Text style={[styles.statText, { color: colors.textTertiary }]}>
                {post.sharesCount} {Strings.post.shares}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? colors.like : colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }, isLiked && { color: colors.like }]}>
            {Strings.post.like}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons
            name="chatbox-outline"
            size={22}
            color={colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{Strings.post.comment}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons
            name="share-social-outline"
            size={22}
            color={colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>{Strings.post.share}</Text>
        </TouchableOpacity>
      </View>
    </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.sm,
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semiBold,
  },
  verifiedIcon: {
    marginLeft: Spacing.xs,
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeText: {
    fontSize: FontSize.sm,
  },
  privacyIcon: {
    marginLeft: Spacing.xs,
  },
  menuButton: {
    padding: Spacing.sm,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  content: {
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  seeMore: {
    fontWeight: FontWeight.medium,
    marginTop: Spacing.xs,
  },
  feelingLocation: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
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
  // Media styles
  singleImage: {
    width: '100%',
    height: 300,
  },
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
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  // Actions
  divider: {
    height: 1,
    marginHorizontal: Spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  actionText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },
});

export default PostCard;
