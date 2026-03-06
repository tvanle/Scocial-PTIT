import { useCallback } from 'react';
import { Share } from 'react-native';
import { postService } from '../services/post/postService';

export const usePostActions = () => {
  const handleShare = useCallback((authorName: string) => {
    Share.share({ message: `Xem bài viết của ${authorName} trên PTIT Social!` });
  }, []);

  const handleToggleRepost = useCallback(async (postId: string, isCurrentlyShared: boolean) => {
    try {
      if (isCurrentlyShared) {
        await postService.unsharePost(postId);
      } else {
        await postService.sharePost(postId);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleToggleLike = useCallback(async (postId: string, isCurrentlyLiked: boolean) => {
    try {
      if (isCurrentlyLiked) {
        await postService.unlikePost(postId);
      } else {
        await postService.likePost(postId);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return { handleShare, handleToggleRepost, handleToggleLike };
};
