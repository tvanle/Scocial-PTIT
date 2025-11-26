import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card } from '../common';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Post } from '../../types';
import { formatTimeAgo } from '../../utils/dateUtils';

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
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    onLike?.();
  };

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case 'public':
        return 'globe-outline';
      case 'friends':
        return 'people-outline';
      case 'private':
        return 'lock-closed-outline';
      default:
        return 'globe-outline';
    }
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    const mediaCount = post.media.length;

    if (mediaCount === 1) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
          <Image
            source={{ uri: post.media[0].url }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (mediaCount === 2) {
      return (
        <View style={styles.twoImagesContainer}>
          {post.media.map((media, index) => (
            <TouchableOpacity
              key={media.id}
              style={styles.twoImageWrapper}
              onPress={onPress}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: media.url }}
                style={styles.twoImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // 3 or more images
    return (
      <View style={styles.multiImagesContainer}>
        <TouchableOpacity
          style={styles.mainImageWrapper}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: post.media[0].url }}
            style={styles.mainImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={styles.sideImagesContainer}>
          {post.media.slice(1, 3).map((media, index) => (
            <TouchableOpacity
              key={media.id}
              style={styles.sideImageWrapper}
              onPress={onPress}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: media.url }}
                style={styles.sideImage}
                resizeMode="cover"
              />
              {index === 1 && mediaCount > 3 && (
                <View style={styles.moreOverlay}>
                  <Text style={styles.moreText}>+{mediaCount - 3}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const contentLength = post.content.length;
  const shouldTruncate = contentLength > 200 && !showFullContent;

  return (
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
              <Text style={styles.userName}>{post.author.fullName}</Text>
              {post.author.isVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={Colors.primary}
                  style={styles.verifiedIcon}
                />
              )}
            </View>
            <View style={styles.postMeta}>
              <Text style={styles.timeText}>{formatTimeAgo(post.createdAt)}</Text>
              <Ionicons
                name={getPrivacyIcon()}
                size={12}
                color={Colors.textTertiary}
                style={styles.privacyIcon}
              />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content && (
        <View style={styles.contentContainer}>
          <Text style={styles.content}>
            {shouldTruncate ? post.content.slice(0, 200) + '...' : post.content}
          </Text>
          {contentLength > 200 && (
            <TouchableOpacity onPress={() => setShowFullContent(!showFullContent)}>
              <Text style={styles.seeMore}>
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
              <Text style={styles.feelingText}>
                đang cảm thấy {post.feeling}
              </Text>
            </View>
          )}
          {post.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={14} color={Colors.primary} />
              <Text style={styles.locationText}>{post.location}</Text>
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
              <View style={styles.likeIcon}>
                <Ionicons name="heart" size={12} color={Colors.textLight} />
              </View>
              <Text style={styles.statText}>{likesCount}</Text>
            </View>
          )}
          <View style={styles.rightStats}>
            {post.commentsCount > 0 && (
              <Text style={styles.statText}>
                {post.commentsCount} {Strings.post.comments}
              </Text>
            )}
            {post.sharesCount > 0 && (
              <Text style={styles.statText}>
                {post.sharesCount} {Strings.post.shares}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.divider} />
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={isLiked ? Colors.like : Colors.textSecondary}
          />
          <Text style={[styles.actionText, isLiked && styles.likedText]}>
            {Strings.post.like}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onComment}>
          <Ionicons
            name="chatbubble-outline"
            size={22}
            color={Colors.textSecondary}
          />
          <Text style={styles.actionText}>{Strings.post.comment}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons
            name="share-social-outline"
            size={22}
            color={Colors.textSecondary}
          />
          <Text style={styles.actionText}>{Strings.post.share}</Text>
        </TouchableOpacity>
      </View>
    </Card>
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
    color: Colors.textPrimary,
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
    color: Colors.textTertiary,
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
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  seeMore: {
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  // Media styles
  singleImage: {
    width: '100%',
    height: 300,
  },
  twoImagesContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  twoImageWrapper: {
    flex: 1,
  },
  twoImage: {
    width: '100%',
    height: 200,
  },
  multiImagesContainer: {
    flexDirection: 'row',
    height: 300,
    gap: 2,
  },
  mainImageWrapper: {
    flex: 2,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  sideImagesContainer: {
    flex: 1,
    gap: 2,
  },
  sideImageWrapper: {
    flex: 1,
    position: 'relative',
  },
  sideImage: {
    width: '100%',
    height: '100%',
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textLight,
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
    backgroundColor: Colors.like,
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
    color: Colors.textTertiary,
  },
  // Actions
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
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
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    marginLeft: Spacing.xs,
  },
  likedText: {
    color: Colors.like,
  },
});

export default PostCard;
