package com.ptit.social.post.service;

import com.ptit.social.post.dto.PostRequest;
import com.ptit.social.post.dto.PostResponse;
import com.ptit.social.post.model.Post;
import com.ptit.social.post.model.PostLike;
import com.ptit.social.post.repository.PostLikeRepository;
import com.ptit.social.post.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;

    @Transactional
    public PostResponse createPost(Long userId, PostRequest request) {
        Post post = new Post();
        post.setUserId(userId);
        post.setContent(request.getContent());
        post.setImageUrl(request.getImageUrl());
        post.setVideoUrl(request.getVideoUrl());
        post.setPrivacy(request.getPrivacy());

        post = postRepository.save(post);
        return toResponse(post, userId);
    }

    public Page<PostResponse> getNewsFeed(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return postRepository.findByOrderByCreatedAtDesc(pageable)
                .map(post -> toResponse(post, userId));
    }

    public Page<PostResponse> getUserPosts(Long targetUserId, Long currentUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return postRepository.findByUserIdOrderByCreatedAtDesc(targetUserId, pageable)
                .map(post -> toResponse(post, currentUserId));
    }

    public PostResponse getPost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));
        return toResponse(post, userId);
    }

    @Transactional
    public PostResponse likePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            PostLike like = new PostLike();
            like.setPostId(postId);
            like.setUserId(userId);
            postLikeRepository.save(like);

            post.setLikeCount(post.getLikeCount() + 1);
            post = postRepository.save(post);
        }

        return toResponse(post, userId);
    }

    @Transactional
    public PostResponse unlikePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            postLikeRepository.deleteByPostIdAndUserId(postId, userId);

            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            post = postRepository.save(post);
        }

        return toResponse(post, userId);
    }

    @Transactional
    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Bài viết không tồn tại"));

        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("Bạn không có quyền xóa bài viết này");
        }

        postRepository.delete(post);
    }

    private PostResponse toResponse(Post post, Long userId) {
        boolean isLiked = postLikeRepository.existsByPostIdAndUserId(post.getId(), userId);
        return new PostResponse(
                post.getId(),
                post.getUserId(),
                post.getContent(),
                post.getImageUrl(),
                post.getVideoUrl(),
                post.getLikeCount(),
                post.getCommentCount(),
                post.getShareCount(),
                post.getPrivacy(),
                isLiked,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
