import { useCallback } from 'react';
import { Alert, Share } from 'react-native';
import { Post } from '../types';
import { postService } from '../services/post/postService';

export const usePostActions = () => {
  const handleShare = useCallback((authorName: string) => {
    Share.share({ message: `Xem bài viết của ${authorName} trên PTIT Social!` });
  }, []);

  const handleRepost = useCallback((post: Post) => {
    Alert.alert('Đăng lại', 'Bạn muốn đăng lại bài viết này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng lại',
        onPress: async () => {
          try {
            await postService.createPost({ content: post.content, privacy: 'PUBLIC' });
            Alert.alert('Thành công', 'Đã đăng lại bài viết');
          } catch {
            Alert.alert('Lỗi', 'Không thể đăng lại. Vui lòng thử lại.');
          }
        },
      },
    ]);
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
