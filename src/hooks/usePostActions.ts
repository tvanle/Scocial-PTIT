import { useCallback } from 'react';
import { Share } from 'react-native';
import { Post } from '../types';
import { postService } from '../services/post/postService';

export const usePostActions = () => {
  const handleShare = useCallback((authorName: string) => {
    Share.share({ message: `Xem bài viết của ${authorName} trên PTIT Social!` });
  }, []);

  const handleRepost = useCallback(async (post: Post, onSuccess?: () => void) => {
    try {
      await postService.createPost({ content: post.content, privacy: 'PUBLIC' });
      onSuccess?.();
    } catch {}
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

  return { handleShare, handleRepost, handleToggleLike };
};
